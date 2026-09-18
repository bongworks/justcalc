import { expect, test } from '@playwright/test';
import { calculatorDefinitions } from '@/lib/calculators/definitions';

test('BMI uses entered body measurements with a medical limitation', async ({ page }) => {
  await page.goto('/health/bmi/');
  await page.getByRole('textbox', { name: '체중', exact: true }).fill('70');
  await page.getByRole('textbox', { name: '키', exact: true }).fill('175');
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.locator('.result-panel')).toContainText('22.86');
  await expect(page.locator('main')).toContainText('의료 조언');
});
const calculationInputs: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  'take-home-pay': {
    pensionEmployeeRatePercent: '1', pensionMonthlyLowerBaseWon: '0', pensionMonthlyUpperBaseWon: '10000000', healthEmployeeRatePercent: '1', longTermCareRateOfHealthPercent: '1', employmentEmployeeRatePercent: '1', monthlyIncomeTaxWon: '0', localIncomeTaxRatePercent: '1',
  },
  'unemployment-benefit': { dailyLowerLimitWon: '0', dailyUpperLimitWon: '10000000' },
  'parental-leave-benefit': { replacementRatePercent: '50', monthlyCapWon: '2000000' },
  'freelancer-withholding': { withholdingRatePercent: '3' },
  'savings-maturity': { taxRatePercent: '10' },
  'deposit-interest': { taxRatePercent: '10' },
  'loan-affordability': { allowedDebtRatioPercent: '20' },
  'manual-exchange-rate': { wonPerUnit: '1300' },
  'acquisition-tax': { ratePercent: '2' },
  'brokerage-fee': { ratePercent: '1', capWon: '300000' },
  'deposit-rent-conversion': { conversionRatePercent: '4' },
  'rent-vs-deposit': { conversionRatePercent: '4' },
  'housing-affordability': { allowedDebtRatioPercent: '20', annualRatePercent: '0', loanLimitWon: '4000000' },
  'holding-cost-checklist': { taxWon: '300000' },
  'vat': { ratePercent: '10' },
  'sales-commission': { platformFeePercent: '10', paymentFeePercent: '2' },
  'online-market-settlement': { platformFeePercent: '10', paymentFeePercent: '2' },
  'freelancer-net-income': { withholdingRatePercent: '3' },
  'daily-calories': { activityMultiplier: '1.5' },
  'target-weight': { targetBmi: '22' },
  'walking-calories': { kcalPerKm: '50' },
  'water-intake': { mlPerKg: '30' },
  'electricity-estimate': { wonPerKwh: '150', baseWon: '1000' },
  'phone-plan-cost': { monthlyWon: '50000', deviceWon: '1000000', discountWon: '200000' },
};

for (const calculator of calculatorDefinitions) {
  test(`${calculator.slug} calculates locally without requests or persisted values`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(calculator.route, { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('button', { name: '계산하기' })).toBeEnabled();
    const requests: string[] = [];
    const record = (request: import('@playwright/test').Request) => requests.push(request.url());
    page.on('request', record);
    for (const [name, value] of Object.entries(calculationInputs[calculator.slug] ?? {})) {
      await page.locator(`[name="${name}"]`).fill(value);
    }
    await page.getByRole('button', { name: '계산하기' }).click();
    await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toBeVisible();
    await expect(page.locator('.result-panel')).not.toContainText(/NaN|Infinity/);
    await expect(page).toHaveURL(calculator.route);
    expect(requests).toEqual([]);
    page.off('request', record);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
    expect(await page.context().cookies()).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('date, course list and random choice inputs calculate and reset locally', async ({ page }) => {
  await page.goto('/life/date-offset/');
  await page.getByLabel('기준 날짜').fill('2024-03-01');
  await page.getByRole('textbox', { name: '더하거나 뺄 일수', exact: true }).fill('-1');
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.locator('.result-panel')).toContainText('2024-02-29');
  await page.goto('/education/gpa/');
  await page.getByRole('textbox', { name: '과목별 학점과 평점', exact: true }).fill('3:4, 1:2');
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.locator('.result-value')).toHaveText('3.50');
  await page.goto('/education/random-picker/');
  await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: '후보 목록', exact: true }).fill('사과, 배');
  await page.getByRole('textbox', { name: '선택 개수', exact: true }).fill('2');
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.locator('.result-details dd')).toHaveCount(2);
  expect((await page.locator('.result-details dd').allTextContents()).sort()).toEqual(['배', '사과']);
  await page.getByRole('button', { name: '초기화' }).click();
  await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
});

test('finance card instalment shows the equal-payment schedule and uses changed inputs', async ({ page }) => {
  await page.goto('/finance/card-instalment/');
  await page.getByLabel('할부 원금').fill('1200000');
  await page.getByLabel('연 이자율').fill('0');
  await page.getByLabel('상환 기간').fill('12');
  await page.getByRole('button', { name: '계산하기' }).click();
  const schedule = page.getByRole('table', { name: '원리금균등 월별 상환 일정', exact: true });
  await expect(schedule.locator('tbody tr')).toHaveCount(12);
  await expect(schedule.locator('tbody tr').last().locator('td').last()).toHaveText('₩0');
  await expect(page.locator('.result-panel')).toContainText('₩100,000');
  await page.getByLabel('할부 원금').fill('2400000');
  await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.locator('.result-panel')).toContainText('₩200,000');
});

test('finance manual exchange explains non-real-time values and clears stale output', async ({ page }) => {
  await page.goto('/finance/manual-exchange-rate/');
  await expect(page.locator('main')).toContainText('실시간 환율이 아닙니다');
  await page.getByLabel('외화 금액').fill('100.5');
  await page.getByLabel('외화 1단위당 원화 환율').fill('1300.5');
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.locator('.result-panel')).toContainText('₩130,700');
  await expect(page.locator('.result-panel')).toContainText('실시간 환율이 아닙니다');
  await page.getByLabel('외화 1단위당 원화 환율').fill('1000');
  await expect(page.getByRole('heading', { name: '계산 결과', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.locator('.result-panel')).toContainText('₩100,500');
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

test('generic calculator route preserves known pages and rejects category mismatches', async ({ page }) => {
  expect((await page.goto('/finance/loan-interest/'))?.status()).toBe(200);
  expect((await page.goto('/salary/fuel-cost/'))?.status()).toBe(404);
});

test('page sharing copies only the calculator base URL', async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => {
      (window as Window & { copiedText?: string }).copiedText = text;
    } } });
  });
  await page.goto('/car/fuel-cost/?private=123456');
  await page.getByLabel('주행거리').fill('987654');
  await page.getByRole('button', { name: '페이지 링크 복사' }).click();
  expect(await page.evaluate(() => (window as Window & { copiedText?: string }).copiedText)).toBe(new URL('/car/fuel-cost/', baseURL).href);
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

test('mobile repayment tables keep the installment number visible while scrolling later columns', async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto('/car/installment/');
  await page.getByRole('button', { name: '계산하기' }).click();

  const tableRegion = page.getByRole('region', { name: /월별 상환 일정/ });
  const firstInstallment = tableRegion.locator('tbody th').first();
  const initialBox = await firstInstallment.boundingBox();
  await tableRegion.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  const scrolledBox = await firstInstallment.boundingBox();

  expect(initialBox).not.toBeNull();
  expect(scrolledBox).not.toBeNull();
  expect(scrolledBox!.x).toBeCloseTo(initialBox!.x, 0);
});

test('calculator workspace uses a responsive form-first grid', async ({ page, isMobile }) => {
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

for (const { route: path, slug } of calculatorDefinitions) {
  test(`${slug} maintains a category banner and form-first responsive layout`, async ({ page, isMobile }) => {
    await page.goto(path);
    const banner = page.locator('.calculator-category-banner');
    await expect(banner).toBeVisible();
    const bannerBox = await banner.boundingBox();
    const workspace = await page.locator('.calculator-workspace-grid').boundingBox();
    const form = await page.locator('.calculator-form').boundingBox();
    const result = await page.locator('.result-panel').boundingBox();
    expect(bannerBox && workspace && form && result).toBeTruthy();
    if (!bannerBox || !workspace || !form || !result) throw new Error(`Missing calculator layout on ${path}`);

    expect(workspace.y - (bannerBox.y + bannerBox.height)).toBeGreaterThanOrEqual(16);
    expect(bannerBox.width).toBeCloseTo(workspace.width, 0);
    if (isMobile) {
      expect(form.y + form.height).toBeLessThan(result.y);
      expect(form.x).toBeCloseTo(result.x, 0);
    } else {
      expect(form.x + form.width).toBeLessThan(result.x);
      expect(form.y).toBeCloseTo(result.y, 0);
      await expect(page.locator('.result-panel')).toHaveCSS('position', 'sticky');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

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
