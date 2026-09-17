import { expect, test } from '@playwright/test';

for (const scenario of [
  { route: '/health/macro-nutrients/', label: '지방 비율', select: false, invalid: '10', valid: '20', reason: '세 비율의 합계는 100%여야 합니다.' },
  { route: '/education/unit-conversion/', label: '변환 단위', select: true, invalid: 'kg', valid: 'm', reason: '같은 종류의 단위끼리만 변환할 수 있습니다.' },
]) {
  test(`${scenario.route} explains local evaluation failures accessibly`, async ({ page }) => {
    await page.goto(scenario.route);
    const input = page.getByRole(scenario.select ? 'combobox' : 'textbox', { name: scenario.label });
    await expect(input).toBeEnabled();
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    if (scenario.select) await input.selectOption(scenario.invalid);
    else await input.fill(scenario.invalid);
    await page.getByRole('button', { name: '계산하기' }).click();
    const group = page.getByRole('group', { name: '계산값 입력' });
    const alert = group.getByRole('alert');
    await expect(alert).toHaveText(scenario.reason);
    await expect(alert).toBeFocused();
    await expect(group).toHaveAccessibleDescription(scenario.reason);
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    if (scenario.select) await input.selectOption(scenario.valid);
    else await input.fill(scenario.valid);
    await expect(alert).toHaveCount(0);
    await expect(group).not.toHaveAttribute('aria-invalid');
    await page.getByRole('button', { name: '계산하기' }).click();
    await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toBeVisible();
    await expect(page).toHaveURL(scenario.route);
    expect(requests).toEqual([]);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  });
}
