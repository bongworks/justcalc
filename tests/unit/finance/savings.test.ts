import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calculateDepositInterest,
  calculateSavingsMaturity,
} from '@/lib/finance/savings';

const d = (value: Decimal.Value) => new Decimal(value);

describe('calculateSavingsMaturity', () => {
  it.each([
    ['simple', 'beginning', '3000'],
    ['simple', 'end', '1000'],
    ['monthly', 'beginning', '3010'],
    ['monthly', 'end', '1000'],
  ] as const)('uses %s interest with %s contributions', (interestType, contributionTiming, interest) => {
    const result = calculateSavingsMaturity({ monthlyContribution: d(100000), annualRatePercent: d(12), months: 2, taxRatePercent: d(10), interestType, contributionTiming });
    expect(result.totalInterest.toString()).toBe(interest);
    expect(result.totalPaid.toString()).toBe('200000');
    expect(result.interestType).toBe(interestType);
    expect(result.contributionTiming).toBe(contributionTiming);
  });

  it('matches a twelve-payment ordinary simple savings fixture after tax', () => {
    // Each 100000 deposit earns 500 per month, over 12+11+...+1 = 78 months.
    const result = calculateSavingsMaturity({ monthlyContribution: d(100000), annualRatePercent: d(6), months: 12, taxRatePercent: d('15.4'), interestType: 'simple', contributionTiming: 'beginning' });
    expect(result.totalInterest.toString()).toBe('39000');
    expect(result.tax.toString()).toBe('6006');
    expect(result.afterTaxMaturityAmount.toString()).toBe('1232994');
  });

  it.each(['simple', 'monthly'] as const)('earns one month of %s interest only for beginning contributions', (interestType) => {
    const input = { monthlyContribution: d(100000), annualRatePercent: d(12), months: 1, taxRatePercent: d(0), interestType };
    expect(calculateSavingsMaturity({ ...input, contributionTiming: 'beginning' }).totalInterest.toString()).toBe('1000');
    expect(calculateSavingsMaturity({ ...input, contributionTiming: 'end' }).totalInterest.toString()).toBe('0');
    expect(calculateSavingsMaturity({ ...input, annualRatePercent: d(0), contributionTiming: 'beginning' }).afterTaxMaturityAmount.toString()).toBe('100000');
  });

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
  it('supports monthly-compounded deposit interest without recurring contributions', () => {
    const result = calculateDepositInterest({ principal: d(100000), annualRatePercent: d(12), months: 2, taxRatePercent: d(10), interestType: 'monthly' });
    expect(result.totalInterest.toString()).toBe('2010');
    expect(result.tax.toString()).toBe('201');
    expect(result.afterTaxMaturityAmount.toString()).toBe('101809');
    expect(result.interestType).toBe('monthly');
  });

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
