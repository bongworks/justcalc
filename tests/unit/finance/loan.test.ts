import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateRepaymentPlans, calculateSimpleInterest } from '@/lib/finance/loan';

describe('calculateRepaymentPlans', () => {
  it.each([
    ['12000000', '6', 12],
    ['20000000', '6', 60],
    ['1000', '0', 3],
    ['12345678.91', '4.37', 360],
    ['1200', '6', 1],
    ['0', '6', 12],
  ])('reconciles every schedule for %s at %s percent over %s months', (amount, rate, months) => {
    const principal = new Decimal(amount);
    const plans = calculateRepaymentPlans({ principal, annualRatePercent: new Decimal(rate), months });

    for (const plan of [plans.equalPayment, plans.equalPrincipal, plans.bullet]) {
      expect(plan.rows).toHaveLength(months);
      expect(plan.rows.at(-1)?.balance.toString()).toBe('0');
      expect(plan.rows.reduce((sum, row) => sum.add(row.principal), new Decimal(0)).eq(principal)).toBe(true);
      expect(plan.rows.reduce((sum, row) => sum.add(row.payment), new Decimal(0)).eq(plan.totalPaid)).toBe(true);
      expect(plan.totalPaid.eq(principal.add(plan.totalInterest))).toBe(true);
      for (const row of plan.rows) {
        expect(row.payment.eq(row.principal.add(row.interest))).toBe(true);
        expect(row.balance.gte(0)).toBe(true);
      }
    }
  });

  it('uses principal-only division at zero percent', () => {
    const plans = calculateRepaymentPlans({ principal: new Decimal('1200'), annualRatePercent: new Decimal(0), months: 12 });
    expect(plans.equalPayment.monthlyPayment.toString()).toBe('100');
    expect(plans.equalPayment.rows[0]?.payment.toString()).toBe('100');
    for (const plan of [plans.equalPayment, plans.equalPrincipal, plans.bullet]) expect(plan.totalInterest.toString()).toBe('0');
    expect(plans.bullet.monthlyInterestPayment.toString()).toBe('0');
    expect(plans.bullet.finalPayment.toString()).toBe('1200');
  });

  it('charges equal-principal interest on each opening balance', () => {
    const { equalPrincipal } = calculateRepaymentPlans({ principal: new Decimal('1200'), annualRatePercent: new Decimal('12'), months: 3 });
    expect(equalPrincipal.rows.map((row) => row.payment.toString())).toEqual(['412', '408', '404']);
    expect(equalPrincipal.firstPayment.toString()).toBe('412');
    expect(equalPrincipal.lastPayment.toString()).toBe('404');
    expect(equalPrincipal.totalInterest.toString()).toBe('24');
    expect(equalPrincipal.totalPaid.toString()).toBe('1224');
  });

  it('pays interest monthly and all bullet principal in the final month', () => {
    const { bullet } = calculateRepaymentPlans({ principal: new Decimal('1200'), annualRatePercent: new Decimal('12'), months: 3 });
    expect(bullet.rows.map((row) => row.principal.toString())).toEqual(['0', '0', '1200']);
    expect(bullet.rows.map((row) => row.balance.toString())).toEqual(['1200', '1200', '0']);
    expect(bullet.monthlyInterestPayment.toString()).toBe('12');
    expect(bullet.finalPayment.toString()).toBe('1212');
    expect(bullet.totalInterest.toString()).toBe('36');
    expect(bullet.totalPaid.toString()).toBe('1236');
  });
});

describe('calculateSimpleInterest', () => {
  it.each([
    [365, '366'],
    [366, '365'],
  ] as const)('uses the selected %s day denominator', (daysInYear, expectedInterest) => {
    const result = calculateSimpleInterest({ principal: new Decimal('1335900'), annualRatePercent: new Decimal('10'), period: new Decimal(1), periodUnit: 'days', daysInYear });
    expect(result.interest.toString()).toBe(expectedInterest);
    expect(result.maturityAmount.eq(new Decimal('1335900').add(expectedInterest))).toBe(true);
  });

  it.each([
    ['months', '6', '600'],
    ['years', '2', '2400'],
  ] as const)('calculates a period in %s', (periodUnit, period, interest) => {
    const result = calculateSimpleInterest({ principal: new Decimal('10000'), annualRatePercent: new Decimal('12'), period: new Decimal(period), periodUnit });
    expect(result.interest.toString()).toBe(interest);
  });

  it('returns the original principal at zero interest', () => {
    const result = calculateSimpleInterest({ principal: new Decimal('123.45'), annualRatePercent: new Decimal(0), period: new Decimal(12), periodUnit: 'months' });
    expect(result.interest.toString()).toBe('0');
    expect(result.maturityAmount.toString()).toBe('123.45');
  });
});
