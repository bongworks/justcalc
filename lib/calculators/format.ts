import Decimal from 'decimal.js';

function groupDigits(value: string): string {
  const [integer, fraction] = value.split('.');
  const sign = integer.startsWith('-') ? '-' : '';
  const digits = sign ? integer.slice(1) : integer;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${sign}${grouped}${fraction === undefined ? '' : `.${fraction}`}`;
}

function toDecimal(value: Decimal.Value): Decimal {
  return new Decimal(value);
}

export function formatWon(value: Decimal.Value): string {
  return `₩${groupDigits(toDecimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0))}`;
}

export function formatNumber(value: Decimal.Value, decimalPlaces = 2): string {
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new Error('소수 자릿수는 0 이상의 정수여야 합니다.');
  }

  return groupDigits(toDecimal(value).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP).toFixed(decimalPlaces));
}

export function formatPercent(value: Decimal.Value, decimalPlaces = 2): string {
  const formatted = formatNumber(value, decimalPlaces).replace(/(?:\.0+|(?:(\.\d*?)0+))$/, '$1');

  return `${formatted}%`;
}
