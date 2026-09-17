import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calculateElectricityEstimate,
  calculatePercentage,
  calculatePhonePlanCost,
  calculateSplitExpense,
  calculateTipSplit,
} from '@/lib/life/everyday';

const d = (value: Decimal.Value) => new Decimal(value);

describe('everyday calculations', () => {
  it('calculates a percentage and returns zero when the whole is zero', () => {
    expect(calculatePercentage({ part: d(25), whole: d(200) }).percentage.eq(d('12.5'))).toBe(true);
    expect(calculatePercentage({ part: d(25), whole: d(0) }).percentage.isZero()).toBe(true);
  });

  it('splits whole-won expenses while preserving the remainder', () => {
    const result = calculateSplitExpense({ totalWon: d(10000), people: 3 });
    expect(result.perPersonWon.eq(d(3333))).toBe(true);
    expect(result.remainderWon.eq(d(1))).toBe(true);
  });

  it('rejects invalid participant counts and fractional won splits', () => {
    for (const people of [0, -1, 1.5]) {
      expect(() => calculateSplitExpense({ totalWon: d(10000), people })).toThrow('인원');
    }
    expect(() => calculateSplitExpense({ totalWon: d('10000.5'), people: 3 })).toThrow('정수');
  });

  it('estimates electricity cost from usage, unit price, and base fee', () => {
    const result = calculateElectricityEstimate({ kwh: d(250), wonPerKwh: d('120.5'), baseWon: d(1600) });
    expect(result.totalWon.eq(d(31725))).toBe(true);
  });

  it('totals phone service, device cost, and discount', () => {
    const result = calculatePhonePlanCost({ monthlyWon: d(50000), months: 24, deviceWon: d(600000), discountWon: d(120000) });
    expect(result.totalWon.eq(d(1680000))).toBe(true);
  });

  it('calculates a tip and splits the combined bill without float drift', () => {
    const result = calculateTipSplit({ billWon: d(50000), tipPercent: d('12.5'), people: 3 });
    expect(result.tipWon.eq(d(6250))).toBe(true);
    expect(result.totalWon.eq(d(56250))).toBe(true);
    expect(result.perPersonWon.eq(d(18750))).toBe(true);
  });
});
