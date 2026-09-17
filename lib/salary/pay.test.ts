import Decimal from 'decimal.js';
import { describe, expect, test } from 'vitest';
import { calculateHourlyMonthlyPay, calculateTakeHomePay, calculateWeeklyHolidayPay } from './pay';
import type { TakeHomePolicy } from './policy-2026';

const d = (value: Decimal.Value) => new Decimal(value);
expect.addEqualityTesters([(a, b) => Decimal.isDecimal(a) && Decimal.isDecimal(b) ? a.eq(b) : undefined]);
// Deliberately hypothetical policy: these numbers are arithmetic fixtures, not statutory rates.
const policy: TakeHomePolicy = {
  pensionEmployeeRatePercent: d(5),
  pensionMonthlyLowerBaseWon: d(1000000),
  pensionMonthlyUpperBaseWon: d(4000000),
  healthEmployeeRatePercent: d(4),
  longTermCareRateOfHealthPercent: d(10),
  employmentEmployeeRatePercent: d(1),
  localIncomeTaxRatePercent: d(10),
  incomeTaxTable: [
    { monthlyFromWon: d(0), monthlyToExclusiveWon: null, dependents: 1, childDependents: 0, taxWon: d(100000) },
    { monthlyFromWon: d(0), monthlyToExclusiveWon: null, dependents: 2, childDependents: 1, taxWon: d(50000) },
  ],
};

describe('weekly holiday pay', () => {
  test.each([[14, 0], [15, 30000], [40, 80000], [50, 80000]])('at %i weekly hours the assumed five-day schedule yields %i won', (hours, allowance) => {
    expect(calculateWeeklyHolidayPay({ hourlyWon: d(10000), weeklyHours: d(hours), weeksWorked: d(1) }).allowanceWon).toEqual(d(allowance));
  });

  test('counts fractional eligible weeks without binary floating-point drift', () => {
    expect(calculateWeeklyHolidayPay({ hourlyWon: d('10000.5'), weeklyHours: d(15), weeksWorked: d('4.5') }).allowanceWon).toEqual(d('135006.75'));
  });

  test('monthly pay adds holiday pay to hourly base', () => {
    const result = calculateHourlyMonthlyPay({ hourlyWon: d(10000), weeklyHours: d(40), paidWeeks: d(4) });
    expect(result.baseWon).toEqual(d(1600000));
    expect(result.holidayAllowanceWon).toEqual(d(320000));
    expect(result.totalWon).toEqual(d(1920000));
  });

  test('zero paid weeks has no earnings', () => {
    expect(calculateHourlyMonthlyPay({ hourlyWon: d(10000), weeklyHours: d(14), paidWeeks: d(0) }).totalWon).toEqual(d(0));
  });

  test.each(['-1', 'NaN', 'Infinity'])('rejects invalid hourly pay %s', (value) => {
    expect(() => calculateHourlyMonthlyPay({ hourlyWon: d(value), weeklyHours: d(40), paidWeeks: d(4) })).toThrow();
  });
});

describe('take-home estimate using an explicit policy', () => {
  const input = { annualSalaryWon: d(36000000), monthlyNonTaxableWon: d(200000), dependents: 1, childDependents: 0, policy };

  test('returns separate deductions and reconciles the take-home amount', () => {
    const result = calculateTakeHomePay(input);
    expect(result.monthlyGrossWon).toEqual(d(3000000));
    expect(result.monthlyTaxableWon).toEqual(d(2800000));
    expect(result.deductions).toEqual({ pensionWon: d(140000), healthWon: d(112000), longTermCareWon: d(11200), employmentWon: d(28000), incomeTaxWon: d(100000), localIncomeTaxWon: d(10000) });
    expect(result.totalDeductionsWon).toEqual(d(401200));
    expect(result.monthlyTakeHomeWon).toEqual(d(2598800));
  });

  test('selects the supplied family-specific tax row', () => {
    expect(calculateTakeHomePay({ ...input, dependents: 2, childDependents: 1 }).deductions.incomeTaxWon).toEqual(d(50000));
  });

  test('applies the pension base upper and lower bounds', () => {
    expect(calculateTakeHomePay({ ...input, annualSalaryWon: d(120000000) }).deductions.pensionWon).toEqual(d(200000));
    expect(calculateTakeHomePay({ ...input, annualSalaryWon: d(6000000), monthlyNonTaxableWon: d(0) }).deductions.pensionWon).toEqual(d(50000));
  });

  test('zero taxable pay does not trigger the minimum pension base or tax', () => {
    const result = calculateTakeHomePay({ ...input, annualSalaryWon: d(0), monthlyNonTaxableWon: d(200000) });
    expect(result.monthlyTaxableWon).toEqual(d(0));
    expect(result.totalDeductionsWon).toEqual(d(0));
    expect(result.monthlyTakeHomeWon).toEqual(d(0));
  });

  test('uses an exclusive upper bound when selecting a tax bracket', () => {
    const rows = [
      { monthlyFromWon: d(0), monthlyToExclusiveWon: d(2800000), dependents: 1, childDependents: 0, taxWon: d(1) },
      { monthlyFromWon: d(2800000), monthlyToExclusiveWon: null, dependents: 1, childDependents: 0, taxWon: d(2) },
    ];
    expect(calculateTakeHomePay({ ...input, policy: { ...policy, incomeTaxTable: rows } }).deductions.incomeTaxWon).toEqual(d(2));
  });

  test('rejects an uncovered or ambiguous tax bracket instead of inventing tax', () => {
    expect(() => calculateTakeHomePay({ ...input, dependents: 3 })).toThrow();
    expect(() => calculateTakeHomePay({ ...input, policy: { ...policy, incomeTaxTable: [...policy.incomeTaxTable, policy.incomeTaxTable[0]] } })).toThrow();
  });

  test('rejects invalid policy bounds and impossible family counts', () => {
    expect(() => calculateTakeHomePay({ ...input, policy: { ...policy, pensionMonthlyUpperBaseWon: d(0) } })).toThrow();
    expect(() => calculateTakeHomePay({ ...input, childDependents: 2 })).toThrow();
    expect(() => calculateTakeHomePay({ ...input, policy: { ...policy, healthEmployeeRatePercent: d('NaN') } })).toThrow();
  });
});
