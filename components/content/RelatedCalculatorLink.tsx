'use client';

import type { ReactNode } from 'react';
import { trackCalculatorEvent } from '@/lib/analytics/events';

export function RelatedCalculatorLink({ slug, href, children }: { slug: string; href: string; children: ReactNode }) {
  return <a href={href} onClick={() => trackCalculatorEvent('related_calculator_click', slug)}>{children}</a>;
}
