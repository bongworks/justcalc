import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateMaintenanceCost } from '@/lib/car/maintenance';

const sharedAnnualCosts = {
  insuranceWon: new Decimal('600000'),
  taxWon: new Decimal('300000'),
  maintenanceWon: new Decimal('500000'),
  otherWon: new Decimal('400000'),
};

describe('calculateMaintenanceCost', () => {
  it('sums ICE costs and derives exact monthly and per-km totals', () => {
    const result = calculateMaintenanceCost({
      powertrain: 'ice',
      annualDistanceKm: new Decimal('12000'),
      efficiencyKmPerLitre: new Decimal('12'),
      wonPerLitre: new Decimal('1800'),
      ...sharedAnnualCosts,
    });

    expect(result.annualTotalWon.toString()).toBe('3600000');
    expect(result.monthlyAverageWon.toString()).toBe('300000');
    expect(result.wonPerKm.toString()).toBe('300');
    expect(result.items.map(({ key }) => key)).toEqual([
      'fuel',
      'insurance',
      'tax',
      'maintenance',
      'other',
    ]);
    expect(
      result.items.reduce((sum, item) => sum.add(item.ratio), new Decimal(0)).toString(),
    ).toBe('1');
  });

  it('switches the energy row to charging for an EV without retaining a fuel row', () => {
    const result = calculateMaintenanceCost({
      powertrain: 'ev',
      annualDistanceKm: new Decimal('12000'),
      efficiencyKmPerKwh: new Decimal('6'),
      wonPerKwh: new Decimal('300'),
      ...sharedAnnualCosts,
    });

    expect(result.annualTotalWon.toString()).toBe('2400000');
    expect(result.items.map(({ key }) => key)).toEqual([
      'charging',
      'insurance',
      'tax',
      'maintenance',
      'other',
    ]);
  });

  it('reports zero annual distance instead of deriving a per-km value', () => {
    expect(() =>
      calculateMaintenanceCost({
        powertrain: 'ice',
        annualDistanceKm: new Decimal('0'),
        efficiencyKmPerLitre: new Decimal('12'),
        wonPerLitre: new Decimal('1800'),
        ...sharedAnnualCosts,
      }),
    ).toThrow('연간 주행거리는 0보다 커야 합니다.');
  });
});
