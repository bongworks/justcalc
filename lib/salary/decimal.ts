import Decimal from 'decimal.js';

// Isolate arithmetic from global Decimal configuration, retaining fractional won.
export const SalaryDecimal = Decimal.clone({ precision: 40 });

export function amount(value: Decimal, label: string): Decimal {
  const result = new SalaryDecimal(value);
  if (!result.isFinite() || result.lt(0)) throw new Error(`${label}은(는) 유한한 0 이상 값이어야 합니다.`);
  return result;
}

export function percent(value: Decimal, label: string): Decimal {
  const result = amount(value, label);
  if (result.gt(100)) throw new Error(`${label}은(는) 100 이하여야 합니다.`);
  return result;
}

export function count(value: number, label: string, maximum = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${label}은(는) 0 이상 ${maximum} 이하 정수여야 합니다.`);
  }
  return value;
}
