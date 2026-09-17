import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calculateDepreciation,
  calculateHighwayTollBudget,
  calculateLeasePurchaseComparison,
  calculateRentalLeaseComparison,
  calculateTotalOwnership,
} from '@/lib/car/comparison';

const d = (value: Decimal.Value) => new Decimal(value);

describe('vehicle comparison calculations', () => {
  it('compares lease cost with purchase cost after retained vehicle value', () => {
    const result = calculateLeasePurchaseComparison({
      purchaseMonthlyWon: d(800000),
      leaseMonthlyWon: d(650000),
      months: 36,
      purchaseResidualWon: d(15000000),
      leaseInitialWon: d(3000000),
    });

    expect(result.purchaseTotalWon).toEqual(d(13800000));
    expect(result.leaseTotalWon).toEqual(d(26400000));
    expect(result.differenceWon).toEqual(d(-12600000));
  });

  it('compares rental and lease using the same monthly period', () => {
    const result = calculateRentalLeaseComparison({
      rentalMonthlyWon: d(700000),
      leaseMonthlyWon: d(600000),
      months: 24,
    });

    expect(result.rentalTotalWon).toEqual(d(16800000));
    expect(result.leaseTotalWon).toEqual(d(14400000));
    expect(result.differenceWon).toEqual(d(2400000));
  });

  it('calculates depreciation over the selected non-zero term', () => {
    const result = calculateDepreciation({
      purchaseWon: d(30000000),
      residualWon: d(18000000),
      months: 48,
    });

    expect(result.totalLossWon).toEqual(d(12000000));
    expect(result.monthlyLossWon).toEqual(d(250000));
  });

  it('subtracts resale value once from total ownership cost', () => {
    const result = calculateTotalOwnership({
      purchaseCostWon: d(30000000),
      annualRunningWon: d(3000000),
      years: 3,
      resaleWon: d(15000000),
    });

    expect(result.totalWon).toEqual(d(24000000));
  });

  it('budgets both directions of every return highway trip', () => {
    expect(
      calculateHighwayTollBudget({ oneWayTollWon: d(8500), returnTrips: 4 }).totalWon,
    ).toEqual(d(68000));
  });

  it('rejects zero-length comparison and depreciation periods', () => {
    expect(() =>
      calculateLeasePurchaseComparison({
        purchaseMonthlyWon: d(800000),
        leaseMonthlyWon: d(650000),
        months: 0,
        purchaseResidualWon: d(15000000),
        leaseInitialWon: d(3000000),
      }),
    ).toThrow('기간은 0보다 큰 정수여야 합니다.');

    expect(() =>
      calculateDepreciation({ purchaseWon: d(30000000), residualWon: d(18000000), months: 0 }),
    ).toThrow('기간은 0보다 큰 정수여야 합니다.');
  });
});
