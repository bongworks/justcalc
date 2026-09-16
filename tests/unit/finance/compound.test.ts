import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateCompoundSavings } from '@/lib/finance/compound';

const input = { initialPrincipal: new Decimal('1000000'), monthlyContribution: new Decimal('100000'), annualRatePercent: new Decimal(0), months: 12 };

describe('calculateCompoundSavings', () => {
  it.each([0, -1, 1.5])('rejects invalid month count %s instead of producing an inconsistent schedule', (months) => {
    expect(() => calculateCompoundSavings({ ...input, months })).toThrow();
  });

  it('adds contributions without interest at zero percent', () => {
    const result = calculateCompoundSavings(input);
    expect(result.totalPaid.toString()).toBe('2200000');
    expect(result.totalInterest.toString()).toBe('0');
    expect(result.maturityAmount.toString()).toBe('2200000');
    expect(result.rows).toHaveLength(12);
  });

  it('applies interest before each end-of-month contribution', () => {
    const result = calculateCompoundSavings({ initialPrincipal: new Decimal('1000'), monthlyContribution: new Decimal('100'), annualRatePercent: new Decimal('12'), months: 2 });
    expect(result.rows.map((row) => row.interest.toString())).toEqual(['10', '11.1']);
    expect(result.rows.map((row) => row.balance.toString())).toEqual(['1110', '1221.1']);
    expect(result.totalPaid.toString()).toBe('1200');
    expect(result.totalInterest.toString()).toBe('21.1');
    expect(result.maturityAmount.toString()).toBe('1221.1');
  });

  it('keeps balances non-decreasing for non-negative inputs', () => {
    const result = calculateCompoundSavings({ ...input, annualRatePercent: new Decimal('4.35'), months: 60 });
    let previous = input.initialPrincipal;
    for (const row of result.rows) {
      expect(row.balance.gte(previous)).toBe(true);
      previous = row.balance;
    }
  });

  it('omits after-tax output when no tax rate was supplied', () => {
    const result = calculateCompoundSavings(input);
    expect(result).not.toHaveProperty('afterTaxInterest');
    expect(result).not.toHaveProperty('afterTaxMaturityAmount');
  });

  it.each([['15.4', '8.46', '1108.46'], ['0', '10', '1110']])('applies a supplied tax rate of %s only to interest', (tax, interest, maturity) => {
    const result = calculateCompoundSavings({ initialPrincipal: new Decimal('1000'), monthlyContribution: new Decimal('100'), annualRatePercent: new Decimal('12'), months: 1, taxRatePercent: new Decimal(tax) });
    expect(result.afterTaxInterest?.toString()).toBe(interest);
    expect(result.afterTaxMaturityAmount?.toString()).toBe(maturity);
    expect(result.maturityAmount.toString()).toBe('1110');
  });
});
