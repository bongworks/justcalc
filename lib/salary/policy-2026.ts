import type Decimal from 'decimal.js';

/** Official texts inspected on 2026-09-17; only the cited provisions are encoded. */
export const SALARY_POLICY_2026 = {
  weeklyHoliday: {
    minimumWeeklyHours: 15,
    sourceUrl: 'https://www.law.go.kr/LSW/lsSideInfoP.do?lsiSeq=283457&joNo=0018&joBrNo=00&docCls=jo&urlMode=lsScJoRltInfoR',
    effectiveFrom: '2026-08-20',
    provision: '근로기준법 제18조제3항: 4주 평균 주 소정근로시간 15시간 미만은 제55조 미적용',
  },
  unemployment: {
    replacementRatePercent: 60,
    sourceUrl: 'https://www.law.go.kr/LSW/lsSideInfoP.do?lsiSeq=283373&joNo=0046&joBrNo=00&docCls=jo&urlMode=lsScJoRltInfoR',
    effectiveFrom: '2026-08-20',
    provision: '고용보험법 제46조제1항제1호: 기초일액의 100분의 60; 제2호 최저액은 별도 입력',
  },
  severance: {
    sourceUrl: 'https://www.moel.go.kr/retirementpayCal.do',
    checkedOn: '2026-09-17',
    effectiveFrom: null,
    formula: '1일 평균임금 × 30 × 재직일수 / 365',
    note: '공식 계산 페이지는 시행일을 명시하지 않음. 통상임금이 더 크면 통상임금 사용. 수급 자격은 별도 확인.',
  },
} as const;

export interface IncomeTaxRow {
  monthlyFromWon: Decimal;
  monthlyToExclusiveWon: Decimal | null;
  /** Includes the employee. */
  dependents: number;
  /** Qualifying children counted within dependents, excluding the employee. */
  childDependents: number;
  taxWon: Decimal;
}

/**
 * Caller-supplied estimates, NOT a built-in 2026 statutory tax/insurance table.
 * Rates are employee shares. Long-term care is a percentage of health premium.
 * The caller must provide a reviewed table or explicitly entered monthly tax.
 * This model uses monthly taxable pay as the insurance base, with pension bounds;
 * actual assessed insurance bases, health caps, exemptions and payroll rounding differ.
 */
export interface TakeHomePolicy {
  pensionEmployeeRatePercent: Decimal;
  pensionMonthlyLowerBaseWon: Decimal;
  pensionMonthlyUpperBaseWon: Decimal;
  healthEmployeeRatePercent: Decimal;
  longTermCareRateOfHealthPercent: Decimal;
  employmentEmployeeRatePercent: Decimal;
  localIncomeTaxRatePercent: Decimal;
  incomeTaxTable: readonly IncomeTaxRow[];
}
