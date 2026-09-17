import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { CalculatorDirectory } from '@/components/content/CalculatorDirectory';
import { calculatorCategories } from '@/lib/calculators/categories';
import { calculatorCatalog } from '@/lib/calculators/registry';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('filters calculator links locally by title or description', async () => {
  const user = userEvent.setup();
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const pushState = vi.spyOn(window.history, 'pushState');
  const replaceState = vi.spyOn(window.history, 'replaceState');
  const store = vi.spyOn(Storage.prototype, 'setItem');

  render(<CalculatorDirectory calculators={calculatorCatalog} categories={calculatorCategories} />);
  await user.type(screen.getByRole('searchbox', { name: '계산기 검색' }), '유류');

  expect(screen.getByRole('link', { name: /유류비·연비 계산기/ })).toBeVisible();
  expect(screen.queryByRole('link', { name: /월 생활비 예산 계산기/ })).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(pushState).not.toHaveBeenCalled();
  expect(replaceState).not.toHaveBeenCalled();
  expect(store).not.toHaveBeenCalled();
});

test('links every registered category hub and shows a clear empty result', async () => {
  const user = userEvent.setup();
  render(<CalculatorDirectory calculators={calculatorCatalog} categories={calculatorCategories} />);

  expect(screen.getByRole('link', { name: /^급여·고용$/ })).toHaveAttribute('href', '/salary/');
  expect(screen.getByRole('link', { name: /^교육·단위$/ })).toHaveAttribute('href', '/education/');

  await user.type(screen.getByRole('searchbox', { name: '계산기 검색' }), '찾을 수 없는 계산기');

  expect(screen.getByText('검색 결과가 없습니다.')).toBeVisible();
  expect(screen.queryByRole('link', { name: /유류비·연비 계산기/ })).toBeNull();
});

test('matches case-insensitively against only calculator titles and descriptions', async () => {
  const user = userEvent.setup();
  const calculators = [{
    ...calculatorCatalog[0],
    title: 'Fuel Cost',
    description: 'Estimate trip spending',
  }];

  render(<CalculatorDirectory calculators={calculators} categories={[calculatorCategories[0]]} />);
  const search = screen.getByRole('searchbox', { name: '계산기 검색' });

  await user.type(search, 'fUeL');
  expect(screen.getByRole('link', { name: /Fuel Cost/ })).toBeVisible();

  await user.clear(search);
  await user.type(search, 'TRIP');
  expect(screen.getByRole('link', { name: /Fuel Cost/ })).toBeVisible();

  await user.clear(search);
  await user.type(search, '자동차');
  expect(screen.getByText('검색 결과가 없습니다.')).toBeVisible();
});
