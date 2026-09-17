import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calculateGpa,
  calculateGradeConversion,
  calculateStudyPlan,
  compareTimeZones,
  convertFuelEfficiency,
  convertUnit,
  generateLotteryNumbers,
  pickRandom,
} from '@/lib/education/study';

const d = (value: Decimal.Value) => new Decimal(value);

describe('study calculations', () => {
  it('weights GPA by course credits', () => {
    const result = calculateGpa({
      courses: [
        { credits: d(3), gradePoint: d(4) },
        { credits: d(1), gradePoint: d(2) },
      ],
    });
    expect(result.gpa.eq(d('3.5'))).toBe(true);
    expect(result.totalCredits.eq(d(4))).toBe(true);
  });

  it('returns a zero GPA for an empty or zero-credit course list', () => {
    expect(calculateGpa({ courses: [] }).gpa.isZero()).toBe(true);
    expect(calculateGpa({ courses: [{ credits: d(0), gradePoint: d(4) }] }).gpa.isZero()).toBe(true);
  });

  it('converts a grade proportionally between user-provided scales', () => {
    expect(calculateGradeConversion({ gradePoint: d('3.6'), fromScale: d('4.5'), toScale: d(4) }).gradePoint.eq(d('3.2'))).toBe(true);
  });

  it('divides total study minutes across whole days', () => {
    expect(calculateStudyPlan({ totalMinutes: d(1000), days: 7 }).dailyMinutes.toString()).toBe(
      '142.8571428571428571428571428571428571429',
    );
    expect(() => calculateStudyPlan({ totalMinutes: d(1000), days: 0 })).toThrow('일수');
  });
});

describe('unit conversions', () => {
  it('converts through a named base unit for length and mass', () => {
    expect(convertUnit({ value: d('1.25'), from: 'km', to: 'm' }).value.eq(d(1250))).toBe(true);
    expect(convertUnit({ value: d(1), from: 'lb', to: 'kg' }).value.eq(d('0.45359237'))).toBe(true);
  });

  it('converts temperature without binary floating-point drift', () => {
    expect(convertUnit({ value: d(32), from: 'fahrenheit', to: 'celsius' }).value.eq(d(0))).toBe(true);
    expect(convertUnit({ value: d(100), from: 'celsius', to: 'fahrenheit' }).value.eq(d(212))).toBe(true);
  });

  it('rejects temperatures below absolute zero regardless of the output unit', () => {
    expect(() => convertUnit({ value: d(-274), from: 'celsius', to: 'fahrenheit' })).toThrow('절대영도');
  });

  it('rejects conversions across incompatible unit categories', () => {
    expect(() => convertUnit({ value: d(1), from: 'kg', to: 'm' })).toThrow('같은 종류');
  });

  it('converts fuel efficiency through kilometres per litre', () => {
    expect(convertFuelEfficiency({ value: d(20), from: 'kmPerLitre', to: 'litresPer100Km' }).value.eq(d(5))).toBe(true);
    expect(convertFuelEfficiency({ value: d(10), from: 'litresPer100Km', to: 'kmPerLitre' }).value.eq(d(10))).toBe(true);
  });

  it('compares time zones using only user-provided UTC offsets', () => {
    expect(compareTimeZones({ localMinutes: 23 * 60 + 30, fromOffsetMinutes: 9 * 60, toOffsetMinutes: -5 * 60 })).toEqual({
      localMinutes: 9 * 60 + 30,
      dayOffset: 0,
    });
    expect(compareTimeZones({ localMinutes: 60, fromOffsetMinutes: -5 * 60, toOffsetMinutes: 9 * 60 })).toEqual({
      localMinutes: 15 * 60,
      dayOffset: 0,
    });
    expect(compareTimeZones({ localMinutes: 23 * 60, fromOffsetMinutes: 0, toOffsetMinutes: 2 * 60 })).toEqual({
      localMinutes: 60,
      dayOffset: 1,
    });
  });
});

describe('local random tools', () => {
  it('picks unique choices deterministically with an injected random source', () => {
    const values = [0.75, 0];
    let index = 0;
    expect(pickRandom({ choices: ['A', 'B', 'C', 'D'], count: 2, random: () => values[index++] })).toEqual({
      picks: ['D', 'B'],
    });
  });

  it('generates sorted unique lottery numbers in range with an injected source', () => {
    const result = generateLotteryNumbers({ random: () => 0 });
    expect(result.numbers).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(result.numbers).size).toBe(6);
    expect(result.numbers.every((number) => number >= 1 && number <= 45)).toBe(true);
  });

  it('rejects invalid random output instead of producing out-of-range indexes', () => {
    expect(() => pickRandom({ choices: ['A'], random: () => 1 })).toThrow('0 이상 1 미만');
  });
});
