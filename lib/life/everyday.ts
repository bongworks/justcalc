import Decimal from 'decimal.js';

const EverydayDecimal = Decimal.clone({ precision: 40 });

function decimal(value: Decimal, label: string): Decimal {
  const result = new EverydayDecimal(value);
  if (!result.isFinite()) throw new Error(`${label}은(는) 유한한 값이어야 합니다.`);
  return result;
}

function nonNegativeDecimal(value: Decimal, label: string): Decimal {
  const result = decimal(value, label);
  if (result.isNegative()) throw new Error(`${label}은(는) 0 이상이어야 합니다.`);
  return result;
}

function positivePeople(people: number): number {
  if (!Number.isSafeInteger(people) || people <= 0) throw new Error('인원은 1 이상의 안전한 정수여야 합니다.');
  return people;
}

export function calculatePercentage(input: { part: Decimal; whole: Decimal }): { percentage: Decimal } {
  const part = decimal(input.part, '부분');
  const whole = decimal(input.whole, '전체');
  return { percentage: whole.isZero() ? new EverydayDecimal(0) : part.div(whole).mul(100) };
}

// Whole-won division keeps undistributed won visible instead of rounding it away.
export function calculateSplitExpense(input: { totalWon: Decimal; people: number }): {
  perPersonWon: Decimal;
  remainderWon: Decimal;
} {
  const totalWon = nonNegativeDecimal(input.totalWon, '총액');
  if (!totalWon.isInteger()) throw new Error('총액은 원 단위 정수여야 합니다.');
  const people = positivePeople(input.people);
  const perPersonWon = totalWon.dividedToIntegerBy(people);
  return { perPersonWon, remainderWon: totalWon.minus(perPersonWon.mul(people)) };
}

export function calculateElectricityEstimate(input: { kwh: Decimal; wonPerKwh: Decimal; baseWon: Decimal }): {
  totalWon: Decimal;
} {
  const kwh = nonNegativeDecimal(input.kwh, '사용량');
  const wonPerKwh = nonNegativeDecimal(input.wonPerKwh, 'kWh당 요금');
  const baseWon = nonNegativeDecimal(input.baseWon, '기본 요금');
  return { totalWon: kwh.mul(wonPerKwh).add(baseWon) };
}

export function calculatePhonePlanCost(input: {
  monthlyWon: Decimal;
  months: number;
  deviceWon: Decimal;
  discountWon: Decimal;
}): { totalWon: Decimal } {
  if (!Number.isSafeInteger(input.months) || input.months < 0) {
    throw new Error('개월 수는 0 이상의 안전한 정수여야 합니다.');
  }
  const monthlyWon = nonNegativeDecimal(input.monthlyWon, '월 요금');
  const deviceWon = nonNegativeDecimal(input.deviceWon, '기기 가격');
  const discountWon = nonNegativeDecimal(input.discountWon, '할인액');
  return { totalWon: monthlyWon.mul(input.months).add(deviceWon).minus(discountWon) };
}

export function calculateTipSplit(input: {
  billWon: Decimal;
  tipPercent: Decimal;
  people: number;
}): { tipWon: Decimal; totalWon: Decimal; perPersonWon: Decimal } {
  const billWon = nonNegativeDecimal(input.billWon, '결제 금액');
  const tipPercent = nonNegativeDecimal(input.tipPercent, '팁 비율');
  const people = positivePeople(input.people);
  const tipWon = billWon.mul(tipPercent).div(100);
  const totalWon = billWon.add(tipWon);
  return { tipWon, totalWon, perPersonWon: totalWon.div(people) };
}
