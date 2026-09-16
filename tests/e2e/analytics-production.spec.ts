import { expect, test } from '@playwright/test';

test.skip(process.env.E2E_GA_PRODUCTION !== '1', 'Requires a production build with the synthetic GA fixture ID.');

test('configured production queues one view before asynchronous GA loading without query values', async ({ page, request }) => {
  const html = await (await request.get('/car/fuel-cost/?income=987654321&income=private')).text();
  expect(html.match(/<script id="ga-bootstrap">/g)).toHaveLength(1);
  expect(html.indexOf('<script id="ga-bootstrap">')).toBeLessThan(html.indexOf('<body'));
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: '/* analytics transport intentionally stubbed */' }));
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
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: '/* analytics transport intentionally stubbed */' }));
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
