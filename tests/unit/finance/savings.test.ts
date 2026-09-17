import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calculateDepositInterest,
  calculateSavingsMaturity,
} from '@/lib/finance/savings';

const d = (value: Decimal.Value) => new Decimal(value);

describe('calculateSavingsMaturity', () => {
  it('accrues interest only after each month-end contribution has been deposited', () => {
    const result = calculateSavingsMaturity({
      monthlyContribution: d(100000),
      annualRatePercent: d(12),
      months: 2,
      taxRatePercent: d(15.4),
    });

    expect(result.totalPaid).toEqual(d(200000));
    expect(result.totalInterest).toEqual(d(1000));
    expect(result.tax).toEqual(d(154));
    expect(result.afterTaxInterest).toEqual(d(846));
    expect(result.afterTaxMaturityAmount).toEqual(d(200846));
  });

  it('returns contributions unchanged at zero percent', () => {
    const result = calculateSavingsMaturity({
      monthlyContribution: d(123456),
      annualRatePercent: d(0),
      months: 12,
      taxRatePercent: d(15.4),
    });

    expect(result.totalPaid).toEqual(d(1481472));
    expect(result.totalInterest).toEqual(d(0));
    expect(result.afterTaxMaturityAmount).toEqual(d(1481472));
  });

  it.each([0, -1, 1.5])('rejects invalid month count %s', (months) => {
    expect(() => calculateSavingsMaturity({
      monthlyContribution: d(100000),
      annualRatePercent: d(3),
      months,
      taxRatePercent: d(15.4),
    })).toThrow();
  });
});

describe('calculateDepositInterest', () => {
  it('applies the entered tax rate to gross simple interest', () => {
    const result = calculateDepositInterest({
      principal: d(10000000),
      annualRatePercent: d(3),
      months: 12,
      taxRatePercent: d(15.4),
    });

    expect(result.totalInterest).toEqual(d(300000));
    expect(result.tax).toEqual(d(46200));
    expect(result.afterTaxInterest).toEqual(d(253800));
    expect(result.afterTaxMaturityAmount).toEqual(d(10253800));
  });

  it('prorates simple interest by the entered month count', () => {
    const result = calculateDepositInterest({
      principal: d(1200000),
      annualRatePercent: d(6),
      months: 3,
      taxRatePercent: d(0),
    });

    expect(result.totalInterest).toEqual(d(18000));
    expect(result.afterTaxInterest).toEqual(d(18000));
  });

  it.each([0, -1, 1.5])('rejects invalid month count %s', (months) => {
    expect(() => calculateDepositInterest({
      principal: d(1000000),
      annualRatePercent: d(3),
      months,
      taxRatePercent: d(15.4),
    })).toThrow();
  });
});
