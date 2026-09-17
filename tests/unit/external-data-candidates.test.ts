import { expect, test } from 'vitest';
import { externalDataCandidates } from '@/content/external-data-candidates';

test('records the deferred external-data candidates for manual review', () => {
  expect(externalDataCandidates.map(({ id }) => id)).toEqual([
    'exchange-rate',
    'fuel-price',
    'ev-charging-rate',
    'electricity-tariff',
    'holiday-calendar',
    'time-zone',
  ]);
  expect(externalDataCandidates.every(({ reviewStatus }) => reviewStatus === 'not-reviewed')).toBe(true);
});
