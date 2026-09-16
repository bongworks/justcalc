import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackCalculatorEvent } from '@/lib/analytics/events';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('calculator analytics privacy boundary', () => {
  it('only passes registered metadata and allowlisted event parameters', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST');
    const calls: unknown[][] = [];
    vi.stubGlobal('window', { gtag: (...args: unknown[]) => calls.push(args) });
    const untrusted = { source: 'copy_link', result_type: 'success', principal: '987654321', page_path: '/?income=987654321', calculator_name: 'private text' };
    trackCalculatorEvent('share', 'fuel-cost', untrusted as never);
    expect(calls).toEqual([['event', 'share', { calculator_type: 'car', calculator_name: '유류비·연비 계산기', page_path: '/car/fuel-cost/', source: 'copy_link' }]]);
    trackCalculatorEvent('calculator_result', 'fuel-cost', { result_type: '987654321' } as never);
    expect(JSON.stringify(calls)).not.toContain('987654321');
  });

  it('emits nothing outside configured production or for unknown calculators', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST');
    trackCalculatorEvent('calculator_view', 'fuel-cost');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '');
    trackCalculatorEvent('calculator_view', 'fuel-cost');
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST');
    trackCalculatorEvent('calculator_view', 'private input');
    expect(gtag).not.toHaveBeenCalled();
  });

  it('does not let an unavailable analytics transport interrupt calculations', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST');
    vi.stubGlobal('window', { gtag: () => { throw new Error('analytics blocked'); } });
    expect(() => trackCalculatorEvent('calculator_submit', 'fuel-cost')).not.toThrow();
  });
});
