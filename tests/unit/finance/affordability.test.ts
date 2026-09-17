import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateLoanAffordability } from '@/lib/finance/affordability';

const d = (value: Decimal.Value) => new Decimal(value);

describe('calculateLoanAffordability', () => {
  it('returns zero after existing debt consumes the allowable payment', () => {
    const result = calculateLoanAffordability({
      netMonthlyIncomeWon: d(3000000),
      existingMonthlyDebtWon: d(1500000),
      allowedDebtRatioPercent: d(50),
      annualRatePercent: d(5),
      months: 240,
    });

    expect(result.maximumMonthlyDebtWon).toEqual(d(1500000));
    expect(result.availableMonthlyPaymentWon).toEqual(d(0));
    expect(result.affordablePrincipalWon).toEqual(d(0));
  });

  it('does not let debt above the allowance create a negative principal', () => {
    const result = calculateLoanAffordability({
      netMonthlyIncomeWon: d(3000000),
      existingMonthlyDebtWon: d(2000000),
      allowedDebtRatioPercent: d(50),
      annualRatePercent: d(5),
      months: 240,
    });

    expect(result.availableMonthlyPaymentWon).toEqual(d(0));
    expect(result.affordablePrincipalWon).toEqual(d(0));
  });

  it('uses payment times months when the interest rate is zero', () => {
    const result = calculateLoanAffordability({
      netMonthlyIncomeWon: d(4000000),
      existingMonthlyDebtWon: d(200000),
      allowedDebtRatioPercent: d(30),
      annualRatePercent: d(0),
      months: 120,
    });

    expect(result.maximumMonthlyDebtWon).toEqual(d(1200000));
    expect(result.availableMonthlyPaymentWon).toEqual(d(1000000));
    expect(result.affordablePrincipalWon).toEqual(d(120000000));
  });

  it('uses the zero-rate limit when a positive monthly rate is below calculation precision', () => {
    const result = calculateLoanAffordability({
      netMonthlyIncomeWon: d(3000000),
      existingMonthlyDebtWon: d(200000),
      allowedDebtRatioPercent: d(20),
      annualRatePercent: d('1e-100'),
      months: 12,
    });

    expect(result.affordablePrincipalWon).toEqual(d(4800000));
  });

  it('inverts the equal-payment formula at a positive rate', () => {
    const result = calculateLoanAffordability({
      netMonthlyIncomeWon: d(2400000),
      existingMonthlyDebtWon: d(0),
      allowedDebtRatioPercent: d(50),
      annualRatePercent: d(12),
      months: 2,
    });

    expect(result.availableMonthlyPaymentWon).toEqual(d(1200000));
    expect(result.affordablePrincipalWon.minus('2364474.07116949318694245662189981374375061268503087932555632').abs().lt('1e-50')).toBe(true);
  });

  it.each([0, -1, 1.5])('rejects invalid month count %s', (months) => {
    expect(() => calculateLoanAffordability({
      netMonthlyIncomeWon: d(3000000),
      existingMonthlyDebtWon: d(0),
      allowedDebtRatioPercent: d(50),
      annualRatePercent: d(5),
      months,
    })).toThrow();
  });
});
