import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calculateDsr,
  calculateDti,
  calculateLtv,
  convertCurrency,
} from '@/lib/finance/ratios';

const d = (value: Decimal.Value) => new Decimal(value);

describe('finance ratios', () => {
  it('calculates DSR as annual debt payments divided by annual income', () => {
    expect(calculateDsr({ annualIncomeWon: d(60000000), annualDebtPaymentsWon: d(18000000) }).percent).toEqual(d(30));
  });

  it('calculates DTI as annual housing debt payments divided by annual income', () => {
    expect(calculateDti({ annualIncomeWon: d(50000000), annualHousingDebtPaymentsWon: d(10000000) }).percent).toEqual(d(20));
  });

  it('calculates LTV as loan divided by property value', () => {
    expect(calculateLtv({ loanWon: d(300000000), propertyValueWon: d(500000000) }).percent).toEqual(d(60));
  });

  it.each([
    ['DSR', calculateDsr({ annualIncomeWon: d(0), annualDebtPaymentsWon: d(10000000) }).percent],
    ['DTI', calculateDti({ annualIncomeWon: d(0), annualHousingDebtPaymentsWon: d(10000000) }).percent],
    ['LTV', calculateLtv({ loanWon: d(10000000), propertyValueWon: d(0) }).percent],
  ])('%s returns zero when its denominator is zero', (_label, percent) => {
    expect(percent).toEqual(d(0));
  });
});

describe('convertCurrency', () => {
  it('multiplies the amount by the manually entered won-per-unit rate', () => {
    expect(convertCurrency({ amount: d('123.45'), wonPerUnit: d('1350.5') }).amountWon).toEqual(d('166719.225'));
  });
});
