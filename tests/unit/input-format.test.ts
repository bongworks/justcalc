import { describe, expect, it } from 'vitest';
import { addMoneyInput, formatKoreanMoney, formatMoneyInput, moneyQuickAdditions } from '@/lib/calculators/input-format';
import { parseMoney } from '@/lib/calculators/validation';

describe('money input formatting', () => {
  it.each([
    ['0', '0원'],
    ['9999', '9,999원'],
    ['12000000', '1,200만 원'],
    ['100000001', '1억 1원'],
    ['123456789012345', '123조 4,567억 8,901만 2,345원'],
    ['1000000000000000', '1,000조 원'],
  ])('reads %s in exact Korean money units', (raw, expected) => {
    expect(formatKoreanMoney(raw)).toBe(expected);
  });

  it.each(['', ' ', 'abc', '-10000', '-0', '0.5', 'Infinity', 'NaN', '1e1000000000'])('leaves unsupported input %s untouched', (raw) => {
    expect(formatMoneyInput(raw)).toBe(raw);
    expect(formatKoreanMoney(raw)).toBeUndefined();
    if (raw.trim()) expect(addMoneyInput(raw, '10000')).toBeUndefined();
  });

  it.each([
    [' 12,000,000 ', '12,000,000'],
    ['1e8', '100,000,000'],
    ['1000000000000000', '1,000,000,000,000,000'],
  ])('keeps %s compatible with the existing money parser', (raw, formatted) => {
    expect(formatMoneyInput(raw)).toBe(formatted);
    expect(parseMoney(formatted).eq(parseMoney(raw))).toBe(true);
  });

  it('adds an increment exactly without losing low digits in a large amount', () => {
    expect(addMoneyInput('123,456,789,012,345', '10000')).toBe('123,456,789,022,345');
    expect(addMoneyInput('', '10000')).toBe('10,000');
    expect(addMoneyInput('100', '-1')).toBeUndefined();
  });

  it('keeps small and large default amount increments within three choices', () => {
    expect(moneyQuickAdditions('')).toEqual([
      { label: '1만원', value: '10000' },
      { label: '10만원', value: '100000' },
      { label: '100만원', value: '1000000' },
    ]);
    expect(moneyQuickAdditions('100,000,000')).toEqual([
      { label: '100만원', value: '1000000' },
      { label: '1,000만원', value: '10000000' },
      { label: '1억원', value: '100000000' },
    ]);
  });
});
