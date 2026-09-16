import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateRepaymentPlans, calculateSimpleInterest } from '@/lib/finance/loan';

describe('calculateRepaymentPlans', () => {
  it('matches independent equal-principal and bullet totals at 50 percent for 1200 months', () => {
    const plans = calculateRepaymentPlans({ principal: new Decimal('12000000'), annualRatePercent: new Decimal(50), months: 1200 });
    // Equal principal: 500000 * (1200 + 1) / 2. Bullet: 500000 * 1200.
    expect(plans.equalPrincipal.totalInterest.minus('300250000').abs().lt('1e-40')).toBe(true);
    expect(plans.bullet.totalInterest.minus('600000000').abs().lt('1e-40')).toBe(true);
  });
  it.each([
    ['12000000', '6', 12],
    ['20000000', '6', 60],
    ['1000', '0', 3],
    ['12345678.91', '4.37', 360],
    ['1200', '6', 1],
    ['0', '6', 12],
    ['12000000', '50', 1200],
  ])('reconciles every schedule for %s at %s percent over %s months', (amount, rate, months) => {
    const principal = new Decimal(amount);
    const plans = calculateRepaymentPlans({ principal, annualRatePercent: new Decimal(rate), months });

    for (const plan of [plans.equalPayment, plans.equalPrincipal, plans.bullet]) {
      expect(plan.rows).toHaveLength(months);
      expect(plan.rows.at(-1)?.balance.toString()).toBe('0');
      // Sum in the returned schedule's precision context, without down-rounding
      // every row through the unrelated default Decimal constructor.
      expect(plan.rows.reduce((sum, row) => sum.add(row.principal), plan.totalPaid.mul(0)).eq(principal)).toBe(true);
      expect(plan.rows.reduce((sum, row) => sum.add(row.payment), plan.totalPaid.mul(0)).eq(plan.totalPaid)).toBe(true);
      expect(plan.totalPaid.eq(plan.totalInterest.add(principal))).toBe(true);
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
