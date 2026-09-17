import type Decimal from 'decimal.js';
import { amount, count, percent, SalaryDecimal } from './decimal';
import { SALARY_POLICY_2026, type TakeHomePolicy } from './policy-2026';

export interface WeeklyHolidayPayInput {
  hourlyWon: Decimal;
  /** Four-week average of contractual weekly hours. */
  weeklyHours: Decimal;
  /** Weeks satisfying attendance and other eligibility conditions. */
  weeksWorked: Decimal;
}

/** Estimate assuming a five-day, 40-hour full-time comparator and satisfied attendance. */
export function calculateWeeklyHolidayPay(input: WeeklyHolidayPayInput) {
  const hourlyWon = amount(input.hourlyWon, '시급');
  const weeklyHours = amount(input.weeklyHours, '주 소정근로시간');
  const weeksWorked = amount(input.weeksWorked, '주 수');
  const holidayHoursPerWeek = weeklyHours.lt(SALARY_POLICY_2026.weeklyHoliday.minimumWeeklyHours)
    ? new SalaryDecimal(0)
    : SalaryDecimal.min(weeklyHours, 40).div(5);
  return { holidayHoursPerWeek, allowanceWon: hourlyWon.mul(holidayHoursPerWeek).mul(weeksWorked) };
}

export interface HourlyMonthlyPayInput {
  hourlyWon: Decimal;
  weeklyHours: Decimal;
  paidWeeks: Decimal;
}

export function calculateHourlyMonthlyPay(input: HourlyMonthlyPayInput) {
  const holiday = calculateWeeklyHolidayPay({ ...input, weeksWorked: input.paidWeeks });
  const baseWon = amount(input.hourlyWon, '시급').mul(input.weeklyHours).mul(input.paidWeeks);
  return { baseWon, holidayAllowanceWon: holiday.allowanceWon, totalWon: baseWon.add(holiday.allowanceWon) };
}

export interface TakeHomePayInput {
  annualSalaryWon: Decimal;
  /** Portion already included in the salary, not an additional allowance. */
  monthlyNonTaxableWon: Decimal;
  dependents: number;
  childDependents: number;
  policy: TakeHomePolicy;
}

function familyCounts(dependents: number, childDependents: number) {
  count(dependents, '부양가족 수');
  count(childDependents, '자녀 수');
  if (dependents < 1 || childDependents >= dependents) {
    throw new Error('부양가족 수는 본인을 포함하며 자녀 수보다 커야 합니다.');
  }
}

export function calculateTakeHomePay(input: TakeHomePayInput) {
  familyCounts(input.dependents, input.childDependents);
  const monthlyGrossWon = amount(input.annualSalaryWon, '연봉').div(12);
  const monthlyTaxableWon = SalaryDecimal.max(monthlyGrossWon.minus(amount(input.monthlyNonTaxableWon, '비과세액')), 0);
  const p = input.policy;
  const pensionRate = percent(p.pensionEmployeeRatePercent, '국민연금 근로자 요율');
  const healthRate = percent(p.healthEmployeeRatePercent, '건강보험 근로자 요율');
  const careRate = percent(p.longTermCareRateOfHealthPercent, '장기요양 요율');
  const employmentRate = percent(p.employmentEmployeeRatePercent, '고용보험 근로자 요율');
  const localTaxRate = percent(p.localIncomeTaxRatePercent, '지방소득세 요율');
  const pensionLower = amount(p.pensionMonthlyLowerBaseWon, '국민연금 하한');
  const pensionUpper = amount(p.pensionMonthlyUpperBaseWon, '국민연금 상한');
  if (pensionLower.gt(pensionUpper)) throw new Error('국민연금 하한은 상한보다 클 수 없습니다.');

  const rows = p.incomeTaxTable.filter((row) => {
    familyCounts(row.dependents, row.childDependents);
    const lower = amount(row.monthlyFromWon, '세금표 하한');
    const upper = row.monthlyToExclusiveWon === null ? null : amount(row.monthlyToExclusiveWon, '세금표 상한');
    amount(row.taxWon, '소득세');
    if (upper !== null && lower.gte(upper)) throw new Error('세금표 상한은 하한보다 커야 합니다.');
    return row.dependents === input.dependents && row.childDependents === input.childDependents
      && monthlyTaxableWon.gte(lower) && (upper === null || monthlyTaxableWon.lt(upper));
  });
  if (!monthlyTaxableWon.isZero() && rows.length !== 1) throw new Error('입력에 일치하는 소득세 행을 정확히 하나 제공해야 합니다.');

  const pensionBase = monthlyTaxableWon.isZero() ? new SalaryDecimal(0) : SalaryDecimal.min(SalaryDecimal.max(monthlyTaxableWon, pensionLower), pensionUpper);
  const healthWon = monthlyTaxableWon.mul(healthRate).div(100);
  const incomeTaxWon = monthlyTaxableWon.isZero() ? new SalaryDecimal(0) : amount(rows[0].taxWon, '소득세');
  const deductions = {
    pensionWon: pensionBase.mul(pensionRate).div(100),
    healthWon,
    longTermCareWon: healthWon.mul(careRate).div(100),
    employmentWon: monthlyTaxableWon.mul(employmentRate).div(100),
    incomeTaxWon,
    localIncomeTaxWon: incomeTaxWon.mul(localTaxRate).div(100),
  };
  const totalDeductionsWon = Object.values(deductions).reduce((sum, value) => sum.add(value), new SalaryDecimal(0));
  return { monthlyGrossWon, monthlyTaxableWon, deductions, totalDeductionsWon, monthlyTakeHomeWon: monthlyGrossWon.minus(totalDeductionsWon) };
}
