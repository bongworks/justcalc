import { expect, it } from 'vitest';
import { getAdSenseConfig } from '@/lib/adsense/config';

it('enables automatic ads only for production with a valid public publisher ID', () => {
  expect(getAdSenseConfig('production', 'ca-pub-1234567890123456')).toEqual({
    clientId: 'ca-pub-1234567890123456',
  });
});

it('keeps automatic ads disabled outside production or with a malformed publisher ID', () => {
  expect(getAdSenseConfig('development', 'ca-pub-1234567890123456')).toBeUndefined();
  expect(getAdSenseConfig('production', 'publisher')).toBeUndefined();
});
