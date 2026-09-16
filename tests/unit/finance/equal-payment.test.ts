import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateEqualPaymentLoan } from '@/lib/finance/loan';

describe('calculateEqualPaymentLoan', () => {
  it.each(['50', '100'])('preserves annuity payments at %s percent for 1200 months without a balloon', (rate) => {
    const Oracle = Decimal.clone({ precision: 160 });
    const principal = new Oracle('12000000');
    const monthlyRate = new Oracle(rate).div(1200);
    // Independent present-value formula (discount factor, not engine growth factor).
    const expected = principal.mul(monthlyRate).div(new Oracle(1).minus(new Oracle(1).add(monthlyRate).pow(-1200)));
    const originalPrecision = Decimal.precision;
    const result = calculateEqualPaymentLoan({ principal: new Decimal(principal), annualRatePercent: new Decimal(rate), months: 1200 });
    expect(Decimal.precision).toBe(originalPrecision);
    for (const row of result.rows) {
      expect(new Oracle(row.payment).minus(expected).abs().lt('1e-40')).toBe(true);
      expect(row.principal.gte(0)).toBe(true);
    }
    expect(new Oracle(result.totalInterest).minus(expected.mul(1200).minus(principal)).abs().lt('1e-40')).toBe(true);
    expect(result.rows.reduce((sum, row) => sum.add(row.principal), result.principal.mul(0)).eq(principal)).toBe(true);
    expect(result.rows.at(-1)?.balance.isZero()).toBe(true);
    if (rate === '50') expect(result.totalInterest.toFixed(6)).toBe('588000000.000000');
  });
  it('returns a complete schedule whose principal is fully repaid', () => {
    const result = calculateEqualPaymentLoan({
      principal: new Decimal('12000000'),
      annualRatePercent: new Decimal('6'),
      months: 12,
    });

    expect(result.rows).toHaveLength(12);
    expect(result.rows.at(-1)?.balance.toString()).toBe('0');
    expect(
      result.rows.reduce((sum, row) => sum.add(row.principal), new Decimal(0)).toString(),
    ).toBe('12000000');
    expect(result.totalPaid.eq(result.principal.add(result.totalInterest))).toBe(true);
  });

  it('pays exactly one twelfth of principal each month at zero percent', () => {
    const result = calculateEqualPaymentLoan({
      principal: new Decimal('12000000'),
      annualRatePercent: new Decimal('0'),
      months: 12,
    });

    expect(result.rows.every((row) => row.payment.eq('1000000'))).toBe(true);
    expect(result.totalInterest.toString()).toBe('0');
    expect(result.rows.at(-1)?.balance.toString()).toBe('0');
  });

  it('reconciles 60-month schedule totals to the original principal and reported payment', () => {
    const result = calculateEqualPaymentLoan({
      principal: new Decimal('20000000'),
      annualRatePercent: new Decimal('6'),
      months: 60,
    });
    const scheduledPrincipal = result.rows.reduce(
      (sum, row) => sum.add(row.principal),
      result.principal.mul(0),
    );
    const scheduledPayments = result.rows.reduce(
      (sum, row) => sum.add(row.payment),
      result.principal.mul(0),
    );

    expect(scheduledPrincipal.eq(result.principal)).toBe(true);
    expect(result.totalPaid.eq(scheduledPayments)).toBe(true);
    expect(result.rows.at(-1)?.balance.toString()).toBe('0');
  });

  it('reports a non-positive equal-payment denominator', () => {
    expect(() =>
      calculateEqualPaymentLoan({
        principal: new Decimal('12000000'),
        annualRatePercent: new Decimal('-12'),
        months: 12,
      }),
    ).toThrow('원리금균등 상환식의 분모는 0보다 커야 합니다.');
  });
});
