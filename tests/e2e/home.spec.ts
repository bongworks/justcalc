import { expect, test } from '@playwright/test';

test('홈에서 바로계산기와 자동차 계산기 진입점을 보여준다', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/바로계산기/);
  await expect(
    page.getByRole('heading', { level: 1, name: /차를 사고 유지하고/ }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /자동차 유지비 계산기/ })).toBeVisible();
  await expect(page.getByRole('link', { name: '자동차', exact: true })).toHaveAttribute('href', '#car');
  await expect(page.getByRole('link', { name: '금융', exact: true })).toHaveAttribute('href', '#finance');
  await expect(page.getByRole('link', { name: '생활비', exact: true })).toHaveAttribute('href', '#life');
});
