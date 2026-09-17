'use client';

import { useEffect } from 'react';
import type { AdSenseConfig } from '@/lib/adsense/config';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** A failed or unfilled ad must never interrupt a local calculation. */
export function AdSlot({ config }: { config?: AdSenseConfig }) {
  useEffect(() => {
    if (!config) return;
    try {
      window.adsbygoogle ??= [];
      window.adsbygoogle.push({});
    } catch {
      // Third-party fill errors are intentionally isolated from calculator use.
    }
  }, [config]);

  if (!config) return null;

  return <aside className="ad-slot" aria-label="광고"><p>광고</p><ins className="adsbygoogle" data-ad-client={config.clientId} data-ad-slot={config.resultSlotId} data-ad-format="auto" data-full-width-responsive="true" /></aside>;
}
