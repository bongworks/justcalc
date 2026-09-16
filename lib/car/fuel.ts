import Decimal from 'decimal.js';

const FuelDecimal = Decimal.clone({ precision: 23 });

export interface FuelCostInput {
  distanceKm: Decimal;
  efficiencyKmPerLitre: Decimal;
  wonPerLitre: Decimal;
}

export interface FuelCostResult {
  litres: Decimal;
  totalWon: Decimal;
  wonPerKm: Decimal;
}

export function calculateFuelCost(input: FuelCostInput): FuelCostResult {
  if (input.efficiencyKmPerLitre.lte(0)) {
    throw new Error('연비는 0보다 커야 합니다.');
  }

  const distanceKm = new FuelDecimal(input.distanceKm);
  const efficiencyKmPerLitre = new FuelDecimal(input.efficiencyKmPerLitre);
  const wonPerLitre = new FuelDecimal(input.wonPerLitre);
  const litres = distanceKm.div(efficiencyKmPerLitre);
  const totalWon = litres.mul(wonPerLitre);

  return {
    litres,
    totalWon,
    wonPerKm: wonPerLitre.div(efficiencyKmPerLitre),
  };
}
