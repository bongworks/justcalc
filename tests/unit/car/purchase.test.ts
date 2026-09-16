import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculatePurchaseCost } from '@/lib/car/purchase';

describe('calculatePurchaseCost', () => {
  it('reuses an accurate annuity schedule at the high-term input boundary', () => {
    const result = calculatePurchaseCost({ vehiclePriceWon: new Decimal('12000000'), optionalCostWon: new Decimal(0), cashWon: new Decimal(0), financedPrincipalWon: new Decimal('12000000'), annualRatePercent: new Decimal(50), months: 1200 });
    expect(result.schedule.at(-1)?.payment.minus(result.monthlyPaymentWon).abs().lt('1e-40')).toBe(true);
    expect(result.installmentInterestWon.toFixed(6)).toBe('588000000.000000');
  });
  it('calculates the signed funding gap and equal-payment instalment cost', () => {
    const result = calculatePurchaseCost({
      vehiclePriceWon: new Decimal('30000000'),
      optionalCostWon: new Decimal('1000000'),
      cashWon: new Decimal('5000000'),
      financedPrincipalWon: new Decimal('20000000'),
      annualRatePercent: new Decimal('6'),
      months: 60,
    });

    expect(result.purchaseTotalWon.toString()).toBe('31000000');
    expect(result.fundingGapWon.toString()).toBe('6000000');
    expect(result.monthlyPaymentWon.gt(0)).toBe(true);
    expect(result.installmentInterestWon.gt(0)).toBe(true);
    expect(result.installmentTotalPaidWon.eq(result.installmentInterestWon.add(result.financedPrincipalWon))).toBe(true);
    expect(result.items.map(({ key }) => key)).toEqual([
      'vehiclePrice',
      'optionalCost',
      'cash',
      'financedPrincipal',
      'installmentTotalPaid',
      'fundingGap',
    ]);
  });

  it('preserves a negative funding gap when entered funding exceeds purchase cost', () => {
    const result = calculatePurchaseCost({
      vehiclePriceWon: new Decimal('30000000'),
      optionalCostWon: new Decimal('1000000'),
      cashWon: new Decimal('12000000'),
      financedPrincipalWon: new Decimal('20000000'),
      annualRatePercent: new Decimal('6'),
      months: 60,
    });

    expect(result.fundingGapWon.toString()).toBe('-1000000');
  });
});
