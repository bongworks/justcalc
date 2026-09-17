import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calculateBreakEven,
  calculateCommissionSettlement,
  calculateMargin,
  calculateMarkup,
  calculateOnlineMarketSettlement,
  calculateVat,
} from '@/lib/business/profit';
import { parseMoney, parseNonNegativeDecimal } from '@/lib/calculators/validation';

const d = (value: Decimal.Value) => new Decimal(value);

describe('business profit', () => {
  it('break-even is unavailable when contribution margin is zero', () => {
    expect(calculateBreakEven({ fixedCostWon: d(100000), unitPriceWon: d(10000), variableCostWon: d(10000) })).toBeNull();
  });

  it('break-even is unavailable when contribution margin is negative', () => {
    expect(calculateBreakEven({ fixedCostWon: d(100000), unitPriceWon: d(9000), variableCostWon: d(10000) })).toBeNull();
  });

  it('rounds break-even units up to cover fixed costs', () => {
    expect(calculateBreakEven({ fixedCostWon: d(100000), unitPriceWon: d(10000), variableCostWon: d(7000) })).toEqual({ contributionMarginWon: d(3000), units: d(34), salesWon: d(340000) });
  });

  it('requires zero units for zero fixed costs and positive contribution margin', () => {
    expect(calculateBreakEven({ fixedCostWon: d(0), unitPriceWon: d(10000), variableCostWon: d(7000) })?.units).toEqual(d(0));
  });

  it.each([false, true])('splits VAT with includesVat=%s', (includesVat) => {
    expect(calculateVat({ supplyWon: d(includesVat ? 110000 : 100000), ratePercent: d(10), includesVat })).toEqual({ supplyWon: d(100000), vatWon: d(10000), totalWon: d(110000) });
  });

  it('handles a user-entered fractional VAT rate without rounding money', () => {
    expect(calculateVat({ supplyWon: d(10), ratePercent: d('7.5'), includesVat: false })).toEqual({ supplyWon: d(10), vatWon: d('0.75'), totalWon: d('10.75') });
  });

  it.each([false, true])('handles a zero VAT rate with includesVat=%s', (includesVat) => {
    expect(calculateVat({ supplyWon: d(100000), ratePercent: d(0), includesVat })).toEqual({ supplyWon: d(100000), vatWon: d(0), totalWon: d(100000) });
  });

  it('uses sales for margin and cost for markup', () => {
    const input = { salesWon: d(100000), costWon: d(80000) };
    expect(calculateMargin(input)).toEqual({ profitWon: d(20000), percent: d(20) });
    expect(calculateMarkup(input)).toEqual({ profitWon: d(20000), percent: d(25) });
  });

  it('preserves losses in margin and markup', () => {
    const input = { salesWon: d(80000), costWon: d(100000) };
    expect(calculateMargin(input)).toEqual({ profitWon: d(-20000), percent: d(-25) });
    expect(calculateMarkup(input)).toEqual({ profitWon: d(-20000), percent: d(-20) });
  });

  it('returns zero percentages when their denominators are zero', () => {
    expect(calculateMargin({ salesWon: d(0), costWon: d(100000) }).percent).toEqual(d(0));
    expect(calculateMarkup({ salesWon: d(100000), costWon: d(0) }).percent).toEqual(d(0));
  });

  const settlementInput = { grossSalesWon: d(100000), platformFeePercent: d('5.5'), paymentFeePercent: d('2.5'), shippingWon: d(3000) };

  it('deducts both gross-sales commissions and shipping', () => {
    expect(calculateCommissionSettlement(settlementInput)).toEqual({ platformFeeWon: d(5500), paymentFeeWon: d(2500), shippingWon: d(3000), totalDeductionsWon: d(11000), settlementWon: d(89000) });
  });

  it('preserves a settlement shortfall', () => {
    expect(calculateCommissionSettlement({ ...settlementInput, grossSalesWon: d(0) }).settlementWon).toEqual(d(-3000));
  });

  it('deducts optional returns after calculating online-market fees on gross sales', () => {
    expect(calculateOnlineMarketSettlement({ ...settlementInput, returnsWon: d(5000) })).toEqual({ platformFeeWon: d(5500), paymentFeeWon: d(2500), shippingWon: d(3000), returnsWon: d(5000), totalDeductionsWon: d(16000), settlementWon: d(84000) });
    expect(calculateOnlineMarketSettlement(settlementInput).settlementWon).toEqual(d(89000));
  });

  it('accepts zero values and rejects negative money or fees at the parser boundary', () => {
    const zero = parseMoney('0');
    expect(calculateCommissionSettlement({ grossSalesWon: zero, platformFeePercent: parseNonNegativeDecimal('0'), paymentFeePercent: zero, shippingWon: zero }).settlementWon).toEqual(d(0));
    expect(() => parseMoney('-1')).toThrow();
    expect(() => parseNonNegativeDecimal('-0.1')).toThrow();
  });
});
