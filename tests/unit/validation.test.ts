import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  parseMoney,
  parseNonNegativeDecimal,
  parsePositiveDecimal,
} from '@/lib/calculators/validation';
import { formatNumber, formatPercent, formatWon } from '@/lib/calculators/format';

describe('parsePositiveDecimal', () => {
  it('accepts a Korean-formatted numeric string after commas are removed', () => {
    expect(parsePositiveDecimal('12,345.67').toString()).toBe('12345.67');
  });

  it('rejects zero, negative values, and empty input', () => {
    expect(() => parsePositiveDecimal('0')).toThrow();
    expect(() => parsePositiveDecimal('-1')).toThrow();
    expect(() => parsePositiveDecimal('')).toThrow();
  });
});

describe('decimal boundaries', () => {
  it('normalizes whitespace and permits zero only for non-negative values', () => {
    expect(parseNonNegativeDecimal(' 1,200.50 ').toString()).toBe('1200.5');
    expect(parseNonNegativeDecimal('0').toString()).toBe('0');
  });

  it('accepts only whole non-negative won amounts', () => {
    expect(parseMoney(' 12,345 ').toString()).toBe('12345');
    expect(() => parseMoney('12.5')).toThrow();
    expect(() => parseMoney('-1')).toThrow();
  });
});

describe('decimal formatting', () => {
  it('rounds won half up once before grouping', () => {
    expect(formatWon(new Decimal('1234.5'))).toBe('₩1,235');
  });

  it('formats decimal values and percentages without scientific notation', () => {
    expect(formatNumber(new Decimal('1234567.891'), 2)).toBe('1,234,567.89');
    expect(formatPercent(new Decimal('12.5'))).toBe('12.5%');
  });
});
