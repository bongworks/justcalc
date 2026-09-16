import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateEvChargingCost } from '@/lib/car/ev';

describe('calculateEvChargingCost', () => {
  it('calculates electricity usage, total cost, and cost per km without float drift', () => {
    const result = calculateEvChargingCost({
      distanceKm: new Decimal('240'),
      efficiencyKmPerKwh: new Decimal('6'),
      wonPerKwh: new Decimal('300'),
    });

    expect(result.kwh.toString()).toBe('40');
    expect(result.totalWon.toString()).toBe('12000');
    expect(result.wonPerKm.toString()).toBe('50');
  });

  it('rejects zero efficiency instead of dividing by zero', () => {
    expect(() =>
      calculateEvChargingCost({
        distanceKm: new Decimal('240'),
        efficiencyKmPerKwh: new Decimal('0'),
        wonPerKwh: new Decimal('300'),
      }),
    ).toThrow('전비는 0보다 커야 합니다.');
  });
});
