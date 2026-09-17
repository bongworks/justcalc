import { expect, it } from 'vitest';
import { getCalculatorByCategoryAndSlug, getCalculatorBySlug } from '@/lib/calculators/registry';

it.each([
  ['savings-maturity', { monthlyContribution: '100000', annualRatePercent: '12', months: '2', taxRatePercent: '10' }, '₩200,900'],
  ['deposit-interest', { principal: '1000000', annualRatePercent: '6', months: '12', taxRatePercent: '10' }, '₩1,054,000'],
  ['loan-affordability', { netMonthlyIncomeWon: '3000000', existingMonthlyDebtWon: '200000', allowedDebtRatioPercent: '20', annualRatePercent: '0', months: '12' }, '₩4,800,000'],
  ['dsr', { annualIncomeWon: '60000000', annualDebtPaymentsWon: '12000000' }, '20%'],
  ['dti', { annualIncomeWon: '60000000', annualHousingDebtPaymentsWon: '9000000' }, '15%'],
  ['ltv', { loanWon: '300000000', propertyValueWon: '500000000' }, '60%'],
  ['manual-exchange-rate', { amount: '100.5', wonPerUnit: '1300.5' }, '₩130,700'],
] satisfies Array<[string, Record<string, string>, string]>)('uses entered values in %s', (slug, input, value) => {
  expect(getCalculatorBySlug(slug)!.evaluate(input).summary.value).toBe(value);
});

it('renders card instalment with the existing equal-payment monthly schedule', () => {
  const result = getCalculatorBySlug('card-instalment')!.evaluate({ principal: '1200000', annualRatePercent: '0', months: '12' });
  expect(result.summary.value).toBe('₩100,000');
  expect(result.schedules).toHaveLength(1);
  expect(result.schedules![0].rows).toHaveLength(12);
  expect(result.schedules![0].rows.at(-1)!.balance.toString()).toBe('0');
  expect(result.rows).toContainEqual({ label: '총이자', value: '₩0' });
});

it.each(['dsr', 'dti', 'ltv'])('explains the undefined zero-base convention for %s', (slug) => {
  const definition = getCalculatorBySlug(slug)!;
  const raw = Object.fromEntries(definition.fields.map(({ name }) => [name, '0']));
  const result = definition.evaluate(raw);
  expect(result.summary.value).toBe('0%');
  expect(result.rows?.some(({ value }) => value.includes('0%'))).toBe(true);
});

it.each([
  ['savings-maturity', { monthlyContribution: '100000', annualRatePercent: '3', months: '1.5', taxRatePercent: '10' }],
  ['deposit-interest', { principal: '1000000', annualRatePercent: '3', months: '12', taxRatePercent: '101' }],
  ['loan-affordability', { netMonthlyIncomeWon: '3000000', existingMonthlyDebtWon: '0', allowedDebtRatioPercent: '', annualRatePercent: '3', months: '12' }],
  ['manual-exchange-rate', { amount: '100', wonPerUnit: '0' }],
] satisfies Array<[string, Record<string, string>]>)('rejects invalid inputs for %s', (slug, raw) => {
  expect(() => getCalculatorBySlug(slug)!.evaluate(raw)).toThrow();
});

it('distinguishes entered initial cash from additional cash required for a purchase', () => {
  const result = getCalculatorBySlug('purchase-cost')!.evaluate({
    vehiclePriceWon: '30000000',
    optionalCostWon: '2000000',
    cashWon: '10000000',
    financedPrincipalWon: '20000000',
    annualRatePercent: '6',
    months: '12',
  });

  expect(result.summary).toEqual({ label: '입력한 초기 현금', value: '₩10,000,000' });
  expect(result.rows).toContainEqual({ label: '구매 총비용', value: '₩32,000,000' });
  expect(result.rows).toContainEqual({ label: '자금 조달 차이 (추가 필요)', value: '₩2,000,000' });
});

it('keeps examples but does not expose the implementation maximum in visible hints', () => {
  const maintenance = getCalculatorBySlug('maintenance-cost')!;
  const annualDistance = maintenance.fields.find((field) => field.name === 'annualDistanceKm');
  const insurance = maintenance.fields.find((field) => field.name === 'insuranceWon');

  expect(annualDistance?.hint).toBe('예: 12,000');
  expect(insurance?.hint).toBe('원 단위 정수로 입력 · 예: 800,000');
  expect(JSON.stringify(maintenance.fields)).not.toContain('최대 1,000조');
});

it('registers salary calculators with the canonical salary route and an estimate warning', () => {
  expect(getCalculatorByCategoryAndSlug('salary', 'severance-pay')).toMatchObject({
    route: '/salary/severance-pay/',
    title: '퇴직금 계산기',
  });
  expect(getCalculatorBySlug('take-home-pay')?.guide.limitations.join(' ')).toMatch(/예상/);
});

it.each([
  ['40000000', '44000000', '10%'],
  ['40000000', '36000000', '-10%'],
  ['0', '12000000', '0%'],
])('renders a finite signed salary-negotiation increase rate for %s to %s', (currentAnnualWon, desiredAnnualWon, expectedRate) => {
  const result = getCalculatorBySlug('salary-negotiation')!.evaluate({ currentAnnualWon, desiredAnnualWon });

  expect(result.rows).toContainEqual({ label: '연봉 인상률', value: expectedRate });
  expect(result.rows?.find((row) => row.label === '연봉 인상률')?.value).not.toMatch(/NaN|Infinity/);
});
