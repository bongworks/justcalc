import { describe, expect, it } from 'vitest';
import {
  calculateDaysBetween,
  calculateDateOffset,
  calculateDday,
  calculateInternationalAge,
  calculateKoreanAge,
  calculateWeekday,
  calculateZodiac,
} from '@/lib/life/date';

describe('life date calculations', () => {
  it('calculates signed calendar days without elapsed-time drift', () => {
    expect(calculateDaysBetween({ start: '2026-03-28', end: '2026-03-30' })).toEqual({ days: 2 });
    expect(calculateDaysBetween({ start: '2026-03-30', end: '2026-03-28' })).toEqual({ days: -2 });
  });

  it('rejects non-canonical and impossible ISO dates', () => {
    for (const end of ['2026-2-03', '2026-02-30', '2026-13-01', 'not-a-date']) {
      expect(() => calculateDaysBetween({ start: '2026-01-01', end })).toThrow('YYYY-MM-DD');
    }
  });

  it('adds signed whole days and preserves a canonical ISO date', () => {
    expect(calculateDateOffset({ date: '2024-02-28', days: 2 })).toEqual({ date: '2024-03-01' });
    expect(calculateDateOffset({ date: '2026-01-01', days: -1 })).toEqual({ date: '2025-12-31' });
    expect(() => calculateDateOffset({ date: '2026-01-01', days: 1.5 })).toThrow('정수');
  });

  it('rejects an offset outside the supported four-digit ISO date range', () => {
    expect(() => calculateDateOffset({ date: '2026-01-01', days: Number.MAX_SAFE_INTEGER })).toThrow('결과 날짜');
  });

  it('defines D-day as target date minus the explicitly supplied reference date', () => {
    expect(calculateDday({ targetDate: '2026-01-10', referenceDate: '2026-01-01' })).toEqual({ days: 9 });
    expect(calculateDday({ targetDate: '2025-12-31', referenceDate: '2026-01-01' })).toEqual({ days: -1 });
  });

  it('returns the weekday for the ISO calendar date using Korean labels', () => {
    expect(calculateWeekday({ date: '2026-01-01' })).toEqual({ weekdayIndex: 4, weekday: '목요일' });
  });

  it('calculates completed international years around the birthday', () => {
    expect(calculateInternationalAge({ birthDate: '2000-09-18', referenceDate: '2026-09-17' })).toEqual({ age: 25 });
    expect(calculateInternationalAge({ birthDate: '2000-09-17', referenceDate: '2026-09-17' })).toEqual({ age: 26 });
  });

  it('rejects age calculations whose birth date is after the reference date', () => {
    expect(() =>
      calculateInternationalAge({ birthDate: '2026-09-18', referenceDate: '2026-09-17' }),
    ).toThrow('출생일');
    expect(() => calculateKoreanAge({ birthDate: '2026-09-18', referenceDate: '2026-09-17' })).toThrow('출생일');
  });

  it('calculates Korean age from calendar years', () => {
    expect(calculateKoreanAge({ birthDate: '2000-12-31', referenceDate: '2026-01-01' })).toEqual({ age: 27 });
  });

  it('maps the birth year to the fixed twelve-animal zodiac cycle', () => {
    expect(calculateZodiac({ birthDate: '2020-06-15' })).toEqual({ zodiac: '쥐' });
    expect(calculateZodiac({ birthDate: '2025-01-01' })).toEqual({ zodiac: '뱀' });
  });
});
