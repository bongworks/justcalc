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

test('policy pages and footer provide public service, privacy and inquiry information', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('개인정보 처리방침');
  await expect(page.getByText(/계산 입력값과 결과는.*전송하거나 저장하지 않습니다/)).toBeVisible();
  await expect(page.getByText(/페이지 제목.*유입 출처.*캠페인 코드/)).toBeVisible();
  await expect(page.getByText(/문의 메일로 제공한 정보는 문의 확인과 답변을 위해서만 사용합니다/)).toBeVisible();
  for (const path of policyRoutes) {
    await expect(page.locator(`footer a[href="${path}"]`)).toBeVisible();
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', origin + path);
  }
  await page.goto('/contact/');
  await expect(page.getByRole('link', { name: 'service.bongworks@gmail.com' })).toHaveAttribute('href', 'mailto:service.bongworks@gmail.com');
  await expect(page.getByText(/기능 제안, 오류 제보, 서비스 이용 문의/)).toBeVisible();
  await expect(page.locator('body')).not.toContainText('공개 출시와 AdSense 신청은 보류');
  await expect(page.locator('body')).not.toContainText('NEXT_PUBLIC_');
});

test('policy pages do not expose development or release instructions', async ({ page }) => {
  const internalCopy = ['공개 운영 준비 중', '공개 출시와 AdSense 신청은 보류', 'NEXT_PUBLIC_', '프로덕션 정책 페이지를 배포하지 않습니다'];

  for (const path of policyRoutes) {
    await page.goto(path);
    const body = page.locator('body');
    for (const copy of internalCopy) await expect(body).not.toContainText(copy);
  }
});

test('policy pages fit mobile screens and keep a short page footer at the viewport bottom', async ({ page, isMobile }) => {
  if (isMobile) {
    await page.goto('/privacy/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    return;
  }

  await page.setViewportSize({ width: 1280, height: 1080 });
  await page.goto('/about/');
  const footer = await page.locator('footer').boundingBox();
  expect(footer).not.toBeNull();
  expect(footer!.y + footer!.height).toBeGreaterThanOrEqual(1080);
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(1081);
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
