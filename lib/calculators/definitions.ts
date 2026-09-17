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
import { calculateMonthlyBudget } from '@/lib/life/budget';

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

export const calculatorDefinitions: ReadonlyArray<RegisteredCalculator> = [maintenance, fuel, ev, purchase, installment, interest, comparison, compound, budget];
