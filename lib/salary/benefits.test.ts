import Decimal from 'decimal.js';
import { expect, test } from 'vitest';
import { calculateAnnualLeaveAllowance, calculateParentalLeaveEstimate, calculateSeverancePay, calculateUnemploymentBenefitEstimate } from './benefits';

const d = (value: Decimal.Value) => new Decimal(value);
expect.addEqualityTesters([(a, b) => Decimal.isDecimal(a) && Decimal.isDecimal(b) ? a.eq(b) : undefined]);

test('severance is 30 days of daily wage for 365 service days', () => {
  expect(calculateSeverancePay({ averageDailyWageWon: d(100000), continuousServiceDays: 365 }).estimatedWon).toEqual(d(3000000));
});

test('severance formula prorates service days without deciding eligibility', () => {
  expect(calculateSeverancePay({ averageDailyWageWon: d(100000), continuousServiceDays: 730 }).estimatedWon).toEqual(d(6000000));
  expect(calculateSeverancePay({ averageDailyWageWon: d(100000), continuousServiceDays: 0 }).estimatedWon).toEqual(d(0));
});

test('unused fractional leave days multiply the ordinary daily wage', () => {
  expect(calculateAnnualLeaveAllowance({ unusedDays: d('2.5'), ordinaryDailyWageWon: d(100000) }).allowanceWon).toEqual(d(250000));
});

test.each([[500000, 70000], [100000, 60000], [110000, 66000]])('unemployment daily wage %i respects floor, ceiling, and 60 percent', (wage, expected) => {
  const result = calculateUnemploymentBenefitEstimate({ dailyWageWon: d(wage), eligibleDays: 120, dailyLowerLimitWon: d(60000), dailyUpperLimitWon: d(70000) });
  expect(result.dailyBenefitWon).toEqual(d(expected));
  expect(result.totalBenefitWon).toEqual(d(expected * 120));
});

test('zero eligible days receives no unemployment total', () => {
  expect(calculateUnemploymentBenefitEstimate({ dailyWageWon: d(100000), eligibleDays: 0, dailyLowerLimitWon: d(0), dailyUpperLimitWon: d(70000) }).totalBenefitWon).toEqual(d(0));
});

test('unemployment rejects an inverted cap and fractional eligibility days', () => {
  expect(() => calculateUnemploymentBenefitEstimate({ dailyWageWon: d(100000), eligibleDays: 120, dailyLowerLimitWon: d(70000), dailyUpperLimitWon: d(60000) })).toThrow();
  expect(() => calculateUnemploymentBenefitEstimate({ dailyWageWon: d(100000), eligibleDays: 1.5, dailyLowerLimitWon: d(0), dailyUpperLimitWon: d(70000) })).toThrow();
});

test('parental leave creates a row per month using the explicit rate and cap', () => {
  const result = calculateParentalLeaveEstimate({ ordinaryMonthlyWageWon: d(3000000), months: 3, replacementRatePercent: d(80), monthlyCapWon: d(2000000) });
  expect(result.rows).toEqual([{ month: 1, benefitWon: d(2000000) }, { month: 2, benefitWon: d(2000000) }, { month: 3, benefitWon: d(2000000) }]);
  expect(result.totalBenefitWon).toEqual(d(6000000));
});

test('parental leave below the cap uses the supplied rate; zero months returns no rows', () => {
  expect(calculateParentalLeaveEstimate({ ordinaryMonthlyWageWon: d(1000000), months: 1, replacementRatePercent: d(80), monthlyCapWon: d(2000000) }).totalBenefitWon).toEqual(d(800000));
  expect(calculateParentalLeaveEstimate({ ordinaryMonthlyWageWon: d(1000000), months: 0, replacementRatePercent: d(80), monthlyCapWon: d(2000000) }).rows).toEqual([]);
});

test.each([-1, 1.5, Infinity, 10000000])('rejects unsupported month count %s before allocating rows', (months) => {
  expect(() => calculateParentalLeaveEstimate({ ordinaryMonthlyWageWon: d(1000000), months, replacementRatePercent: d(80), monthlyCapWon: d(2000000) })).toThrow();
});

test('rejects negative or nonfinite wages and invalid benefit rates', () => {
  expect(() => calculateSeverancePay({ averageDailyWageWon: d('Infinity'), continuousServiceDays: 365 })).toThrow();
  expect(() => calculateAnnualLeaveAllowance({ unusedDays: d(-1), ordinaryDailyWageWon: d(100000) })).toThrow();
  expect(() => calculateParentalLeaveEstimate({ ordinaryMonthlyWageWon: d(1000000), months: 1, replacementRatePercent: d(101), monthlyCapWon: d(2000000) })).toThrow();
});
