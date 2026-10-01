import { expect, test } from '@playwright/test';
import { decisionGuides } from '../../content/decision-guides';

test('a guide leads to calculation and back to result interpretation', async ({ page }) => {
  await page.goto('/');
  await page.locator('.guide-card[href="/guides/car-cost-budget/"]').click();
  await expect(page).toHaveURL('/guides/car-cost-budget/');
  await expect(page.getByRole('navigation', { name: '이 가이드의 목차' })).toBeVisible();
  await page.getByRole('navigation', { name: '관련 계산기' }).getByRole('link', { name: '자동차 유지비 계산기' }).click();
  await expect(page).toHaveURL('/car/maintenance-cost/');
  await expect(page.getByRole('heading', { name: '입력 전에 준비할 것' })).toBeVisible();
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '결과를 읽는 방법' })).toBeVisible();
  await page.locator('.guide-card[href="/guides/car-cost-budget/"]').click();
  await expect(page).toHaveURL('/guides/car-cost-budget/');
});

test('all guides render their content, canonical and usable links without JavaScript', async ({ browser, baseURL, isMobile }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: isMobile ? { width: 375, height: 812 } : { width: 1280, height: 720 } });
  const page = await context.newPage();
  await page.goto('/guides/');
  await expect(page.locator('.guide-card')).toHaveCount(decisionGuides.length);
  for (const guide of decisionGuides) {
    expect((await page.goto(guide.route))?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(guide.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://calc.bongworks.co.kr' + guide.route);
    await expect(page.getByRole('heading', { name: '내 조건으로 계산할 때' })).toBeVisible();
    await expect(page.locator('table')).not.toHaveCount(0);
    for (const link of await page.getByRole('navigation', { name: '이 가이드의 목차' }).getByRole('link').all()) {
      const href = await link.getAttribute('href');
      expect(await page.locator(href!).count()).toBe(1);
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const json = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((item) => JSON.parse(item));
    expect(json.some((item) => item['@type'] === 'WebPage' && item.url.endsWith(guide.route))).toBe(true);
  }
  await context.close();
});
