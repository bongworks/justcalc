import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calculateAcquisitionTax,
  calculateBrokerageFee,
  calculateDepositRentConversion,
  calculateMovingBudget,
  calculateRentComparison,
  calculateRentalYield,
  calculateSetupBudget,
} from '@/lib/realestate/costs';
import { parseMoney, parseNonNegativeDecimal } from '@/lib/calculators/validation';

const d = (value: Decimal.Value) => new Decimal(value);

describe('property costs', () => {
  it('brokerage fee respects a cap', () => {
    expect(calculateBrokerageFee({ transactionWon: d(100000000), ratePercent: d(0.9), capWon: d(500000) }).feeWon).toEqual(d(500000));
  });

  it('keeps the calculated brokerage fee when below the cap', () => {
    expect(calculateBrokerageFee({ transactionWon: d(100000000), ratePercent: d(0.3), capWon: d(500000) }).feeWon).toEqual(d(300000));
  });

  it('honors a zero brokerage cap', () => {
    expect(calculateBrokerageFee({ transactionWon: d(100000000), ratePercent: d(0.9), capWon: d(0) }).feeWon).toEqual(d(0));
  });

  it('uses only the entered acquisition tax rate', () => {
    expect(calculateAcquisitionTax({ purchaseWon: d(300000000), ratePercent: d('1.25') }).taxWon).toEqual(d(3750000));
  });

  it.each([[6, 1200000], [12, 2400000], [0, 0]])('converts a deposit to rent for %s months', (months, rentWon) => {
    expect(calculateDepositRentConversion({ depositWon: d(60000000), conversionRatePercent: d(4), months }).rentWon).toEqual(d(rentWon));
  });

  it('adds monthly deposit opportunity cost to monthly rent', () => {
    expect(calculateRentComparison({ depositWon: d(60000000), monthlyRentWon: d(500000), conversionRatePercent: d(4) }).monthlyEquivalentWon).toEqual(d(700000));
  });

  it('rental yield is zero for zero purchase price', () => {
    expect(calculateRentalYield({ annualRentWon: d(12000000), purchaseWon: d(0), annualCostsWon: d(0) }).percent).toEqual(d(0));
  });

  it('deducts annual costs before calculating rental yield', () => {
    expect(calculateRentalYield({ annualRentWon: d(12000000), purchaseWon: d(200000000), annualCostsWon: d(2000000) }).percent).toEqual(d(5));
  });

  it('floors rental yield at zero when costs exceed rent', () => {
    expect(calculateRentalYield({ annualRentWon: d(1000000), purchaseWon: d(200000000), annualCostsWon: d(2000000) }).percent).toEqual(d(0));
  });

  it.each([calculateMovingBudget, calculateSetupBudget])('sums named budget items without mutating them', (calculate) => {
    const items = [{ name: '운송', amountWon: d(120000) }, { name: '설치', amountWon: d(30000) }];
    expect(calculate({ items }).totalWon).toEqual(d(150000));
    expect(items.map((item) => item.amountWon.toString())).toEqual(['120000', '30000']);
    expect(calculate({ items: [] }).totalWon).toEqual(d(0));
  });

  it('accepts zero costs and rejects negative money or rates at the parser boundary', () => {
    expect(calculateAcquisitionTax({ purchaseWon: parseMoney('0'), ratePercent: parseNonNegativeDecimal('0') }).taxWon).toEqual(d(0));
    expect(() => parseMoney('-1')).toThrow();
    expect(() => parseNonNegativeDecimal('-0.1')).toThrow();
  });
});
