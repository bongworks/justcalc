import Decimal from 'decimal.js';

export interface BmiInput {
  weightKg: Decimal;
  heightCm: Decimal;
}

export interface BmrInput extends BmiInput {
  sex: 'male' | 'female';
  age: number;
}

export interface ValueResult {
  value: Decimal;
}

export interface DailyCaloriesInput {
  bmr: Decimal;
  activityMultiplier: Decimal;
  goalAdjustmentKcal: Decimal;
}

export interface DailyCaloriesResult {
  targetKcal: Decimal;
}

export interface MacroNutrientsInput {
  caloriesKcal: Decimal;
  proteinPercent: Decimal;
  carbPercent: Decimal;
  fatPercent: Decimal;
}

export interface MacroNutrientsResult {
  proteinGrams: Decimal;
  carbGrams: Decimal;
  fatGrams: Decimal;
}

export interface TargetWeightInput {
  heightCm: Decimal;
  targetBmi: Decimal;
}

export interface TargetWeightResult {
  targetWeightKg: Decimal;
}

export interface RunningPaceInput {
  distanceKm: Decimal;
  seconds: Decimal;
}

export interface RunningPaceResult {
  secondsPerKm: Decimal;
}

export interface WalkingCaloriesInput {
  distanceKm: Decimal;
  kcalPerKm: Decimal;
}

export interface WalkingCaloriesResult {
  caloriesKcal: Decimal;
}

export interface WaterIntakeInput {
  weightKg: Decimal;
  mlPerKg: Decimal;
}

export interface WaterIntakeResult {
  litres: Decimal;
}

function heightInMetres(heightCm: Decimal): Decimal {
  if (heightCm.lte(0)) {
    throw new Error('키는 0보다 커야 합니다.');
  }
  return heightCm.div(100);
}

function positiveDistance(distanceKm: Decimal): void {
  if (distanceKm.lte(0)) {
    throw new Error('거리는 0보다 커야 합니다.');
  }
}

// BMI uses metres, while the form-facing contract accepts centimetres.
export function calculateBmi(input: BmiInput): ValueResult {
  const heightMetres = heightInMetres(input.heightCm);
  return { value: input.weightKg.div(heightMetres.pow(2)) };
}

// Mifflin-St Jeor: 10W + 6.25H - 5A, plus 5 for men or minus 161 for women.
export function calculateBmr(input: BmrInput): ValueResult {
  heightInMetres(input.heightCm);
  const sexAdjustment = input.sex === 'male' ? new Decimal(5) : new Decimal(-161);
  return {
    value: input.weightKg
      .mul(10)
      .add(input.heightCm.mul('6.25'))
      .sub(new Decimal(input.age).mul(5))
      .add(sexAdjustment),
  };
}

// Apply activity first, then the user's explicit goal adjustment.
export function calculateDailyCalories(input: DailyCaloriesInput): DailyCaloriesResult {
  return { targetKcal: input.bmr.mul(input.activityMultiplier).add(input.goalAdjustmentKcal) };
}

// Protein and carbohydrate provide 4 kcal/g; fat provides 9 kcal/g.
export function calculateMacroNutrients(input: MacroNutrientsInput): MacroNutrientsResult {
  return {
    proteinGrams: input.caloriesKcal.mul(input.proteinPercent).div(100).div(4),
    carbGrams: input.caloriesKcal.mul(input.carbPercent).div(100).div(4),
    fatGrams: input.caloriesKcal.mul(input.fatPercent).div(100).div(9),
  };
}

// Target weight is the selected BMI multiplied by height in metres squared.
export function calculateTargetWeight(input: TargetWeightInput): TargetWeightResult {
  const heightMetres = heightInMetres(input.heightCm);
  return { targetWeightKg: heightMetres.pow(2).mul(input.targetBmi) };
}

// Pace is elapsed time normalized to one kilometre.
export function calculateRunningPace(input: RunningPaceInput): RunningPaceResult {
  positiveDistance(input.distanceKm);
  if (input.seconds.lte(0)) {
    throw new Error('시간은 0보다 커야 합니다.');
  }
  return { secondsPerKm: input.seconds.div(input.distanceKm) };
}

// The calorie rate stays user-entered because physiology and walking conditions vary.
export function calculateWalkingCalories(input: WalkingCaloriesInput): WalkingCaloriesResult {
  positiveDistance(input.distanceKm);
  return { caloriesKcal: input.kcalPerKm.mul(input.distanceKm) };
}

// Convert the weight-based millilitre estimate to litres for display.
export function calculateWaterIntake(input: WaterIntakeInput): WaterIntakeResult {
  return { litres: input.weightKg.mul(input.mlPerKg).div(1000) };
}
