import Decimal from 'decimal.js';
import { calculators } from '@/content/calculators';
import type { CalculatorField } from '@/components/calculator/CalculatorForm';
import type { CalculatorResult, ResultValue } from '@/components/calculator/ResultPanel';
import type { CalculatorCatalogEntry, CalculatorDefinition } from './types';
import { parseMoney, parseNonNegativeDecimal, parsePositiveDecimal } from './validation';
import { formatNumber, formatPercent, formatWon } from './format';
import { calculateFuelCost } from '@/lib/car/fuel';
import { calculateEvChargingCost } from '@/lib/car/ev';
import { calculateMaintenanceCost, type MaintenanceInput } from '@/lib/car/maintenance';
import { calculatePurchaseCost } from '@/lib/car/purchase';
import { calculateRepaymentPlans, calculateSimpleInterest, type RepaymentRow, type SimpleInterestInput } from '@/lib/finance/loan';
import { calculateCompoundSavings, type CompoundSavingsRow } from '@/lib/finance/compound';
import { calculateSavingsMaturity, calculateDepositInterest, type SavingsInterestResult } from '@/lib/finance/savings';
import { calculateLoanAffordability } from '@/lib/finance/affordability';
import { calculateDsr, calculateDti, calculateLtv, convertCurrency } from '@/lib/finance/ratios';
import { calculateMonthlyBudget } from '@/lib/life/budget';
import { calculateHourlyMonthlyPay, calculateTakeHomePay, calculateWeeklyHolidayPay } from '@/lib/salary/pay';
import { calculateAnnualLeaveAllowance, calculateParentalLeaveEstimate, calculateSeverancePay, calculateUnemploymentBenefitEstimate } from '@/lib/salary/benefits';
import { calculateFreelancerWithholding, calculateSalaryNegotiation } from '@/lib/salary/planning';
import { calculateAcquisitionTax, calculateBrokerageFee, calculateDepositRentConversion, calculateRentComparison, calculateMovingBudget, calculateSetupBudget, calculateHousingAffordability, calculateRentalYield, calculateHoldingCosts } from '@/lib/realestate/costs';
import { calculateVat, calculateMargin, calculateMarkup, calculateBreakEven, calculateCommissionSettlement, calculateOnlineMarketSettlement, calculateFreelancerNetIncome, calculateMonthlyProfitLoss, calculateBusinessFeasibility, calculateDiscountRate, type CommissionSettlementResult } from '@/lib/business/profit';

type Raw = Record<string, string>;
export interface DisplayResult extends CalculatorResult {
  schedules?: ReadonlyArray<{ title: string; rows: ReadonlyArray<RepaymentRow> }>;
  savingsRows?: ReadonlyArray<CompoundSavingsRow>;
}
export interface RegisteredCalculator extends CalculatorCatalogEntry {
  fields: ReadonlyArray<CalculatorField>;
  evaluate: (raw: Raw) => DisplayResult;
}
type Parser = (raw: string) => Decimal;
const MAX_VALUE = new Decimal('1000000000000000');

function bounded(parser: Parser, max = MAX_VALUE): Parser {
  return (raw) => {
    const value = parser(raw);
    if (value.gt(max)) throw new Error(`최대 ${formatNumber(max, 0)}까지 입력해 주세요.`);
    return value;
  };
}
const money = bounded(parseMoney);
const nonnegative = bounded(parseNonNegativeDecimal);
const positive = bounded(parsePositiveDecimal);
const rate = bounded(parseNonNegativeDecimal, new Decimal(100));
const months = (raw: string) => {
  const value = bounded(parsePositiveDecimal, new Decimal(1200))(raw);
  if (!value.isInteger()) throw new Error('기간은 정수 개월로 입력해 주세요.');
  return value.toNumber();
};
function wholeCount(raw: string, minimum: number, maximum = 1200) {
  const value = bounded(parseNonNegativeDecimal, new Decimal(maximum))(raw);
  if (!value.isInteger() || value.lt(minimum)) throw new Error(minimum === 0 ? '0 이상의 정수를 입력해 주세요.' : `${minimum} 이상의 정수를 입력해 주세요.`);
  return value.toNumber();
}
function number(name: string, label: string, unit: string, example: string, parser: (raw: string) => unknown = money, hint = '원 단위 정수로 입력'): CalculatorField {
  const formattedExample = example ? formatNumber(example, 0) : '';
  return { name, label, unit, required: true, defaultValue: example, hint: formattedExample ? `${hint ? `${hint} · ` : ''}예: ${formattedExample}` : hint, validate: (raw) => { try { parser(raw); } catch (error) { return error instanceof Error ? error.message : '입력값을 확인해 주세요.'; } } };
}
function select(name: string, label: string, options: ReadonlyArray<{ value: string; label: string }>, defaultValue: string): CalculatorField {
  return { name, label, type: 'select', required: true, options, defaultValue };
}
function choice<T extends string>(raw: string, choices: readonly T[]): T {
  if (!choices.includes(raw as T)) throw new Error('목록에서 선택해 주세요.');
  return raw as T;
}
const annualRate = number('annualRatePercent', '연 이자율', '%', '6', rate, '0~100%');
const repaymentMonths = number('months', '상환 기간', '개월', '12', months, '1~1,200개월, 정수');
const modes = [{ value: 'equalPayment', label: '원리금균등' }, { value: 'equalPrincipal', label: '원금균등' }, { value: 'bullet', label: '만기일시' }] as const;
const won = (label: string, value: Decimal.Value): ResultValue => ({ label, value: formatWon(value) });
const loanInput = (raw: Raw) => ({ principal: money(raw.principal), annualRatePercent: rate(raw.annualRatePercent), months: months(raw.months) });
const reviewedYear = { label: '기준연도', value: '2026년 · 검토일 2026-09-17' };
const benefitRows = (assumption: string): ReadonlyArray<ResultValue> => [reviewedYear, { label: '계산 가정', value: assumption }, { label: '실제 지급·수급 자격', value: '근로·고용보험·휴직 등 실제 요건은 별도 확인' }];
const manualRate = (name: string, label: string) => number(name, label, '%', '', rate, '수동 설정 · 0~100%');
const manualMoney = (name: string, label: string) => number(name, label, '원', '', money, '수동 설정 · 0원 이상');
const formattedPercentValue = (value: Decimal.Value) => `${formatNumber(value).replace(/(?:\.0+|(?:(\.\d*?)0+))$/, '$1')}%`;

function define<I, O>(slug: typeof calculators[number]['slug'], fields: ReadonlyArray<CalculatorField>, parse: (raw: Raw) => I, calculate: (input: I) => O, present: (output: O) => DisplayResult): RegisteredCalculator & CalculatorDefinition<I, O> {
  const entry = calculators.find((calculator) => calculator.slug === slug)!;
  return { ...entry, fields, parse, calculate, evaluate: (raw) => present(calculate(parse(raw))) };
}

const fuel = define('fuel-cost', [number('distanceKm', '주행거리', 'km', '420', nonnegative, ''), number('efficiencyKmPerLitre', '연비', 'km/L', '14', positive, ''), number('wonPerLitre', '유종 단가', '원/L', '1700')],
  (raw) => ({ distanceKm: nonnegative(raw.distanceKm), efficiencyKmPerLitre: positive(raw.efficiencyKmPerLitre), wonPerLitre: money(raw.wonPerLitre) }), calculateFuelCost,
  (result) => ({ summary: won('예상 유류비', result.totalWon), rows: [{ label: '예상 연료 사용량', value: `${formatNumber(result.litres)} L` }, won('1km당 유류비', result.wonPerKm)] }));

const ev = define('ev-charging-cost', [number('distanceKm', '주행거리', 'km', '240', nonnegative, ''), number('efficiencyKmPerKwh', '전비', 'km/kWh', '6', positive, ''), number('wonPerKwh', '충전 단가', '원/kWh', '300')],
  (raw) => ({ distanceKm: nonnegative(raw.distanceKm), efficiencyKmPerKwh: positive(raw.efficiencyKmPerKwh), wonPerKwh: money(raw.wonPerKwh) }), calculateEvChargingCost,
  (result) => ({ summary: won('예상 충전비', result.totalWon), rows: [{ label: '예상 전력 사용량', value: `${formatNumber(result.kwh)} kWh` }, won('1km당 충전비', result.wonPerKm)] }));

const maintenance = define('maintenance-cost', [
  select('powertrain', '동력원', [{ value: 'ice', label: '내연기관' }, { value: 'ev', label: '전기차' }], 'ice'),
  number('annualDistanceKm', '연간 주행거리', 'km', '12000', positive, ''),
  ...fuel.fields.slice(1).map((field) => ({ ...field, visibleWhen: { field: 'powertrain', value: 'ice' } })),
  ...ev.fields.slice(1).map((field) => ({ ...field, visibleWhen: { field: 'powertrain', value: 'ev' } })),
  number('insuranceWon', '연간 보험료', '원', '800000'), number('taxWon', '연간 자동차세', '원', '300000'), number('maintenanceWon', '연간 정비·소모품 비용', '원', '400000'), number('otherWon', '연간 주차·통행료 및 기타 비용', '원', '600000'),
], (raw): MaintenanceInput => {
  const common = { annualDistanceKm: positive(raw.annualDistanceKm), insuranceWon: money(raw.insuranceWon), taxWon: money(raw.taxWon), maintenanceWon: money(raw.maintenanceWon), otherWon: money(raw.otherWon) };
  return choice(raw.powertrain, ['ice', 'ev']) === 'ice' ? { ...common, powertrain: 'ice', efficiencyKmPerLitre: positive(raw.efficiencyKmPerLitre), wonPerLitre: money(raw.wonPerLitre) } : { ...common, powertrain: 'ev', efficiencyKmPerKwh: positive(raw.efficiencyKmPerKwh), wonPerKwh: money(raw.wonPerKwh) };
}, calculateMaintenanceCost, (result) => ({ summary: won('연간 총 유지비', result.annualTotalWon), rows: [won('월 평균 유지비', result.monthlyAverageWon), won('1km당 비용', result.wonPerKm), ...result.items.map((item) => ({ label: item.label, value: `${formatWon(item.amountWon)} (${formatPercent(item.ratio)})` }))] }));

const purchase = define('purchase-cost', [number('vehiclePriceWon', '차량 가격', '원', '30000000'), number('optionalCostWon', '선택 비용', '원', '2000000'), number('cashWon', '초기 현금', '원', '12000000'), number('financedPrincipalWon', '할부 원금', '원', '20000000'), annualRate, repaymentMonths],
  (raw) => ({ vehiclePriceWon: money(raw.vehiclePriceWon), optionalCostWon: money(raw.optionalCostWon), cashWon: money(raw.cashWon), financedPrincipalWon: money(raw.financedPrincipalWon), annualRatePercent: rate(raw.annualRatePercent), months: months(raw.months) }), calculatePurchaseCost,
  (result) => ({ summary: won('입력한 초기 현금', result.cashWon), rows: [won('구매 총비용', result.purchaseTotalWon), won('할부 월 납입액', result.monthlyPaymentWon), won('할부 총이자', result.installmentInterestWon), ...result.items.map((item) => won(item.label === '자금 조달 차이' ? `자금 조달 차이 (${result.fundingGapWon.isNegative() ? '조달 초과' : result.fundingGapWon.isZero() ? '차이 없음' : '추가 필요'})` : item.label, item.amountWon))], schedules: [{ title: '원리금균등', rows: result.schedule }] }));

function presentPlan(plan: ReturnType<typeof calculateRepaymentPlans>[keyof ReturnType<typeof calculateRepaymentPlans>], title: string): DisplayResult {
  return { summary: won(`${title} 첫 달 납입액`, plan.rows[0].payment), rows: [won('마지막 달 납입액', plan.rows.at(-1)!.payment), won('총이자', plan.totalInterest), won('총 납입액', plan.totalPaid)], schedules: [{ title, rows: plan.rows }] };
}
const installment = define('installment', [number('principal', '할부 원금', '원', '12000000'), annualRate, repaymentMonths, select('mode', '상환 방식', modes, 'equalPayment')],
  (raw) => ({ ...loanInput(raw), mode: choice(raw.mode, ['equalPayment', 'equalPrincipal', 'bullet']) }),
  (input) => ({ plans: calculateRepaymentPlans(input), mode: input.mode }),
  ({ plans, mode }) => presentPlan(plans[mode], modes.find((option) => option.value === mode)!.label));

const comparison = define('loan-repayment', [number('principal', '대출 원금', '원', '12000000'), annualRate, repaymentMonths], loanInput, calculateRepaymentPlans,
  (plans) => ({ summary: { label: '상환 방식 비교', value: '세 가지 상환 방식' }, rows: modes.flatMap(({ value, label }) => { const plan = plans[value]; return [won(`${label} 첫 달 납입액`, plan.rows[0].payment), won(`${label} 마지막 달 납입액`, plan.rows.at(-1)!.payment), won(`${label} 총이자`, plan.totalInterest), won(`${label} 총 납입액`, plan.totalPaid)]; }), schedules: modes.map(({ value, label }) => ({ title: label, rows: plans[value].rows })) }));

const interest = define('loan-interest', [number('principal', '대출 원금', '원', '10000000'), annualRate, number('period', '이용 기간', '', '12', positive, '0 초과'), select('periodUnit', '기간 단위', [{ value: 'days', label: '일' }, { value: 'months', label: '개월' }, { value: 'years', label: '년' }], 'months'), { ...select('daysInYear', '연 기준 일수', [{ value: '365', label: '365일' }, { value: '366', label: '366일' }], '365'), visibleWhen: { field: 'periodUnit', value: 'days' } }],
  (raw): SimpleInterestInput => {
    const base = { principal: money(raw.principal), annualRatePercent: rate(raw.annualRatePercent), period: positive(raw.period) };
    const periodUnit = choice(raw.periodUnit, ['days', 'months', 'years']);
    return periodUnit === 'days' ? { ...base, periodUnit, daysInYear: choice(raw.daysInYear, ['365', '366']) === '365' ? 365 : 366 } : { ...base, periodUnit };
  }, calculateSimpleInterest, (result) => ({ summary: won('단리 기준 예상 이자', result.interest), rows: [won('원금 포함 만기 예상액', result.maturityAmount)] }));

const compound = define('compound-interest', [number('initialPrincipal', '초기 원금', '원', '1000000'), number('monthlyContribution', '매월 납입액', '원', '100000'), { ...annualRate, defaultValue: '3' }, number('months', '기간', '개월', '12', months, '1~1,200개월, 정수'), select('compounding', '이자 계산 주기', [{ value: 'monthly', label: '월 복리 · 매월 말 납입' }], 'monthly'), { ...number('taxRatePercent', '세율', '%', '', rate, '선택 입력 · 0~100% · 공란이면 세전 결과만 표시'), required: false }],
  (raw) => { choice(raw.compounding, ['monthly']); return { initialPrincipal: money(raw.initialPrincipal), monthlyContribution: money(raw.monthlyContribution), annualRatePercent: rate(raw.annualRatePercent), months: months(raw.months), taxRatePercent: raw.taxRatePercent?.trim() ? rate(raw.taxRatePercent) : undefined }; }, calculateCompoundSavings,
  (result) => ({ summary: won('세전 만기 예상액', result.maturityAmount), rows: [won('총 납입원금', result.totalPaid), won('세전 예상 이자', result.totalInterest), ...(result.afterTaxMaturityAmount === undefined ? [] : [won('세후 만기 예상액', result.afterTaxMaturityAmount), won('세후 예상 이자', result.afterTaxInterest!)]), { label: '계산 가정', value: '월 복리 · 매월 말 납입' }], savingsRows: result.rows }));

const budget = define('monthly-budget', [number('incomeWon', '월 순수입', '원', '3000000'), number('housingWon', '주거비', '원', '600000'), number('carWon', '자동차비', '원', '300000', money, '자동차 유지비 계산 결과를 직접 입력'), number('foodWon', '식비', '원', '400000'), number('communicationsWon', '통신·구독비', '원', '100000'), number('healthWon', '보험·의료비', '원', '100000'), number('otherFixedWon', '기타 고정비', '원', '100000'), number('variableWon', '기타 변동비', '원', '200000'), number('savingsTargetWon', '목표 저축액', '원', '700000')],
  (raw) => ({ incomeWon: money(raw.incomeWon), housingWon: money(raw.housingWon), carWon: money(raw.carWon), foodWon: money(raw.foodWon), communicationsWon: money(raw.communicationsWon), healthWon: money(raw.healthWon), otherFixedWon: money(raw.otherFixedWon), variableWon: money(raw.variableWon), savingsTargetWon: money(raw.savingsTargetWon) }), calculateMonthlyBudget,
  (result) => ({ summary: won('목표 저축액 반영 후 잔여 금액', result.remainingAfterSavingsWon), rows: [won('지출 총액', result.totalSpendingWon), { label: '수입 대비 지출 비율 (수입 0원일 때 0% 표시)', value: formatPercent(result.spendingRatio) }, ...result.categories.map((item) => ({ label: item.label, value: `${formatWon(item.costWon)} (${formatPercent(item.ratio)})` }))] }));

const takeHome = define('take-home-pay', [
  number('annualSalaryWon', '연봉', '원', '36000000'), number('monthlyNonTaxableWon', '월 비과세액', '원', '0'),
  number('dependents', '부양가족 수(본인 포함)', '명', '1', (raw) => new Decimal(wholeCount(raw, 1)), '1명 이상 정수'),
  number('childDependents', '자녀 수(부양가족에 포함)', '명', '0', (raw) => new Decimal(wholeCount(raw, 0)), '0명 이상 정수'),
  manualRate('pensionEmployeeRatePercent', '국민연금 근로자 요율'), manualMoney('pensionMonthlyLowerBaseWon', '국민연금 월 기준소득 하한'), manualMoney('pensionMonthlyUpperBaseWon', '국민연금 월 기준소득 상한'),
  manualRate('healthEmployeeRatePercent', '건강보험 근로자 요율'), manualRate('longTermCareRateOfHealthPercent', '장기요양 건강보험료 대비 요율'), manualRate('employmentEmployeeRatePercent', '고용보험 근로자 요율'),
  manualMoney('monthlyIncomeTaxWon', '월 소득세(수동 입력)'), manualRate('localIncomeTaxRatePercent', '지방소득세 소득세 대비 요율'),
], (raw) => {
  const dependents = wholeCount(raw.dependents, 1);
  const childDependents = wholeCount(raw.childDependents, 0);
  return {
    annualSalaryWon: money(raw.annualSalaryWon), monthlyNonTaxableWon: money(raw.monthlyNonTaxableWon), dependents, childDependents,
    policy: {
      pensionEmployeeRatePercent: rate(raw.pensionEmployeeRatePercent), pensionMonthlyLowerBaseWon: money(raw.pensionMonthlyLowerBaseWon), pensionMonthlyUpperBaseWon: money(raw.pensionMonthlyUpperBaseWon),
      healthEmployeeRatePercent: rate(raw.healthEmployeeRatePercent), longTermCareRateOfHealthPercent: rate(raw.longTermCareRateOfHealthPercent), employmentEmployeeRatePercent: rate(raw.employmentEmployeeRatePercent), localIncomeTaxRatePercent: rate(raw.localIncomeTaxRatePercent),
      incomeTaxTable: [{ monthlyFromWon: new Decimal(0), monthlyToExclusiveWon: null, dependents, childDependents, taxWon: money(raw.monthlyIncomeTaxWon) }],
    },
  };
}, calculateTakeHomePay, (result) => ({ summary: won('월 예상 실수령액(수동 설정)', result.monthlyTakeHomeWon), rows: [won('월 총급여', result.monthlyGrossWon), won('월 과세 대상 급여', result.monthlyTaxableWon), won('국민연금', result.deductions.pensionWon), won('건강보험', result.deductions.healthWon), won('장기요양보험료', result.deductions.longTermCareWon), won('고용보험', result.deductions.employmentWon), won('소득세', result.deductions.incomeTaxWon), won('지방소득세', result.deductions.localIncomeTaxWon), won('공제 합계', result.totalDeductionsWon), reviewedYear, { label: '계산 가정', value: '모든 요율·기준소득·월 소득세를 수동 입력한 예상값' }] }));

const hourlyMonthly = define('hourly-monthly-pay', [number('hourlyWon', '시급', '원', '10000'), number('weeklyHours', '주 소정근로시간', '시간', '40', nonnegative, '0시간 이상'), number('paidWeeks', '유급 주 수', '주', '4', nonnegative, '0주 이상')],
  (raw) => ({ hourlyWon: money(raw.hourlyWon), weeklyHours: nonnegative(raw.weeklyHours), paidWeeks: nonnegative(raw.paidWeeks) }), calculateHourlyMonthlyPay,
  (result) => ({ summary: won('월 급여 예상액', result.totalWon), rows: [won('기본급', result.baseWon), won('주휴수당 가정액', result.holidayAllowanceWon), { label: '계산 가정', value: '입력한 유급 주 수와 5일·40시간 비교를 사용' }] }));

const weeklyHoliday = define('weekly-holiday-pay', [number('hourlyWon', '시급', '원', '10000'), number('weeklyHours', '4주 평균 주 소정근로시간', '시간', '40', nonnegative, '0시간 이상'), number('weeksWorked', '요건 충족 주 수', '주', '4', nonnegative, '0주 이상')],
  (raw) => ({ hourlyWon: money(raw.hourlyWon), weeklyHours: nonnegative(raw.weeklyHours), weeksWorked: nonnegative(raw.weeksWorked) }), calculateWeeklyHolidayPay,
  (result) => ({ summary: won('주휴수당 예상액', result.allowanceWon), rows: [{ label: '주당 주휴 시간', value: `${formatNumber(result.holidayHoursPerWeek)}시간` }, ...benefitRows('4주 평균 15시간 이상과 출근 등 요건 충족을 전제') ] }));

const severance = define('severance-pay', [number('averageDailyWageWon', '1일 평균임금', '원', '100000'), number('continuousServiceDays', '계속근로 재직일수', '일', '730', (raw) => new Decimal(wholeCount(raw, 0, 50000)), '0일 이상 정수')],
  (raw) => ({ averageDailyWageWon: money(raw.averageDailyWageWon), continuousServiceDays: wholeCount(raw.continuousServiceDays, 0, 50000) }), calculateSeverancePay,
  (result) => ({ summary: won('퇴직금 예상액', result.estimatedWon), rows: benefitRows('1일 평균임금 × 30 × 재직일수 ÷ 365 공식만 적용') }));

const annualLeave = define('annual-leave-allowance', [number('unusedDays', '지급 대상 미사용 연차', '일', '10', nonnegative, '0일 이상'), number('ordinaryDailyWageWon', '1일 통상임금', '원', '100000')],
  (raw) => ({ unusedDays: nonnegative(raw.unusedDays), ordinaryDailyWageWon: money(raw.ordinaryDailyWageWon) }), calculateAnnualLeaveAllowance,
  (result) => ({ summary: won('미사용 연차수당 예상액', result.allowanceWon), rows: benefitRows('이미 확인한 지급 대상 미사용 일수와 1일 통상임금만 적용') }));

const unemployment = define('unemployment-benefit', [number('dailyWageWon', '기초일액', '원', '100000'), number('eligibleDays', '소정급여일수', '일', '120', (raw) => new Decimal(wholeCount(raw, 0, 1200)), '0일 이상 정수'), manualMoney('dailyLowerLimitWon', '구직급여 1일 하한'), manualMoney('dailyUpperLimitWon', '구직급여 1일 상한')],
  (raw) => ({ dailyWageWon: money(raw.dailyWageWon), eligibleDays: wholeCount(raw.eligibleDays, 0, 1200), dailyLowerLimitWon: money(raw.dailyLowerLimitWon), dailyUpperLimitWon: money(raw.dailyUpperLimitWon) }), calculateUnemploymentBenefitEstimate,
  (result) => ({ summary: won('구직급여 총 예상액', result.totalBenefitWon), rows: [won('1일 구직급여 예상액', result.dailyBenefitWon), ...benefitRows('기초일액의 60%에 수동 입력한 1일 하한·상한을 적용') ] }));

const parentalLeave = define('parental-leave-benefit', [number('ordinaryMonthlyWageWon', '월 통상임금', '원', '3000000'), number('months', '휴직 개월 수', '개월', '3', months, '1~1,200개월, 정수'), manualRate('replacementRatePercent', '월 급여 지급률'), manualMoney('monthlyCapWon', '월 급여 상한')],
  (raw) => ({ ordinaryMonthlyWageWon: money(raw.ordinaryMonthlyWageWon), months: months(raw.months), replacementRatePercent: rate(raw.replacementRatePercent), monthlyCapWon: money(raw.monthlyCapWon) }), calculateParentalLeaveEstimate,
  (result) => ({ summary: won('육아휴직 급여 총 예상액', result.totalBenefitWon), rows: [won('월 급여 시나리오', result.monthlyBenefitWon), ...benefitRows('모든 월에 동일한 수동 입력 지급률·상한을 적용한 평면 시나리오') ] }));

const negotiation = define('salary-negotiation', [number('currentAnnualWon', '현재 연봉', '원', '40000000'), number('desiredAnnualWon', '목표 연봉', '원', '44000000')],
  (raw) => ({ currentAnnualWon: money(raw.currentAnnualWon), desiredAnnualWon: money(raw.desiredAnnualWon) }), calculateSalaryNegotiation,
  (result) => ({ summary: won('연봉 차이', result.annualIncreaseWon), rows: [won('월 차이', result.monthlyIncreaseWon), { label: '연봉 인상률', value: formattedPercentValue(result.increasePercent) }, { label: '계산 가정', value: '연봉을 12개월에 균등 배분해 비교' }] }));

const freelancer = define('freelancer-withholding', [number('grossWon', '총 수입', '원', '1000000'), number('deductibleExpenseWon', '차감 경비', '원', '200000'), manualRate('withholdingRatePercent', '원천징수율')],
  (raw) => ({ grossWon: money(raw.grossWon), deductibleExpenseWon: money(raw.deductibleExpenseWon), withholdingRatePercent: rate(raw.withholdingRatePercent) }), calculateFreelancerWithholding,
  (result) => ({ summary: won('원천징수 후 수령액', result.netReceiptWon), rows: [won('경비 차감 후 대상 시나리오', result.taxableBaseWon), won('원천징수 예상액', result.withholdingWon), { label: '계산 가정', value: '입력 경비를 뺀 금액에 수동 입력 세율을 적용한 시나리오' }] }));

const savingsPeriod = number('months', '저축 기간', '개월', '12', months, '1~1,200개월, 정수');
const taxRate = manualRate('taxRatePercent', '이자 세율');
function presentSavings(result: SavingsInterestResult, assumption: string): DisplayResult {
  return { summary: won('세후 만기 예상액', result.afterTaxMaturityAmount), rows: [won('총 납입원금', result.totalPaid), won('세전 예상 이자', result.totalInterest), won('입력 세율 기준 세금', result.tax), won('세후 예상 이자', result.afterTaxInterest), won('세전 만기 예상액', result.maturityAmount), { label: '계산 가정', value: assumption }] };
}

const savingsMaturity = define('savings-maturity', [number('monthlyContribution', '매월 납입액', '원', '100000'), number('annualRatePercent', '연 이자율', '%', '3', rate, '0~100%'), savingsPeriod, taxRate],
  (raw) => ({ monthlyContribution: money(raw.monthlyContribution), annualRatePercent: rate(raw.annualRatePercent), months: months(raw.months), taxRatePercent: rate(raw.taxRatePercent) }), calculateSavingsMaturity,
  (result) => presentSavings(result, '매월 말 납입 · 월 복리 · 세율 수동 입력'));

const depositInterest = define('deposit-interest', [number('principal', '예치 원금', '원', '1000000'), number('annualRatePercent', '연 이자율', '%', '3', rate, '0~100%'), savingsPeriod, taxRate],
  (raw) => ({ principal: money(raw.principal), annualRatePercent: rate(raw.annualRatePercent), months: months(raw.months), taxRatePercent: rate(raw.taxRatePercent) }), calculateDepositInterest,
  (result) => presentSavings(result, '단리 · 개월 수 기준 · 세율 수동 입력'));

const affordability = define('loan-affordability', [number('netMonthlyIncomeWon', '월 순수입', '원', '3000000'), number('existingMonthlyDebtWon', '기존 월 원리금 상환액', '원', '200000'), manualRate('allowedDebtRatioPercent', '직접 정한 월 상환 허용비율'), annualRate, repaymentMonths],
  (raw) => ({ netMonthlyIncomeWon: money(raw.netMonthlyIncomeWon), existingMonthlyDebtWon: money(raw.existingMonthlyDebtWon), allowedDebtRatioPercent: rate(raw.allowedDebtRatioPercent), annualRatePercent: rate(raw.annualRatePercent), months: months(raw.months) }), calculateLoanAffordability,
  (result) => ({ summary: won('상환 여력 기준 추정 원금', result.affordablePrincipalWon), rows: [won('입력 비율 기준 월 상환 예산', result.maximumMonthlyDebtWon), won('추가 월 상환 여력', result.availableMonthlyPaymentWon), { label: '계산 가정', value: '수동 허용비율 · 고정금리 원리금균등 · 대출 승인·한도 예측 아님' }] }));

const ratioRows: ReadonlyArray<ResultValue> = [{ label: '계산 범위', value: '입력값의 단순 비율이며 대출 승인·규제 충족을 판단하지 않습니다.' }, { label: '분모가 0원인 경우', value: '유효한 비율을 계산할 수 없어 편의상 0%로 표시합니다.' }];
const dsr = define('dsr', [number('annualIncomeWon', '연 소득', '원', '60000000'), number('annualDebtPaymentsWon', '연간 총 원리금 상환액', '원', '12000000')],
  (raw) => ({ annualIncomeWon: money(raw.annualIncomeWon), annualDebtPaymentsWon: money(raw.annualDebtPaymentsWon) }), calculateDsr,
  (result) => ({ summary: { label: '입력 기준 DSR', value: formattedPercentValue(result.percent) }, rows: ratioRows }));

const dti = define('dti', [number('annualIncomeWon', '연 소득', '원', '60000000'), number('annualHousingDebtPaymentsWon', '주택부채 연간 상환액', '원', '9000000')],
  (raw) => ({ annualIncomeWon: money(raw.annualIncomeWon), annualHousingDebtPaymentsWon: money(raw.annualHousingDebtPaymentsWon) }), calculateDti,
  (result) => ({ summary: { label: '주택부채 기준 단순 DTI 비율', value: formattedPercentValue(result.percent) }, rows: [...ratioRows, { label: '산정 항목', value: '주택부채 상환액만 반영하며 기타 대출 이자는 별도 산정하지 않습니다.' }] }));

const ltv = define('ltv', [number('loanWon', '대출 금액', '원', '300000000'), number('propertyValueWon', '담보 가치', '원', '500000000')],
  (raw) => ({ loanWon: money(raw.loanWon), propertyValueWon: money(raw.propertyValueWon) }), calculateLtv,
  (result) => ({ summary: { label: '입력 기준 LTV', value: formattedPercentValue(result.percent) }, rows: ratioRows }));

const cardInstalment = define('card-instalment', [number('principal', '할부 원금', '원', '1200000'), annualRate, repaymentMonths], loanInput,
  (input) => calculateRepaymentPlans(input).equalPayment,
  (plan) => { const result = presentPlan(plan, '원리금균등'); return { ...result, rows: [...result.rows!, { label: '계산 가정', value: '원리금균등 계획표이며 실제 카드사의 수수료·청구 방식과 다를 수 있습니다.' }] }; });

const manualExchange = define('manual-exchange-rate', [number('amount', '외화 금액', '외화 단위', '100', nonnegative, '0 이상 · 소수 입력 가능'), number('wonPerUnit', '외화 1단위당 원화 환율', '원/외화 단위', '', positive, '수동 입력 · 실시간 환율이 아닙니다 · 0 초과 · 소수 입력 가능')],
  (raw) => ({ amount: nonnegative(raw.amount), wonPerUnit: positive(raw.wonPerUnit) }), convertCurrency,
  (result) => ({ summary: won('수동 환율 기준 원화 환산액', result.amountWon), rows: [{ label: '환율 기준', value: '직접 입력한 환율이며 실시간 환율이 아닙니다.' }, { label: '계산 범위', value: '외화 1단위당 원화 값 적용 · 환전·송금 수수료 제외' }] }));

const acquisitionTax = define('acquisition-tax', [number('purchaseWon', '취득 금액', '원', '100000000'), manualRate('ratePercent', '직접 확인한 취득세율')],
  (raw) => ({ purchaseWon: money(raw.purchaseWon), ratePercent: rate(raw.ratePercent) }), calculateAcquisitionTax,
  (result) => ({ summary: won('입력 세율 기준 취득세 예상액', result.taxWon), rows: [{ label: '계산 범위', value: '지역·주택 수·감면·부가 세목을 판단하지 않는 단순 예상액' }] }));

const brokerageFee = define('brokerage-fee', [number('transactionWon', '거래 금액', '원', '100000000'), manualRate('ratePercent', '직접 확인한 보수 요율'), manualMoney('capWon', '직접 확인한 보수 상한')],
  (raw) => ({ transactionWon: money(raw.transactionWon), ratePercent: rate(raw.ratePercent), capWon: money(raw.capWon) }), calculateBrokerageFee,
  (result) => ({ summary: won('중개보수 예상액', result.feeWon), rows: [{ label: '계산 범위', value: '입력 요율과 상한만 적용 · 법정 보수 판정·부가세 제외 · 상한 0원은 결과 0원' }] }));

const depositConversion = define('deposit-rent-conversion', [number('depositWon', '전환 대상 보증금', '원', '120000000'), manualRate('conversionRatePercent', '직접 정한 연 전환율'), number('months', '환산 기간', '개월', '1', months, '1~1,200개월 정수')],
  (raw) => ({ depositWon: money(raw.depositWon), conversionRatePercent: rate(raw.conversionRatePercent), months: months(raw.months) }), calculateDepositRentConversion,
  (result) => ({ summary: won('기간 합계 환산 임대료', result.rentWon), rows: [{ label: '계산 범위', value: '입력한 연 전환율 기준 예상값 · 법정 상한 판단 제외' }] }));

const rentComparison = define('rent-vs-deposit', [number('depositWon', '보증금', '원', '120000000'), number('monthlyRentWon', '월세', '원', '0'), manualRate('conversionRatePercent', '연 기회비용률')],
  (raw) => ({ depositWon: money(raw.depositWon), monthlyRentWon: money(raw.monthlyRentWon), conversionRatePercent: rate(raw.conversionRatePercent) }), calculateRentComparison,
  (result) => ({ summary: won('기회비용 포함 월 환산 비용', result.monthlyEquivalentWon), rows: [{ label: '비교 방법', value: '계약 조건을 각각 입력해 월 환산 비용을 비교하세요. 실제 월 청구액과 다릅니다.' }] }));

const movingFields = [number('movingWon', '이사비', '원', '500000'), number('cleaningWon', '청소비', '원', '200000'), number('brokerageWon', '확인한 중개보수', '원', '300000'), number('otherWon', '기타 비용', '원', '100000')];
const setupFields = [number('furnitureWon', '가구 비용', '원', '300000'), number('appliancesWon', '가전 비용', '원', '500000'), number('suppliesWon', '생활용품 비용', '원', '100000'), number('otherWon', '기타 비용', '원', '100000')];
const holdingFields = [manualMoney('taxWon', '연간 세금 고지액'), number('insuranceWon', '연간 보험료', '원', '100000'), number('maintenanceWon', '연간 관리·수선비', '원', '800000'), number('interestWon', '연간 대출 이자', '원', '0'), number('otherWon', '연간 기타 비용', '원', '0')];
const parseBudgetItems = (raw: Raw, fields: ReadonlyArray<CalculatorField>) => ({ items: fields.map(({ name, label }) => ({ name: label, amountWon: money(raw[name]) })) });
const movingBudget = define('moving-budget', movingFields, (raw) => parseBudgetItems(raw, movingFields), calculateMovingBudget,
  (result) => ({ summary: won('이사 예산 합계', result.totalWon) }));
const setupBudget = define('one-person-setup-budget', setupFields, (raw) => parseBudgetItems(raw, setupFields), calculateSetupBudget,
  (result) => ({ summary: won('자취 초기 준비비 합계', result.totalWon) }));
const holdingCosts = define('holding-cost-checklist', holdingFields, (raw) => parseBudgetItems(raw, holdingFields), calculateHoldingCosts,
  (result) => ({ summary: won('연간 보유비용 합계', result.totalWon), rows: [{ label: '계산 범위', value: '직접 입력한 연간 비용만 합산 · 지역별 세금 예측 아님' }] }));

const housingAffordability = define('housing-affordability', [number('cashWon', '부대비용 제외 가용 현금', '원', '100000000'), number('netMonthlyIncomeWon', '월 순수입', '원', '3000000'), number('existingMonthlyDebtWon', '기존 월 원리금 상환액', '원', '200000'), manualRate('allowedDebtRatioPercent', '직접 정한 월 상환 허용비율'), manualRate('annualRatePercent', '직접 확인한 연 대출금리'), repaymentMonths, manualMoney('loanLimitWon', '직접 정한 대출한도')],
  (raw) => ({ cashWon: money(raw.cashWon), netMonthlyIncomeWon: money(raw.netMonthlyIncomeWon), existingMonthlyDebtWon: money(raw.existingMonthlyDebtWon), allowedDebtRatioPercent: rate(raw.allowedDebtRatioPercent), annualRatePercent: rate(raw.annualRatePercent), months: months(raw.months), loanLimitWon: money(raw.loanLimitWon) }), calculateHousingAffordability,
  (result) => ({ summary: won('주택 구매 예산 예상액', result.housingBudgetWon), rows: [won('추가 월 상환 여력', result.availableMonthlyPaymentWon), won('상환 여력 기준 원금', result.affordablePrincipalWon), won('입력 한도 반영 대출액', result.financingWon), { label: '계산 가정', value: '수동 비율·금리·한도와 원리금균등 가정 · 대출 승인·규제 한도 예측 아님' }] }));

const rentalYield = define('rental-yield', [number('annualRentWon', '연 임대료', '원', '12000000'), number('purchaseWon', '매입가', '원', '100000000'), number('annualCostsWon', '연 비용', '원', '2000000')],
  (raw) => ({ annualRentWon: money(raw.annualRentWon), purchaseWon: money(raw.purchaseWon), annualCostsWon: money(raw.annualCostsWon) }), calculateRentalYield,
  (result) => ({ summary: { label: '입력 기준 임대 수익률', value: formattedPercentValue(result.percent) }, rows: [{ label: '0% 표시 기준', value: '순임대료가 음수이거나 매입가가 0원이면 편의상 0% · 손실률 미표시' }] }));

const vat = define('vat', [number('supplyWon', '계산 대상 금액', '원', '100000'), manualRate('ratePercent', '직접 확인한 부가세율'), select('includesVat', '입력 금액의 부가세 포함 여부', [{ value: 'no', label: '부가세 별도 공급가' }, { value: 'yes', label: '부가세 포함 합계' }], 'no')],
  (raw) => ({ supplyWon: money(raw.supplyWon), ratePercent: rate(raw.ratePercent), includesVat: choice(raw.includesVat, ['no', 'yes']) === 'yes' }), calculateVat,
  (result) => ({ summary: won('입력 세율 기준 부가세', result.vatWon), rows: [won('공급가', result.supplyWon), won('부가세 포함 합계', result.totalWon), { label: '계산 범위', value: '단순 예상액 · 과세 유형·매입세액 공제·납부세액 판단 제외' }] }));

const profitFields = [number('salesWon', '매출', '원', '100000'), number('costWon', '원가', '원', '80000')];
const parseProfit = (raw: Raw) => ({ salesWon: money(raw.salesWon), costWon: money(raw.costWon) });
const margin = define('margin', profitFields, parseProfit, calculateMargin,
  (result) => ({ summary: { label: '매출 기준 마진율', value: formattedPercentValue(result.percent) }, rows: [won('이익', result.profitWon), { label: '분모 0원', value: '매출 0원은 비율 계산이 불가능해 편의상 0%로 표시' }] }));
const markup = define('markup', profitFields, parseProfit, calculateMarkup,
  (result) => ({ summary: { label: '원가 기준 가산율', value: formattedPercentValue(result.percent) }, rows: [won('이익', result.profitWon), { label: '분모 0원', value: '원가 0원은 비율 계산이 불가능해 편의상 0%로 표시' }] }));

const breakEven = define('break-even', [number('fixedCostWon', '기간 고정비', '원', '1000000'), number('unitPriceWon', '판매 단가', '원', '10000'), number('variableCostWon', '단위 변동비', '원', '6000')],
  (raw) => ({ fixedCostWon: money(raw.fixedCostWon), unitPriceWon: money(raw.unitPriceWon), variableCostWon: money(raw.variableCostWon) }), calculateBreakEven,
  (result) => result === null ? { summary: { label: '손익분기 수량', value: '도달 불가' }, rows: [{ label: '원인', value: '판매 단가가 단위 변동비 이하입니다.' }] } : { summary: { label: '손익분기 수량', value: `${formatNumber(result.units, 0)}개` }, rows: [won('손익분기 매출', result.salesWon), won('판매당 기여이익', result.contributionMarginWon)] });

const commissionFields = [number('grossSalesWon', '총매출', '원', '1000000'), manualRate('platformFeePercent', '플랫폼 수수료율'), manualRate('paymentFeePercent', '결제 수수료율'), number('shippingWon', '배송비 합계', '원', '30000')];
const parseCommission = (raw: Raw) => ({ grossSalesWon: money(raw.grossSalesWon), platformFeePercent: rate(raw.platformFeePercent), paymentFeePercent: rate(raw.paymentFeePercent), shippingWon: money(raw.shippingWon) });
function presentSettlement(result: CommissionSettlementResult): DisplayResult {
  return { summary: won('예상 정산액', result.settlementWon), rows: [won('플랫폼 수수료', result.platformFeeWon), won('결제 수수료', result.paymentFeeWon), won('배송비', result.shippingWon), won('차감 합계', result.totalDeductionsWon), { label: '계산 가정', value: '두 수수료 모두 총매출 기준 · 입력 요율만 적용 · 원가·세금 제외' }] };
}
const salesCommission = define('sales-commission', commissionFields, parseCommission, calculateCommissionSettlement, presentSettlement);
const onlineSettlement = define('online-market-settlement', [...commissionFields, number('returnsWon', '반품액 합계', '원', '0')],
  (raw) => ({ ...parseCommission(raw), returnsWon: money(raw.returnsWon) }), calculateOnlineMarketSettlement,
  (result) => { const presented = presentSettlement(result); return { ...presented, rows: [...presented.rows!, won('반품 차감액', result.returnsWon), { label: '반품 처리', value: '반품 전 총매출에 수수료 적용 · 반품 수수료 환급 제외' }] }; });

const freelancerNet = define('freelancer-net-income', [number('grossWon', '총수입', '원', '1000000'), number('expenseWon', '지출 경비', '원', '200000'), manualRate('withholdingRatePercent', '직접 확인한 원천징수율')],
  (raw) => ({ grossWon: money(raw.grossWon), expenseWon: money(raw.expenseWon), withholdingRatePercent: rate(raw.withholdingRatePercent) }), calculateFreelancerNetIncome,
  (result) => ({ summary: won('경비 차감 후 예상 순수입', result.netWon), rows: [won('총수입 기준 원천징수액', result.withholdingWon), { label: '계산 범위', value: '경비 차감 전 총수입에 입력 요율 적용 · 종합소득세 확정액 아님' }] }));

const monthlyProfitFields = [number('salesWon', '월 매출', '원', '1000000'), number('fixedCostWon', '월 고정비', '원', '300000'), number('variableCostWon', '월 변동비 합계', '원', '200000')];
const parseMonthlyProfit = (raw: Raw) => ({ salesWon: money(raw.salesWon), fixedCostWon: money(raw.fixedCostWon), variableCostWon: money(raw.variableCostWon) });
const monthlyProfitLoss = define('monthly-profit-loss', monthlyProfitFields, parseMonthlyProfit, calculateMonthlyProfitLoss,
  (result) => ({ summary: won('예상 월 손익', result.profitWon), rows: [won('월 비용 합계', result.totalCostsWon)] }));
const businessFeasibility = define('business-feasibility', [number('initialInvestmentWon', '초기 투자금', '원', '1000000'), ...monthlyProfitFields],
  (raw) => ({ ...parseMonthlyProfit(raw), initialInvestmentWon: money(raw.initialInvestmentWon) }), calculateBusinessFeasibility,
  (result) => ({ summary: { label: '단순 투자금 회수 기간', value: result.paybackMonths === null ? '회수 불가' : `${formatNumber(result.paybackMonths).replace(/\.0+$/, '')}개월` }, rows: [won('예상 월 손익', result.profitWon), { label: '계산 가정', value: '월 이익 일정 · 전액 투자 회수 사용 · 할인율·추가 투자 제외 · 월 이익 0 이하일 때 회수 불가' }] }));
const discountRate = define('discount-rate', [number('originalWon', '정가', '원', '100000', (raw) => { const value = money(raw); if (value.isZero()) throw new Error('정가는 0원보다 커야 합니다.'); return value; }), number('discountedWon', '할인가', '원', '80000')],
  (raw) => ({ originalWon: money(raw.originalWon), discountedWon: money(raw.discountedWon) }), calculateDiscountRate,
  (result) => ({ summary: { label: '정가 대비 할인율', value: formattedPercentValue(result.percent) }, rows: [won('할인 금액', result.discountWon)] }));

export const calculatorDefinitions: ReadonlyArray<RegisteredCalculator> = [maintenance, fuel, ev, purchase, installment, interest, comparison, compound, budget, takeHome, hourlyMonthly, weeklyHoliday, severance, annualLeave, unemployment, parentalLeave, negotiation, freelancer, savingsMaturity, depositInterest, affordability, dsr, dti, ltv, cardInstalment, manualExchange, acquisitionTax, brokerageFee, depositConversion, rentComparison, movingBudget, setupBudget, housingAffordability, rentalYield, holdingCosts, vat, margin, markup, breakEven, salesCommission, onlineSettlement, freelancerNet, monthlyProfitLoss, businessFeasibility, discountRate];
