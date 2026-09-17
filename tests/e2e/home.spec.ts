import { expect, test } from '@playwright/test';
import { calculatorCategories } from '@/lib/calculators/categories';
import { calculatorCatalog } from '@/lib/calculators/registry';

test('홈에서 바로계산기와 자동차 계산기 진입점을 보여준다', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/바로계산기/);
  await expect(
    page.getByRole('heading', { level: 1, name: /차를 사고 유지하고/ }),
  ).toBeVisible();
  await expect(page.getByRole('searchbox', { name: '계산기 검색' })).toBeVisible();
  await expect(page.getByRole('link', { name: /자동차 유지비 계산기/ })).toBeVisible();
  await expect(page.getByRole('link', { name: '자동차', exact: true })).toHaveAttribute('href', '/car/');
  await expect(page.getByRole('link', { name: '금융', exact: true })).toHaveAttribute('href', '/finance/');
  await expect(page.getByRole('link', { name: '생활·날짜', exact: true })).toHaveAttribute('href', '/life/');
  await expect(page.getByRole('link', { name: '교육·단위', exact: true })).toHaveAttribute('href', '/education/');
});

test('home groups every calculator into visible category cards', async ({ page }) => {
  await page.goto('/');

  expect(calculatorCatalog).toHaveLength(78);
  expect(calculatorCategories).toHaveLength(8);
  await expect(page.locator('.home-calculator-card')).toHaveCount(calculatorCatalog.length);
  await expect(page.locator('.category-card')).toHaveCount(calculatorCategories.length);

  for (const category of calculatorCategories) {
    const expectedCount = calculatorCatalog.filter(
      (calculator) => calculator.category === category.slug,
    ).length;
    const categoryCard = page.locator('.category-card').filter({
      has: page.getByRole('heading', { name: `${category.label} 계산기`, exact: true }),
    });

    await expect(categoryCard.locator('.home-calculator-card')).toHaveCount(expectedCount);
  }
});

for (const category of calculatorCategories) {
  test(`${category.slug} hub contains its registered calculators and mobile touch targets`, async ({ page, isMobile }) => {
    const expectedCount = calculatorCatalog.filter(
      (calculator) => calculator.category === category.slug,
    ).length;
    expect(expectedCount).toBeGreaterThan(0);
    expect((await page.goto(category.route))?.status()).toBe(200);
    const links = page.getByRole('navigation', {
      name: `${category.label} 계산기 목록`,
    }).getByRole('link');
    await expect(links).toHaveCount(expectedCount);

    for (const link of isMobile ? await links.all() : []) {
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });
}

test('home search filters locally without requests, URL state, or storage', async ({ page }) => {
  await page.goto('/');
  const requests: string[] = [];
  const record = (request: import('@playwright/test').Request) => requests.push(request.url());
  page.on('request', record);

  const search = page.getByRole('searchbox', { name: '계산기 검색' });
  for (let step = 0; step < 10 && !(await search.evaluate((element) => element === document.activeElement)); step++) {
    await page.keyboard.press('Tab');
  }
  await expect(search).toBeFocused();
  await page.keyboard.type('유류');

  await expect(page.getByRole('link', { name: /유류비·연비 계산기/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /월 생활비 예산 계산기/ })).toHaveCount(0);
  await expect(page).toHaveURL('/');
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  page.off('request', record);
});

test('home directory has no horizontal overflow at 375px', async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto('/');
  expect(await page.evaluate(() => ({ width: window.innerWidth, fits: document.documentElement.scrollWidth <= window.innerWidth }))).toEqual({ width: 375, fits: true });
});
