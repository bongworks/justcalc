import { expect, it } from 'vitest';
import { getCalculatorBySlug } from '@/lib/calculators/registry';

const evaluate = (slug: string, input: Record<string, string>) => {
  const definition = getCalculatorBySlug(slug)!;
  return definition.evaluate({ ...Object.fromEntries(definition.fields.map((field) => [field.name, field.defaultValue ?? ''])), ...input });
};

it('defaults regular savings to beginning-of-month simple interest and supports another model', () => {
  const input = { monthlyContribution: '100000', annualRatePercent: '6', months: '12', taxRatePercent: '15.4' };
  expect(evaluate('savings-maturity', input).summary.value).toBe('₩1,232,994');
  expect(evaluate('savings-maturity', { ...input, interestType: 'monthly', contributionTiming: 'end' }).summary.value).toBe('₩1,228,389');
});

it('uses deposit compound interest when selected', () => {
  expect(evaluate('deposit-interest', { principal: '1000000', annualRatePercent: '12', months: '2', taxRatePercent: '0', interestType: 'monthly' }).summary.value).toBe('₩1,020,100');
});

it('explains the actual compound deposit timing in both result and schedule', () => {
  const result = evaluate('compound-interest', { initialPrincipal: '0', monthlyContribution: '100000', annualRatePercent: '12', months: '2', contributionTiming: 'beginning', taxRatePercent: '0' });
  expect(result.summary.value).toBe('₩203,010');
  expect(result.rows).toContainEqual({ label: '계산 가정', value: '월 복리 · 매월 초 납입 · 만기 이자에 세율 적용' });
  expect(result.savingsCaption).toContain('매월 초');
});

it('includes the interest-only grace period and gives a numeric comparison', () => {
  const result = evaluate('loan-repayment', { principal: '1200', annualRatePercent: '12', months: '3', graceMonths: '1' });
  expect(result.summary.value).toBe('₩6');
  expect(result.rows).toContainEqual({ label: '원금균등 총이자', value: '₩30' });
  expect(result.schedules![1].rows.map((row) => row.payment.toNumber())).toEqual([12, 612, 606]);
});

it('uses equal principal card payments and supports partial interest-free periods', () => {
  const input = { principal: '1200000', annualRatePercent: '18', months: '12' };
  const normal = evaluate('card-instalment', input);
  expect(normal.summary.value).toBe('₩118,000');
  expect(normal.rows).toContainEqual({ label: '총 할부 수수료', value: '₩117,000' });
  const partial = evaluate('card-instalment', { ...input, feeMode: 'partial', chargedMonths: '3' });
  expect(partial.rows).toContainEqual({ label: '총 할부 수수료', value: '₩49,500' });
  expect(partial.schedules![0].rows[3].payment.toNumber()).toBe(100000);
  expect(evaluate('card-instalment', { ...input, feeMode: 'free', annualRatePercent: '' }).summary.value).toBe('₩100,000');
  expect(() => evaluate('card-instalment', { ...input, feeMode: 'partial', chargedMonths: '13' })).toThrow();
});

it('withholds on gross income and separates money left after expenses', () => {
  const result = evaluate('freelancer-withholding', { grossWon: '1000000', deductibleExpenseWon: '200000', withholdingRatePercent: '3.3' });
  expect(result.summary.value).toBe('₩967,000');
  expect(result.rows).toContainEqual({ label: '경비 지출 후 남는 금액', value: '₩767,000' });
});

it('includes other loan interest in DTI', () => {
  expect(evaluate('dti', { annualIncomeWon: '60000000', annualHousingDebtPaymentsWon: '9000000', annualOtherDebtInterestWon: '3000000' }).summary.value).toBe('20%');
});

it('preserves a rental loss and shows an undefined base honestly', () => {
  expect(evaluate('rental-yield', { annualRentWon: '5000000', annualCostsWon: '6000000', purchaseWon: '100000000' }).summary.value).toBe('-1%');
  for (const slug of ['dsr', 'dti', 'ltv', 'margin', 'markup', 'rental-yield']) {
    const definition = getCalculatorBySlug(slug)!;
    expect(definition.evaluate(Object.fromEntries(definition.fields.map(({ name }) => [name, '0']))).summary.value).toBe('계산 불가');
  }
});
