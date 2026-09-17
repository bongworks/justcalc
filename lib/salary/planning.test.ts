import Decimal from 'decimal.js';
import { expect, test } from 'vitest';
import { calculateFreelancerWithholding, calculateSalaryNegotiation } from './planning';

const d = (value: Decimal.Value) => new Decimal(value);
expect.addEqualityTesters([(a, b) => Decimal.isDecimal(a) && Decimal.isDecimal(b) ? a.eq(b) : undefined]);

test.each([[40000000, 44000000, 4000000, 10], [40000000, 36000000, -4000000, -10], [0, 12000000, 12000000, 0]])('negotiation from %i to %i has finite signed differences', (current, desired, difference, percent) => {
  const result = calculateSalaryNegotiation({ currentAnnualWon: d(current), desiredAnnualWon: d(desired) });
  expect(result.annualIncreaseWon).toEqual(d(difference));
  expect(result.increasePercent).toEqual(d(percent));
});

test('negotiation provides the monthly change', () => {
  expect(calculateSalaryNegotiation({ currentAnnualWon: d(36000000), desiredAnnualWon: d(48000000) }).monthlyIncreaseWon).toEqual(d(1000000));
});

test('freelancer withholding never uses a negative taxable base', () => {
  expect(calculateFreelancerWithholding({ grossWon: d(100000), deductibleExpenseWon: d(200000), withholdingRatePercent: d('3.3') }).withholdingWon).toEqual(d(0));
});

test('explicit expense-adjusted withholding rate yields tax and gross less withholding', () => {
  const result = calculateFreelancerWithholding({ grossWon: d(1000000), deductibleExpenseWon: d(100000), withholdingRatePercent: d('3.3') });
  expect(result.taxableBaseWon).toEqual(d(900000));
  expect(result.withholdingWon).toEqual(d(29700));
  expect(result.netReceiptWon).toEqual(d(970300));
});

test('decimal arithmetic retains fractional won without premature rounding', () => {
  expect(calculateFreelancerWithholding({ grossWon: d('100.5'), deductibleExpenseWon: d(0), withholdingRatePercent: d('3.3') }).withholdingWon).toEqual(d('3.3165'));
});

test('rejects nonfinite amounts, negative expenses, and rates above 100', () => {
  expect(() => calculateSalaryNegotiation({ currentAnnualWon: d('NaN'), desiredAnnualWon: d(10) })).toThrow();
  expect(() => calculateFreelancerWithholding({ grossWon: d(100), deductibleExpenseWon: d(-1), withholdingRatePercent: d(3) })).toThrow();
  expect(() => calculateFreelancerWithholding({ grossWon: d(100), deductibleExpenseWon: d(0), withholdingRatePercent: d(101) })).toThrow();
});
