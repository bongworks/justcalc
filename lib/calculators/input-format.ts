import Decimal from 'decimal.js';
import { formatNumber } from './format';
import { parseMoney } from './validation';

function inputMoney(raw: string): Decimal | undefined {
  try {
    const value = parseMoney(raw);
    // Avoid expanding extreme exponents during editing; calculator limits fit within 16 digits.
    return !value.isNegative() && value.e < 16 ? value : undefined;
  } catch {
    return undefined;
  }
}

export function formatMoneyInput(raw: string): string {
  const value = inputMoney(raw);
  return value ? formatNumber(value, 0) : raw;
}

export function formatKoreanMoney(raw: string): string | undefined {
  let remainder = inputMoney(raw);
  if (!remainder) return undefined;
  const parts: string[] = [];
  for (const [unit, size] of [['조', 1e12], ['억', 1e8], ['만', 1e4]] as const) {
    const group = remainder.divToInt(size);
    if (!group.isZero()) parts.push(`${formatNumber(group, 0)}${unit}`);
    remainder = remainder.mod(size);
  }
  if (!remainder.isZero() || !parts.length) parts.push(`${formatNumber(remainder, 0)}원`);
  else parts.push('원');
  return parts.join(' ');
}

export function addMoneyInput(raw: string, increment: string): string | undefined {
  const value = inputMoney(raw.trim() ? raw : '0');
  const addition = inputMoney(increment);
  if (!value || !addition || addition.isZero()) return undefined;
  const sum = value.plus(addition);
  return sum.e < 16 ? formatNumber(sum, 0) : undefined;
}

export function moneyQuickAdditions(defaultRaw: string) {
  return inputMoney(defaultRaw)?.gte(100000000)
    ? [{ label: '100만원', value: '1000000' }, { label: '1,000만원', value: '10000000' }, { label: '1억원', value: '100000000' }]
    : [{ label: '1만원', value: '10000' }, { label: '10만원', value: '100000' }, { label: '100만원', value: '1000000' }];
}
