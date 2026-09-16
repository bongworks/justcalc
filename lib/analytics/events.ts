'use client';

import { calculators } from '@/content/calculators';
import { getGaMeasurementId } from '@/lib/analytics/config';

export type CalculatorEvent = 'calculator_view' | 'calculator_start' | 'calculator_submit' | 'calculator_result' | 'calculator_reset' | 'related_calculator_click' | 'share';
export interface CalculatorEventOptions {
  source?: 'copy_result' | 'copy_link' | 'related';
  result_type?: 'success' | 'error';
}

/** Only catalog metadata crosses this boundary; never spread caller data into GA. */
export function trackCalculatorEvent(event: CalculatorEvent, slug: string, options: CalculatorEventOptions = {}) {
  if (typeof window === 'undefined' || !getGaMeasurementId()) return;
  const calculator = calculators.find((entry) => entry.slug === slug);
  if (!calculator || !['calculator_view', 'calculator_start', 'calculator_submit', 'calculator_result', 'calculator_reset', 'related_calculator_click', 'share'].includes(event)) return;
  const params: Record<string, string> = { calculator_type: calculator.category, calculator_name: calculator.title, page_path: calculator.route };
  if (event === 'share' && (options.source === 'copy_result' || options.source === 'copy_link')) params.source = options.source;
  if (event === 'related_calculator_click') params.source = 'related';
  if (event === 'calculator_result' && (options.result_type === 'success' || options.result_type === 'error')) params.result_type = options.result_type;
  const analyticsWindow = window as Window & { gtag?: (command: 'event', name: CalculatorEvent, params: Record<string, string>) => void };
  try {
    analyticsWindow.gtag?.('event', event, params);
  } catch {
    // Analytics availability must not affect the local calculator.
  }
}
