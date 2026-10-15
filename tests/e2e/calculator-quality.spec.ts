import { expect, test } from '@playwright/test';

test('regular savings models change the actual after-tax maturity amount', async ({ page }) => {
  await page.goto('/finance/savings-maturity/');
  await page.getByRole('textbox', { name: '매월 납입액', exact: true }).fill('100000');
  await page.getByRole('textbox', { name: '연 이자율', exact: true }).fill('6');
  await page.getByRole('textbox', { name: '이자 세율', exact: true }).fill('15.4');
  await page.getByRole('button', { name: '계산하기', exact: true }).click();
  await expect(page.locator('.result-value')).toHaveText('₩1,232,994');
  await page.getByRole('button', { name: '비교 기준으로 저장' }).click();
  await page.getByRole('combobox', { name: '이자 계산 방식', exact: true }).selectOption('monthly');
  await page.getByRole('combobox', { name: '납입 시점', exact: true }).selectOption('end');
  await expect(page.locator('.result-value')).toHaveCount(0);
  await page.getByRole('button', { name: '계산하기', exact: true }).click();
  await expect(page.locator('.result-value')).toHaveText('₩1,228,389');
  const comparison = page.getByRole('region', { name: '조건별 결과 비교', exact: true });
  await expect(comparison).toContainText('₩1,232,994');
  await expect(comparison).toContainText('₩1,228,389');
  await expect(comparison).toContainText('매월 초 납입');
  await expect(comparison).toContainText('매월 말 납입');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(comparison).toHaveCount(0);
});

test('grace months are included in the total loan schedule and invalid periods can be corrected', async ({ page }) => {
  await page.goto('/finance/loan-repayment/');
  await page.getByRole('textbox', { name: '대출 원금', exact: true }).fill('1200');
  await page.getByRole('textbox', { name: '연 이자율', exact: true }).fill('12');
  await page.getByRole('textbox', { name: '상환 기간', exact: true }).fill('3');
  await page.getByRole('textbox', { name: '거치 기간', exact: true }).fill('3');
  await page.getByRole('button', { name: '계산하기', exact: true }).click();
  await expect(page.locator('.calculator-form').getByRole('alert')).toContainText('전체 상환 기간보다 짧은');
  await page.getByRole('textbox', { name: '거치 기간', exact: true }).fill('1');
  await page.getByRole('button', { name: '계산하기', exact: true }).click();
  await expect(page.locator('.result-value')).toHaveText('₩6');
  const rows = page.getByRole('table', { name: '원금균등 월별 상환 일정', exact: true }).locator('tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.first().locator('td').first()).toHaveText('₩12');
  await expect(rows.nth(1).locator('td').first()).toHaveText('₩612');
});

test('partial interest-free card payments charge only the selected initial installments', async ({ page }) => {
  await page.goto('/finance/card-instalment/');
  await page.getByRole('textbox', { name: '연 할부 수수료율', exact: true }).fill('18');
  await page.getByRole('combobox', { name: '수수료 부담 방식', exact: true }).selectOption('partial');
  await page.getByRole('textbox', { name: '수수료 부담 회차', exact: true }).fill('3');
  await page.getByRole('button', { name: '계산하기', exact: true }).click();
  await expect(page.locator('.result-value')).toHaveText('₩118,000');
  await expect(page.locator('.result-details')).toContainText('₩49,500');
  const rows = page.getByRole('table', { name: '카드 할부 월별 상환 일정', exact: true }).locator('tbody tr');
  await expect(rows.nth(3).locator('td').first()).toHaveText('₩100,000');
  await page.getByRole('combobox', { name: '수수료 부담 방식', exact: true }).selectOption('free');
  await page.getByRole('button', { name: '계산하기', exact: true }).click();
  await expect(page.locator('.result-value')).toHaveText('₩100,000');
});

test('quick money and term entry work without losing the edited amount on submit', async ({ page }) => {
  await page.goto('/finance/deposit-interest/');
  await page.getByRole('button', { name: '예치 원금 100만원 더하기' }).click();
  await expect(page.getByRole('textbox', { name: '예치 원금', exact: true })).toHaveValue('2,000,000');
  await expect(page.locator('.field-amount').first()).toHaveText('200만 원');
  await page.getByRole('button', { name: '저축 기간 2년 입력' }).click();
  await page.getByRole('textbox', { name: '이자 세율', exact: true }).fill('0');
  await page.getByRole('button', { name: '계산하기', exact: true }).click();
  await expect(page.locator('.result-value')).toHaveText('₩2,120,000');
});
