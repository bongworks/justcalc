import { expect, test } from '@playwright/test';

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

  await expect(page.locator('.home-calculator-card')).toHaveCount(9);
  await expect(page.locator('.category-card')).toHaveCount(8);
  await expect(page.locator('.category-card').filter({ has: page.getByRole('heading', { name: '자동차 계산기' }) }).locator('.home-calculator-card')).toHaveCount(5);
  await expect(page.locator('.category-card').filter({ has: page.getByRole('heading', { name: '금융 계산기' }) }).locator('.home-calculator-card')).toHaveCount(3);
  await expect(page.locator('.category-card').filter({ has: page.getByRole('heading', { name: '생활·날짜 계산기' }) }).locator('.home-calculator-card')).toHaveCount(1);
});

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
