import { expect, test } from '@playwright/test';
import { calculators } from '../../content/calculators';
import { calculatorCategories } from '../../lib/calculators/categories';

const origin = 'https://calc.bongworks.co.kr';
const policyRoutes = ['/about/', '/editorial-policy/', '/contact/', '/privacy/', '/terms/'];

for (const calculator of calculators) {
  test(`${calculator.slug} has static canonical, social metadata and structured data`, async ({ page }) => {
    await page.goto(`${calculator.route}?income=987654321&income=private`);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', origin + calculator.route);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', origin + calculator.route);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', origin + '/og-default.png');
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', origin + '/og-default.png');
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', calculator.title);
    await expect(page.getByText('마지막 검토일:')).toBeVisible();
    const json = (await page.locator('script[type="application/ld+json"]').allTextContents()).join('');
    expect(json).toContain('WebPage');
    expect(json).toContain('BreadcrumbList');
    expect(json).toContain(calculator.title);
    expect(json).not.toMatch(/987654321|income=|private/);
  });
}

test('robots and sitemap include every registered public URL', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  const sitemap = await request.get('/sitemap.xml');
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  expect(urls.sort()).toEqual(
    [
      '/',
      ...policyRoutes,
      ...calculatorCategories.map((entry) => entry.route),
      ...calculators.map((entry) => entry.route),
    ].map((path) => origin + path).sort(),
  );
});

test('policy pages and footer explain local calculations, analytics and the launch gate', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('개인정보 처리방침');
  await expect(page.getByText(/계산 입력값과 결과는.*전송하거나 저장하지 않습니다/)).toBeVisible();
  await expect(page.getByText(/GA4.*기기.*쿠키/)).toBeVisible();
  await expect(page.getByText(/자동광고 스크립트는.*NEXT_PUBLIC_ADSENSE_CLIENT_ID.*프로덕션 빌드/)).toBeVisible();
  for (const path of policyRoutes) {
    await expect(page.locator(`footer a[href="${path}"]`)).toBeVisible();
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', origin + path);
  }
  await page.goto('/contact/');
  await expect(page.getByText(/공개 출시와 AdSense 신청은 보류/)).toBeVisible();
});

test('static release without public IDs never loads analytics or automatic ads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', origin + '/');
  const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(schemas.map((json) => JSON.parse(json)['@type']).sort()).toEqual(['WebPage', 'WebSite']);
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(0);
  await expect(page.locator('#ga-bootstrap')).toHaveCount(0);
  await expect(page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')).toHaveCount(0);
});
