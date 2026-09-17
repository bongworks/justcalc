import { expect, it } from 'vitest';
import { getAdSenseConfig } from '@/lib/adsense/config';

it('enables the manual result slot only for production with valid public IDs', () => {
  expect(getAdSenseConfig('production', 'ca-pub-1234567890123456', '1234567890')).toEqual({
    clientId: 'ca-pub-1234567890123456',
    resultSlotId: '1234567890',
  });
});

it('keeps ads disabled outside production or with malformed identifiers', () => {
  expect(getAdSenseConfig('development', 'ca-pub-1234567890123456', '1234567890')).toBeUndefined();
  expect(getAdSenseConfig('production', 'publisher', '1234567890')).toBeUndefined();
  expect(getAdSenseConfig('production', 'ca-pub-1234567890123456', 'slot-name')).toBeUndefined();
});
