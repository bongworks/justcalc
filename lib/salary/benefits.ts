import type Decimal from 'decimal.js';
import { amount, count, percent, SalaryDecimal } from './decimal';
import { SALARY_POLICY_2026 } from './policy-2026';

/** Formula only; caller must verify eligibility and use ordinary wage if it is higher. */
export function calculateSeverancePay(input: { averageDailyWageWon: Decimal; continuousServiceDays: number }) {
  const wage = amount(input.averageDailyWageWon, '1일 평균임금');
  const days = count(input.continuousServiceDays, '재직일수');
  return { estimatedWon: wage.mul(30).mul(days).div(365) };
}

/** Unused payable leave only; entitlement and expiry are outside this formula. */
export function calculateAnnualLeaveAllowance(input: { unusedDays: Decimal; ordinaryDailyWageWon: Decimal }) {
  return { allowanceWon: amount(input.unusedDays, '미사용 연차').mul(amount(input.ordinaryDailyWageWon, '1일 통상임금')) };
}

export interface UnemploymentBenefitInput {
  /** Statutory benefit base daily amount, after any applicable base rules. */
  dailyWageWon: Decimal;
  eligibleDays: number;
  dailyLowerLimitWon: Decimal;
  dailyUpperLimitWon: Decimal;
}

export function calculateUnemploymentBenefitEstimate(input: UnemploymentBenefitInput) {
  const wage = amount(input.dailyWageWon, '기초일액');
  const days = count(input.eligibleDays, '소정급여일수');
  const lower = amount(input.dailyLowerLimitWon, '구직급여 하한');
  const upper = amount(input.dailyUpperLimitWon, '구직급여 상한');
  if (lower.gt(upper)) throw new Error('구직급여 하한은 상한보다 클 수 없습니다.');
  const base = wage.mul(SALARY_POLICY_2026.unemployment.replacementRatePercent).div(100);
  const dailyBenefitWon = SalaryDecimal.min(SalaryDecimal.max(base, lower), upper);
  return { dailyBenefitWon, totalBenefitWon: dailyBenefitWon.mul(days) };
}

export interface ParentalLeaveInput {
  ordinaryMonthlyWageWon: Decimal;
  months: number;
  replacementRatePercent: Decimal;
  monthlyCapWon: Decimal;
}

/** Flat scenario only. Actual month-specific tiers/special schemes must be calculated separately. */
export function calculateParentalLeaveEstimate(input: ParentalLeaveInput) {
  const wage = amount(input.ordinaryMonthlyWageWon, '월 통상임금');
  // Resource limit for the local row table, not a legal eligibility limit.
  const months = count(input.months, '개월 수', 1200);
  const rate = percent(input.replacementRatePercent, '급여 지급률');
  const cap = amount(input.monthlyCapWon, '월 상한액');
  const monthlyBenefitWon = SalaryDecimal.min(wage.mul(rate).div(100), cap);
  const rows = Array.from({ length: months }, (_, index) => ({ month: index + 1, benefitWon: monthlyBenefitWon }));
  return { monthlyBenefitWon, totalBenefitWon: monthlyBenefitWon.mul(months), rows };
}
