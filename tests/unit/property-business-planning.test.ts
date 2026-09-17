import Decimal from 'decimal.js';
import { expect, it } from 'vitest';
import * as property from '@/lib/realestate/costs';
import * as business from '@/lib/business/profit';

const d = (value: number) => new Decimal(value);

it('limits affordable housing to entered cash plus the lower financing limit', () => {
  expect(property.calculateHousingAffordability).toBeTypeOf('function');
  const input = { cashWon: d(10000000), netMonthlyIncomeWon: d(3000000), existingMonthlyDebtWon: d(200000), allowedDebtRatioPercent: d(20), annualRatePercent: d(0), months: 12, loanLimitWon: d(4000000) };
  expect(property.calculateHousingAffordability(input).housingBudgetWon.toString()).toBe('14000000');
  expect(property.calculateHousingAffordability({ ...input, loanLimitWon: d(9000000) }).housingBudgetWon.toString()).toBe('14800000');
});

it('adds only explicitly entered annual holding expenses', () => {
  expect(property.calculateHoldingCosts).toBeTypeOf('function');
  expect(property.calculateHoldingCosts({ items: [{ name: '세금', amountWon: d(120000) }, { name: '관리', amountWon: d(240000) }] }).totalWon.toString()).toBe('360000');
  expect(property.calculateHoldingCosts({ items: [] }).totalWon.toString()).toBe('0');
});

it('deducts withholding on gross freelancer receipts and separately deducts expenses', () => {
  expect(business.calculateFreelancerNetIncome).toBeTypeOf('function');
  expect(business.calculateFreelancerNetIncome({ grossWon: d(1000000), expenseWon: d(200000), withholdingRatePercent: d(3) }).netWon.toString()).toBe('770000');
});

it('preserves monthly losses and marks nonpositive-profit payback unattainable', () => {
  expect(business.calculateMonthlyProfitLoss).toBeTypeOf('function');
  expect(business.calculateBusinessFeasibility).toBeTypeOf('function');
  const input = { salesWon: d(1000000), fixedCostWon: d(300000), variableCostWon: d(800000) };
  expect(business.calculateMonthlyProfitLoss(input).profitWon.toString()).toBe('-100000');
  expect(business.calculateBusinessFeasibility({ ...input, initialInvestmentWon: d(1000000) }).paybackMonths).toBeNull();
  expect(business.calculateBusinessFeasibility({ ...input, variableCostWon: d(200000), initialInvestmentWon: d(1000000) }).paybackMonths?.toString()).toBe('2');
});

it('calculates discount and rejects a zero original price', () => {
  expect(business.calculateDiscountRate).toBeTypeOf('function');
  expect(business.calculateDiscountRate({ originalWon: d(100000), discountedWon: d(80000) }).percent.toString()).toBe('20');
  expect(() => business.calculateDiscountRate({ originalWon: d(0), discountedWon: d(0) })).toThrow();
  expect(() => business.calculateDiscountRate({ originalWon: d(100), discountedWon: d(101) })).toThrow();
});
