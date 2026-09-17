import { expect, it } from 'vitest';
import { getCalculatorByCategoryAndSlug, getCalculatorBySlug } from '@/lib/calculators/registry';

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
