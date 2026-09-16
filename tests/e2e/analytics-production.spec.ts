import { expect, test } from '@playwright/test';

test.skip(process.env.E2E_GA_PRODUCTION !== '1', 'Requires a production build with the synthetic GA fixture ID.');

test.beforeEach(async ({ page, request }) => {
  const html = await (await request.get('/car/fuel-cost/')).text();
  expect(html).toContain('G-TEST123456');
  expect([...new Set(html.match(/G-[A-Z0-9]{6,}/g))]).toEqual(['G-TEST123456']);
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:3100') return route.continue();
    if (url.origin === 'https://www.googletagmanager.com' && url.pathname === '/gtag/js' && url.searchParams.get('id') === 'G-TEST123456') {
      return route.fulfill({ contentType: 'application/javascript', body: '/* synthetic analytics transport intentionally stubbed */' });
    }
    return route.abort();
  });
});

test('configured production queues one view before asynchronous GA loading without query values', async ({ page, request }) => {
  const html = await (await request.get('/car/fuel-cost/?income=987654321&income=private')).text();
  expect(html.match(/<script id="ga-bootstrap">/g)).toHaveLength(1);
  expect(html.indexOf('<script id="ga-bootstrap">')).toBeLessThan(html.indexOf('<body'));
  await page.goto('/car/fuel-cost/?income=987654321&income=private#secret');
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(1);
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveAttribute('data-nscript', 'afterInteractive');
  const commands = await page.evaluate(() => ((window as Window & { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).map((entry) => Array.from(entry)));
  expect(commands.filter(([type]) => type === 'config')).toHaveLength(1);
  expect(commands.filter(([type, event]) => type === 'event' && event === 'calculator_view')).toHaveLength(1);
  expect(JSON.stringify(commands)).not.toMatch(/987654321|income|private|secret/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://calc.bongworks.co.kr/car/fuel-cost/');
});

test('header home navigation creates one fresh query-free homepage view', async ({ page }) => {
  await page.goto('/car/fuel-cost/?income=987654321&income=private#secret');
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(1);
  await page.locator('input').first().fill('987654');
  await page.getByRole('banner').getByRole('link', { name: '바로계산기' }).click();
  await expect(page).toHaveURL('http://127.0.0.1:3100/');
  await expect.poll(async () => page.evaluate(() => ((window as Window & { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? [])
    .map((entry) => Array.from(entry))
    .filter(([type]) => type === 'config')
    .map(([, , params]) => (params as { page_path?: string }).page_path))).toEqual(['/']);
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(1);
  const commands = await page.evaluate(() => ((window as Window & { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).map((entry) => Array.from(entry)));
  expect(commands.filter(([type]) => type === 'config')).toEqual([['config', 'G-TEST123456', expect.objectContaining({ send_page_view: true, page_path: '/', page_location: 'https://calc.bongworks.co.kr/' })]]);
  expect(commands.filter(([type]) => type === 'event')).toHaveLength(0);
  expect(JSON.stringify(commands)).not.toMatch(/987654|income|private|secret|fuel-cost/);
});

test('approved UTM fields provide campaign attribution without forwarding other query data', async ({ page }) => {
  await page.goto('/car/fuel-cost/?utm_source=naver&utm_medium=cpc&utm_campaign=autumn-2026&utm_content=card_a&income=987654321&email=private@example.com&gclid=secret#hidden');
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(1);
  const commands = await page.evaluate(() => ((window as Window & { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).map((entry) => Array.from(entry)));
  const config = commands.find(([type]) => type === 'config')?.[2];
  expect(config).toMatchObject({ campaign_source: 'naver', campaign_medium: 'cpc', campaign_name: 'autumn-2026', campaign_content: 'card_a', page_location: 'https://calc.bongworks.co.kr/car/fuel-cost/' });
  expect(JSON.stringify(commands)).not.toMatch(/987654321|income|email|private|secret|hidden|utm_/);
  await page.goto('/car/fuel-cost/?utm_source=private%40example.com&utm_medium=123456789&utm_campaign=' + 'x'.repeat(65) + '&utm_content=hello%20world');
  const invalidConfig = await page.evaluate(() => ((window as Window & { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).map((entry) => Array.from(entry)).find(([type]) => type === 'config')?.[2] as Record<string, unknown>);
  expect(Object.keys(invalidConfig).filter((key) => key.startsWith('campaign_'))).toEqual([]);
});

test('calculation and sharing events contain only approved metadata and no input or result values', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
  });
  await page.goto('/car/fuel-cost/?income=987654321#private-fragment');
  await page.getByLabel('주행거리').fill('420');
  await page.getByRole('textbox', { name: '연비', exact: true }).fill('14');
  await page.getByLabel('유종 단가').fill('1700');
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.getByText('₩51,000', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '결과 복사', exact: true }).click();
  await page.getByRole('button', { name: '페이지 링크 복사' }).click();
  await page.getByRole('button', { name: '초기화' }).click();
  const commands = await page.evaluate(() => ((window as Window & { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? []).map((entry) => Array.from(entry)));
  const events = commands.filter(([type]) => type === 'event');
  expect(events.map(([, event]) => event)).toEqual(['calculator_view', 'calculator_start', 'calculator_submit', 'calculator_result', 'share', 'share', 'calculator_reset']);
  for (const [, , params] of events) {
    expect(Object.keys(params as object).every((key) => ['calculator_type', 'calculator_name', 'page_path', 'source', 'result_type'].includes(key))).toBe(true);
  }
  expect(JSON.stringify(commands)).not.toMatch(/987654321|income|private-fragment|420|1700|51000|51,000/);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});
