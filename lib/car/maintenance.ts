import Decimal from 'decimal.js';
import { calculateEvChargingCost } from '@/lib/car/ev';
import { calculateFuelCost } from '@/lib/car/fuel';

interface AnnualCostInput {
  annualDistanceKm: Decimal;
  insuranceWon: Decimal;
  taxWon: Decimal;
  maintenanceWon: Decimal;
  otherWon: Decimal;
}

interface IceMaintenanceInput extends AnnualCostInput {
  powertrain: 'ice';
  efficiencyKmPerLitre: Decimal;
  wonPerLitre: Decimal;
}

interface EvMaintenanceInput extends AnnualCostInput {
  powertrain: 'ev';
  efficiencyKmPerKwh: Decimal;
  wonPerKwh: Decimal;
}

export type MaintenanceInput = IceMaintenanceInput | EvMaintenanceInput;

export interface MaintenanceCostItem {
  key: 'fuel' | 'charging' | 'insurance' | 'tax' | 'maintenance' | 'other';
  label: string;
  amountWon: Decimal;
  ratio: Decimal;
}

export interface MaintenanceResult {
  annualTotalWon: Decimal;
  monthlyAverageWon: Decimal;
  wonPerKm: Decimal;
  items: MaintenanceCostItem[];
}

export function calculateMaintenanceCost(input: MaintenanceInput): MaintenanceResult {
  if (input.annualDistanceKm.lte(0)) {
    throw new Error('연간 주행거리는 0보다 커야 합니다.');
  }

  const energy =
    input.powertrain === 'ice'
      ? {
          key: 'fuel' as const,
          label: '연료비',
          amountWon: calculateFuelCost({
            distanceKm: input.annualDistanceKm,
            efficiencyKmPerLitre: input.efficiencyKmPerLitre,
            wonPerLitre: input.wonPerLitre,
          }).totalWon,
        }
      : {
          key: 'charging' as const,
          label: '충전비',
          amountWon: calculateEvChargingCost({
            distanceKm: input.annualDistanceKm,
            efficiencyKmPerKwh: input.efficiencyKmPerKwh,
            wonPerKwh: input.wonPerKwh,
          }).totalWon,
        };

  const amounts = [
    energy,
    { key: 'insurance' as const, label: '보험료', amountWon: input.insuranceWon },
    { key: 'tax' as const, label: '자동차세', amountWon: input.taxWon },
    { key: 'maintenance' as const, label: '정비·소모품비', amountWon: input.maintenanceWon },
    { key: 'other' as const, label: '기타 비용', amountWon: input.otherWon },
  ];
  const annualTotalWon = amounts.reduce(
    (total, item) => total.add(item.amountWon),
    new Decimal(0),
  );

  if (annualTotalWon.lte(0)) {
    throw new Error('연간 총 유지비는 0보다 커야 합니다.');
  }

  return {
    annualTotalWon,
    monthlyAverageWon: annualTotalWon.div(12),
    wonPerKm: annualTotalWon.div(input.annualDistanceKm),
    items: amounts.map((item) => ({
      ...item,
      ratio: item.amountWon.div(annualTotalWon),
    })),
  };
}
