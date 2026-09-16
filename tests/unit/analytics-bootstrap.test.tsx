import { renderToStaticMarkup } from 'react-dom/server';
import { runInNewContext } from 'node:vm';
import { afterEach, expect, it, vi } from 'vitest';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { getGaMeasurementId } from '@/lib/analytics/config';
import { trackCalculatorEvent } from '@/lib/analytics/events';
import RootLayout from '@/app/layout';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it.each([
  ['?utm_source=naver&utm_medium=cpc&utm_campaign=autumn-2026&utm_content=card_a&income=987654321&email=private@example.com', { campaign_source: 'naver', campaign_medium: 'cpc', campaign_name: 'autumn-2026', campaign_content: 'card_a' }],
  ['?utm_source=private%40example.com&utm_medium=123456789&utm_campaign=' + 'x'.repeat(65) + '&utm_content=hello%20world&income=987654321', {}],
  ['?utm_source=naver&utm_source=private&utm_medium=cpc&gclid=secret', { campaign_medium: 'cpc' }],
] as const)('accepts only safe, unambiguous campaign codes from %s', (search, expected) => {
  const html = renderToStaticMarkup(<GoogleAnalytics measurementId="G-TEST123456" siteOrigin="https://calc.bongworks.co.kr" />);
  const script = html.match(/<script id="ga-bootstrap">([\s\S]*?)<\/script>/)?.[1];
  const win = { location: { pathname: '/car/fuel-cost/', search }, dataLayer: [] as unknown[] };
  runInNewContext(script!, { window: win, document: { referrer: '' }, URL, URLSearchParams, Date });
  const config = win.dataLayer.map((entry) => Array.from(entry as ArrayLike<unknown>)).find(([command]) => command === 'config')?.[2] as Record<string, unknown>;
  expect(Object.fromEntries(Object.entries(config).filter(([key]) => key.startsWith('campaign_')))).toEqual(expected);
  expect(config.page_location).toBe('https://calc.bongworks.co.kr/car/fuel-cost/');
  expect(JSON.stringify(config)).not.toMatch(/987654321|income|email|private|secret|123456789|hello/);
});

it('the layout injects exactly one bootstrap only in configured production', () => {
  for (const [environment, id, count] of [['development', 'G-TEST123456', 0], ['production', '', 0], ['production', 'G-<script>', 0], ['production', 'G-TEST123456', 1]] as const) {
    vi.stubEnv('NODE_ENV', environment);
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', id);
    const html = renderToStaticMarkup(<RootLayout><p>Test page</p></RootLayout>);
    expect(html.match(/id="ga-bootstrap"/g) ?? []).toHaveLength(count);
    if (!count) expect(html).not.toContain('googletagmanager.com');
  }
});

it('requires production and a sane GA ID', () => {
  for (const env of ['development', 'test'] as const) expect(getGaMeasurementId(env, 'G-TEST123456')).toBeUndefined();
  for (const id of ['', 'invalid', 'G-<script>', 'G-TEST?private=1']) expect(getGaMeasurementId('production', id)).toBeUndefined();
  expect(getGaMeasurementId('production', 'G-TEST123456')).toBe('G-TEST123456');
});

it('queues initial tracker events before GA loads with query-free automatic page configuration', () => {
  const html = renderToStaticMarkup(<GoogleAnalytics measurementId="G-TEST123456" siteOrigin="https://calc.bongworks.co.kr" />);
  const script = html.match(/<script id="ga-bootstrap">([\s\S]*?)<\/script>/)?.[1];
  expect(script).toBeTruthy();
  const win = { location: { pathname: '/car/fuel-cost/', search: '?income=987654321&income=private', hash: '#secret' }, dataLayer: [] as unknown[], gtag: undefined };
  const context = { window: win, document: { referrer: 'https://search.example/?q=987654321', title: '유류비·연비 계산기' }, URL, URLSearchParams, Date };
  runInNewContext(script!, context);
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-TEST123456');
  vi.stubGlobal('window', win);
  trackCalculatorEvent('calculator_view', 'fuel-cost');
  const calls = win.dataLayer.map((entry) => Array.from(entry as ArrayLike<unknown>));
  expect(calls.filter(([command]) => command === 'config')).toHaveLength(1);
  expect(calls.find(([command]) => command === 'config')?.[2]).toMatchObject({ send_page_view: true, page_location: 'https://calc.bongworks.co.kr/car/fuel-cost/', page_path: '/car/fuel-cost/', page_referrer: 'https://search.example/' });
  expect(calls.at(-1)).toEqual(['event', 'calculator_view', { calculator_type: 'car', calculator_name: '유류비·연비 계산기', page_path: '/car/fuel-cost/' }]);
  expect(JSON.stringify(calls)).not.toMatch(/987654321|income|private|secret/);
  runInNewContext(script!, context);
  expect(win.dataLayer).toHaveLength(calls.length);
});
