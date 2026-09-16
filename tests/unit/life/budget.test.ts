import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateMonthlyBudget } from '@/lib/life/budget';

const input = {
  incomeWon: new Decimal('3000000'),
  housingWon: new Decimal('1000000'),
  carWon: new Decimal('300000'),
  foodWon: new Decimal('500000'),
  communicationsWon: new Decimal('100000'),
  healthWon: new Decimal('100000'),
  otherFixedWon: new Decimal('200000'),
  variableWon: new Decimal('300000'),
  savingsTargetWon: new Decimal('500000'),
};

describe('calculateMonthlyBudget', () => {
  it('totals expenses separately from savings and calculates income and category ratios', () => {
    const result = calculateMonthlyBudget(input);
    expect(result.totalSpendingWon.toString()).toBe('2500000');
    expect(result.spendingRatio.eq(new Decimal(5).div(6))).toBe(true);
    expect(result.remainingAfterSavingsWon.toString()).toBe('0');
    expect(result.categories.map(({ key, costWon, ratio }) => [key, costWon.toString(), ratio.toString()])).toEqual([
      ['housing', '1000000', '0.4'],
      ['car', '300000', '0.12'],
      ['food', '500000', '0.2'],
      ['communications', '100000', '0.04'],
      ['health', '100000', '0.04'],
      ['otherFixed', '200000', '0.08'],
      ['variable', '300000', '0.12'],
    ]);
  });

  it('preserves negative remaining money for a shortfall', () => {
    const result = calculateMonthlyBudget({ ...input, savingsTargetWon: new Decimal('600000') });
    expect(result.remainingAfterSavingsWon.toString()).toBe('-100000');
  });

  it('returns zero ratios for zero total expenses and zero income', () => {
    const zeroInput = Object.fromEntries(Object.keys(input).map((key) => [key, new Decimal(0)])) as typeof input;
    const result = calculateMonthlyBudget(zeroInput);
    expect(result.totalSpendingWon.toString()).toBe('0');
    expect(result.spendingRatio.toString()).toBe('0');
    expect(result.categories.every((category) => category.ratio.isZero())).toBe(true);
  });

  it('keeps zero-income results finite when expenses exist', () => {
    const result = calculateMonthlyBudget({ ...input, incomeWon: new Decimal(0) });
    expect(result.spendingRatio.toString()).toBe('0');
    expect(result.remainingAfterSavingsWon.toString()).toBe('-3000000');
  });
});
