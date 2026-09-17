import { expect, test } from '@playwright/test';

const paths = ['/car/maintenance-cost/', '/car/fuel-cost/', '/car/ev-charging-cost/', '/car/purchase-cost/', '/car/installment/', '/finance/loan-interest/', '/finance/loan-repayment/', '/finance/compound-interest/', '/life/monthly-budget/'];

test('all nine calculators calculate locally without persisting values', async ({ page }) => {
  for (const path of paths) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('button', { name: '계산하기' })).toBeEnabled();
    const requests: string[] = [];
    const record = (request: import('@playwright/test').Request) => {
      if (['fetch', 'xhr'].includes(request.resourceType()) || request.method() === 'POST') requests.push(request.url());
    };
    page.on('request', record);
    await page.getByRole('button', { name: '계산하기' }).click();
    await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toBeVisible();
    await expect(page.locator('.result-panel')).not.toContainText(/NaN|Infinity/);
    await expect(page).toHaveURL(path);
    expect(requests).toEqual([]);
    page.off('request', record);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  }
});

test('fuel cost uses inputs and clears stale results on changes and reset', async ({ page }) => {
  await page.goto('/car/fuel-cost/');
  await page.getByLabel('주행거리').fill('420');
  await page.getByRole('textbox', { name: '연비', exact: true }).fill('14');
  await page.getByLabel('유종 단가').fill('1700');
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.getByText('예상 유류비', { exact: true })).toBeVisible();
  await expect(page.getByText('₩51,000', { exact: true })).toBeVisible();
  await page.getByLabel('주행거리').fill('100');
  await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '계산하기' }).click();
  await page.getByRole('button', { name: '초기화' }).click();
  await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toHaveCount(0);
  await expect(page).toHaveURL('/car/fuel-cost/');
});

test('loan comparison displays all three plans with zero final balances', async ({ page }) => {
  await page.goto('/finance/loan-repayment/');
  await page.getByLabel('대출 원금').fill('12000000');
  await page.getByLabel('연 이자율').fill('6');
  await page.getByLabel('상환 기간').fill('12');
  await page.getByRole('button', { name: '계산하기' }).click();
  for (const name of ['원리금균등', '원금균등', '만기일시']) {
    const table = page.getByRole('table', { name: `${name} 월별 상환 일정`, exact: true });
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr').last().locator('td').last()).toHaveText('₩0');
  }
  await expect(page.locator('.result-panel')).not.toContainText(/NaN|Infinity/);
});

test('installment mode and maintenance powertrain select their own results', async ({ page }) => {
  await page.goto('/car/installment/');
  for (const [value, name] of [['equalPayment', '원리금균등'], ['equalPrincipal', '원금균등'], ['bullet', '만기일시']]) {
    await page.getByLabel('상환 방식').selectOption(value);
    await page.getByRole('button', { name: '계산하기' }).click();
    await expect(page.getByRole('table')).toHaveCount(1);
    await expect(page.getByRole('table', { name: `${name} 월별 상환 일정`, exact: true })).toBeVisible();
  }
  await page.goto('/car/maintenance-cost/');
  await expect(page.getByRole('textbox', { name: '연비', exact: true })).toBeVisible();
  await page.getByLabel('동력원').selectOption('ev');
  await expect(page.getByRole('textbox', { name: '연비', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: '전비', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toBeVisible();
});

test('category and slug mismatch returns 404', async ({ page }) => {
  expect((await page.goto('/life/fuel-cost/'))?.status()).toBe(404);
});

test('page sharing copies only the calculator base URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => {
      (window as Window & { copiedText?: string }).copiedText = text;
    } } });
  });
  await page.goto('/car/fuel-cost/?private=123456');
  await page.getByLabel('주행거리').fill('987654');
  await page.getByRole('button', { name: '페이지 링크 복사' }).click();
  expect(await page.evaluate(() => (window as Window & { copiedText?: string }).copiedText)).toBe('http://127.0.0.1:3000/car/fuel-cost/');
});

test('mobile calculate button is reachable and tables do not overflow the page', async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto('/finance/loan-repayment/');
  const button = page.getByRole('button', { name: '계산하기' });
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeInViewport();
  await button.click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('calculator workspace uses a responsive result-first grid', async ({ page, isMobile }) => {
  await page.goto('/car/fuel-cost/');
  const workspace = page.locator('.calculator-workspace-grid');
  await expect(workspace).toHaveCount(1);
  expect(await workspace.evaluate((element) => getComputedStyle(element).display)).toBe('grid');
  if (isMobile) {
    const form = await page.locator('.calculator-form').boundingBox();
    const result = await page.locator('.result-panel').boundingBox();
    expect(form && result && form.y < result.y).toBe(true);
  }
});

test('keyboard alone reaches the form and completes a calculation', async ({ page }) => {
  await page.goto('/car/fuel-cost/');
  const distance = page.getByLabel('주행거리');
  for (let step = 0; step < 25 && !(await distance.evaluate((element) => element === document.activeElement)); step++) {
    await page.keyboard.press('Tab');
  }
  await expect(distance).toBeFocused();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('420');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: '연비', exact: true })).toBeFocused();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('14');
  await page.keyboard.press('Tab');
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('1700');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '계산하기' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('₩51,000', { exact: true })).toBeVisible();
});
