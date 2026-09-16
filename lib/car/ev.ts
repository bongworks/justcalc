import Decimal from 'decimal.js';

export interface EvChargingInput {
  distanceKm: Decimal;
  efficiencyKmPerKwh: Decimal;
  wonPerKwh: Decimal;
}

export interface EvChargingResult {
  kwh: Decimal;
  totalWon: Decimal;
  wonPerKm: Decimal;
}

export function calculateEvChargingCost(input: EvChargingInput): EvChargingResult {
  if (input.efficiencyKmPerKwh.lte(0)) {
    throw new Error('전비는 0보다 커야 합니다.');
  }

  const kwh = input.distanceKm.div(input.efficiencyKmPerKwh);
  const totalWon = kwh.mul(input.wonPerKwh);

  return {
    kwh,
    totalWon,
    wonPerKm: input.wonPerKwh.div(input.efficiencyKmPerKwh),
  };
}
