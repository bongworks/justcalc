import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  calculateBmi,
  calculateBmr,
  calculateDailyCalories,
  calculateMacroNutrients,
  calculateRunningPace,
  calculateTargetWeight,
  calculateWalkingCalories,
  calculateWaterIntake,
} from '@/lib/health/body';

const d = (value: Decimal.Value) => new Decimal(value);

describe('body and exercise calculations', () => {
  it('computes BMI in kilograms per square metre', () => {
    expect(calculateBmi({ weightKg: d(70), heightCm: d(175) }).value.toDecimalPlaces(2)).toEqual(
      d(22.86),
    );
  });

  it('uses the displayed Mifflin-St Jeor sex constants', () => {
    expect(calculateBmr({ sex: 'male', weightKg: d(70), heightCm: d(175), age: 30 }).value).toEqual(
      d(1648.75),
    );
    expect(
      calculateBmr({ sex: 'female', weightKg: d(70), heightCm: d(175), age: 30 }).value,
    ).toEqual(d(1482.75));
  });

  it('applies activity and goal adjustment to daily calories', () => {
    expect(
      calculateDailyCalories({
        bmr: d(1600),
        activityMultiplier: d('1.5'),
        goalAdjustmentKcal: d(-300),
      }).targetKcal,
    ).toEqual(d(2100));
  });

  it('uses 4/4/9 kcal per gram for macronutrients', () => {
    const result = calculateMacroNutrients({
      caloriesKcal: d(1800),
      proteinPercent: d(20),
      carbPercent: d(50),
      fatPercent: d(30),
    });

    expect(result.proteinGrams).toEqual(d(90));
    expect(result.carbGrams).toEqual(d(225));
    expect(result.fatGrams).toEqual(d(60));
  });

  it('calculates target weight from target BMI and squared height in metres', () => {
    expect(calculateTargetWeight({ heightCm: d(175), targetBmi: d(22) }).targetWeightKg).toEqual(
      d('67.375'),
    );
  });

  it('calculates pace from elapsed seconds and distance', () => {
    expect(calculateRunningPace({ distanceKm: d(5), seconds: d(1500) }).secondsPerKm).toEqual(
      d(300),
    );
  });

  it('uses the user-entered walking energy rate', () => {
    expect(
      calculateWalkingCalories({ distanceKm: d('4.5'), kcalPerKm: d(55) }).caloriesKcal,
    ).toEqual(d('247.5'));
  });

  it('converts millilitres per kilogram to litres', () => {
    expect(calculateWaterIntake({ weightKg: d(70), mlPerKg: d(35) }).litres).toEqual(d('2.45'));
  });

  it('rejects impossible zero height, distance, and time inputs', () => {
    expect(() => calculateBmi({ weightKg: d(70), heightCm: d(0) })).toThrow(
      '키는 0보다 커야 합니다.',
    );
    expect(() => calculateTargetWeight({ heightCm: d(0), targetBmi: d(22) })).toThrow(
      '키는 0보다 커야 합니다.',
    );
    expect(() => calculateRunningPace({ distanceKm: d(0), seconds: d(1500) })).toThrow(
      '거리는 0보다 커야 합니다.',
    );
    expect(() => calculateRunningPace({ distanceKm: d(5), seconds: d(0) })).toThrow(
      '시간은 0보다 커야 합니다.',
    );
    expect(() => calculateWalkingCalories({ distanceKm: d(0), kcalPerKm: d(55) })).toThrow(
      '거리는 0보다 커야 합니다.',
    );
  });
});
