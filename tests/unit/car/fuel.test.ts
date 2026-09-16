import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateFuelCost } from '@/lib/car/fuel';

describe('calculateFuelCost', () => {
  it('calculates fuel litres, total cost, and cost per km without float drift', () => {
    const result = calculateFuelCost({
      distanceKm: new Decimal('420'),
      efficiencyKmPerLitre: new Decimal('14'),
      wonPerLitre: new Decimal('1700'),
    });

    expect(result.litres.toString()).toBe('30');
    expect(result.totalWon.toString()).toBe('51000');
    expect(result.wonPerKm.toString()).toBe('121.42857142857142857143');
  });

  it('rejects zero efficiency instead of dividing by zero', () => {
    expect(() =>
      calculateFuelCost({
        distanceKm: new Decimal('420'),
        efficiencyKmPerLitre: new Decimal('0'),
        wonPerLitre: new Decimal('1700'),
      }),
    ).toThrow('연비는 0보다 커야 합니다.');
  });
});
