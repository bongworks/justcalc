import Decimal from 'decimal.js';

const StudyDecimal = Decimal.clone({ precision: 40 });
const UINT32_RANGE = 0x1_0000_0000;
const MAX_LOTTERY_NUMBER = 10_000;

const LINEAR_UNITS = {
  mm: { category: 'length', toBase: '0.001' },
  cm: { category: 'length', toBase: '0.01' },
  m: { category: 'length', toBase: '1' },
  km: { category: 'length', toBase: '1000' },
  in: { category: 'length', toBase: '0.0254' },
  ft: { category: 'length', toBase: '0.3048' },
  yd: { category: 'length', toBase: '0.9144' },
  mi: { category: 'length', toBase: '1609.344' },
  mg: { category: 'mass', toBase: '0.000001' },
  g: { category: 'mass', toBase: '0.001' },
  kg: { category: 'mass', toBase: '1' },
  oz: { category: 'mass', toBase: '0.028349523125' },
  lb: { category: 'mass', toBase: '0.45359237' },
} as const;

const TEMPERATURE_UNITS = ['celsius', 'fahrenheit', 'kelvin'] as const;

export type LinearUnit = keyof typeof LINEAR_UNITS;
export type TemperatureUnit = (typeof TEMPERATURE_UNITS)[number];
export type ConvertibleUnit = LinearUnit | TemperatureUnit;
export type FuelEfficiencyUnit = 'kmPerLitre' | 'litresPer100Km' | 'milesPerGallonUs';
export type RandomSource = () => number;

function decimal(value: Decimal, label: string): Decimal {
  const result = new StudyDecimal(value);
  if (!result.isFinite()) throw new Error(`${label}은(는) 유한한 값이어야 합니다.`);
  return result;
}

function nonNegativeDecimal(value: Decimal, label: string): Decimal {
  const result = decimal(value, label);
  if (result.isNegative()) throw new Error(`${label}은(는) 0 이상이어야 합니다.`);
  return result;
}

export function calculateGpa(input: {
  courses: readonly { credits: Decimal; gradePoint: Decimal }[];
}): { gpa: Decimal; totalCredits: Decimal } {
  const totals = input.courses.reduce(
    (result, course) => {
      const credits = nonNegativeDecimal(course.credits, '학점');
      const gradePoint = nonNegativeDecimal(course.gradePoint, '평점');
      return {
        credits: result.credits.add(credits),
        weightedPoints: result.weightedPoints.add(credits.mul(gradePoint)),
      };
    },
    { credits: new StudyDecimal(0), weightedPoints: new StudyDecimal(0) },
  );

  return {
    gpa: totals.credits.isZero() ? new StudyDecimal(0) : totals.weightedPoints.div(totals.credits),
    totalCredits: totals.credits,
  };
}

export function calculateGradeConversion(input: {
  gradePoint: Decimal;
  fromScale: Decimal;
  toScale: Decimal;
}): { gradePoint: Decimal } {
  const gradePoint = nonNegativeDecimal(input.gradePoint, '평점');
  const fromScale = nonNegativeDecimal(input.fromScale, '원본 만점');
  const toScale = nonNegativeDecimal(input.toScale, '변환 만점');
  if (fromScale.lte(0) || toScale.lte(0)) throw new Error('만점은 0보다 커야 합니다.');
  return { gradePoint: gradePoint.div(fromScale).mul(toScale) };
}

export function calculateStudyPlan(input: { totalMinutes: Decimal; days: number }): { dailyMinutes: Decimal } {
  if (!Number.isSafeInteger(input.days) || input.days <= 0) throw new Error('일수는 1 이상의 안전한 정수여야 합니다.');
  return { dailyMinutes: nonNegativeDecimal(input.totalMinutes, '총 학습 시간').div(input.days) };
}

function isTemperatureUnit(unit: ConvertibleUnit): unit is TemperatureUnit {
  return (TEMPERATURE_UNITS as readonly string[]).includes(unit);
}

function toCelsius(value: Decimal, unit: TemperatureUnit): Decimal {
  if (unit === 'fahrenheit') return value.minus(32).mul(5).div(9);
  if (unit === 'kelvin') return value.minus('273.15');
  return value;
}

function fromCelsius(value: Decimal, unit: TemperatureUnit): Decimal {
  if (unit === 'fahrenheit') return value.mul(9).div(5).add(32);
  if (unit === 'kelvin') return value.add('273.15');
  return value;
}

// Linear units share a named base; temperatures use Celsius as an affine base.
export function convertUnit(input: { value: Decimal; from: ConvertibleUnit; to: ConvertibleUnit }): { value: Decimal } {
  const value = decimal(input.value, '변환할 값');
  const { from, to } = input;
  if (isTemperatureUnit(from)) {
    if (!isTemperatureUnit(to)) throw new Error('같은 종류의 단위끼리만 변환할 수 있습니다.');
    const celsius = toCelsius(value, from);
    if (celsius.lt('-273.15')) throw new Error('절대영도보다 낮은 온도는 변환할 수 없습니다.');
    return { value: fromCelsius(celsius, to) };
  }
  if (isTemperatureUnit(to)) throw new Error('같은 종류의 단위끼리만 변환할 수 있습니다.');

  const fromDefinition = LINEAR_UNITS[from];
  const toDefinition = LINEAR_UNITS[to];
  if (fromDefinition.category !== toDefinition.category) throw new Error('같은 종류의 단위끼리만 변환할 수 있습니다.');
  return { value: value.mul(fromDefinition.toBase).div(toDefinition.toBase) };
}

function fuelEfficiencyToBase(value: Decimal, unit: FuelEfficiencyUnit): Decimal {
  if (unit === 'litresPer100Km') return new StudyDecimal(100).div(value);
  if (unit === 'milesPerGallonUs') return value.mul('1.609344').div('3.785411784');
  return value;
}

function fuelEfficiencyFromBase(value: Decimal, unit: FuelEfficiencyUnit): Decimal {
  if (unit === 'litresPer100Km') return new StudyDecimal(100).div(value);
  if (unit === 'milesPerGallonUs') return value.mul('3.785411784').div('1.609344');
  return value;
}

export function convertFuelEfficiency(input: {
  value: Decimal;
  from: FuelEfficiencyUnit;
  to: FuelEfficiencyUnit;
}): { value: Decimal } {
  const value = nonNegativeDecimal(input.value, '연비');
  if (value.lte(0)) throw new Error('연비는 0보다 커야 합니다.');
  return { value: fuelEfficiencyFromBase(fuelEfficiencyToBase(value, input.from), input.to) };
}

export function compareTimeZones(input: {
  localMinutes: number;
  fromOffsetMinutes: number;
  toOffsetMinutes: number;
}): { localMinutes: number; dayOffset: number } {
  if (!Number.isInteger(input.localMinutes) || input.localMinutes < 0 || input.localMinutes >= 1440) {
    throw new Error('현지 시간은 0분 이상 1440분 미만의 정수여야 합니다.');
  }
  for (const offset of [input.fromOffsetMinutes, input.toOffsetMinutes]) {
    if (!Number.isInteger(offset) || offset < -1440 || offset > 1440) {
      throw new Error('UTC 오프셋은 -1440분부터 1440분 사이의 정수여야 합니다.');
    }
  }

  const destinationMinutes = input.localMinutes - input.fromOffsetMinutes + input.toOffsetMinutes;
  const dayOffset = Math.floor(destinationMinutes / 1440);
  return { localMinutes: destinationMinutes - dayOffset * 1440, dayOffset };
}

function secureRandomIndex(size: number): number {
  if (typeof window === 'undefined' || !globalThis.crypto?.getRandomValues) {
    throw new Error('무작위 선택은 브라우저의 암호학적 난수가 필요합니다.');
  }

  const acceptedRange = Math.floor(UINT32_RANGE / size) * size;
  const values = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(values);
  } while (values[0] >= acceptedRange);
  return values[0] % size;
}

function randomIndex(size: number, random?: RandomSource): number {
  if (!random) return secureRandomIndex(size);
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('난수는 0 이상 1 미만이어야 합니다.');
  return Math.floor(value * size);
}

// Partial Fisher-Yates selection guarantees uniqueness without retry loops.
export function pickRandom<T>(input: {
  choices: readonly T[];
  count?: number;
  random?: RandomSource;
}): { picks: T[] } {
  const count = input.count ?? 1;
  if (!Number.isSafeInteger(count) || count <= 0 || count > input.choices.length) {
    throw new Error('선택 개수는 1 이상이고 항목 수 이하인 정수여야 합니다.');
  }

  const choices = [...input.choices];
  for (let index = 0; index < count; index += 1) {
    const selectedIndex = index + randomIndex(choices.length - index, input.random);
    [choices[index], choices[selectedIndex]] = [choices[selectedIndex], choices[index]];
  }
  return { picks: choices.slice(0, count) };
}

export function generateLotteryNumbers(input: {
  count?: number;
  maximum?: number;
  random?: RandomSource;
} = {}): { numbers: number[] } {
  const count = input.count ?? 6;
  const maximum = input.maximum ?? 45;
  if (!Number.isSafeInteger(maximum) || maximum <= 0 || maximum > MAX_LOTTERY_NUMBER) {
    throw new Error('최대 번호는 1 이상 10,000 이하의 정수여야 합니다.');
  }
  if (!Number.isSafeInteger(count) || count <= 0 || count > maximum) {
    throw new Error('선택 개수는 1 이상이고 최대 번호 이하인 정수여야 합니다.');
  }

  // A virtual partial Fisher-Yates draw stores only the positions touched by count selections.
  const substitutions = new Map<number, number>();
  const numbers: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const selectedIndex = index + randomIndex(maximum - index, input.random);
    const selectedValue = substitutions.get(selectedIndex) ?? selectedIndex;
    const currentValue = substitutions.get(index) ?? index;
    if (selectedIndex !== index) substitutions.set(selectedIndex, currentValue);
    substitutions.delete(index);
    numbers.push(selectedValue + 1);
  }

  return { numbers: numbers.sort((left, right) => left - right) };
}
