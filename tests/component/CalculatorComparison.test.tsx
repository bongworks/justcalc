import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { CalculatorClient } from '@/components/calculator/CalculatorClient';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('compares recalculated results with their own input snapshot, then resets both', async () => {
  const user = userEvent.setup();
  const storage = vi.spyOn(Storage.prototype, 'setItem');
  const fetch = vi.spyOn(globalThis, 'fetch');
  render(<CalculatorClient slug="fuel-cost" />);
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  await user.click(screen.getByRole('button', { name: '비교 기준으로 저장' }));
  const distance = screen.getByRole('textbox', { name: '주행거리' });
  await user.clear(distance);
  await user.type(distance, '840');
  expect(screen.queryByRole('heading', { name: '계산 결과' })).not.toBeInTheDocument();
  expect(screen.getByText(/조건을 바꾼 뒤 다시 계산/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  const comparison = screen.getByRole('region', { name: '조건별 결과 비교' });
  const row = within(comparison).getByRole('row', { name: /예상 유류비/ });
  expect(row).toHaveTextContent('₩51,000');
  expect(row).toHaveTextContent('₩102,000');
  expect(within(comparison).getByText(/420.*km/)).toBeVisible();
  expect(within(comparison).getByText(/840.*km/)).toBeVisible();
  expect(storage).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '초기화' }));
  expect(screen.queryByRole('region', { name: '조건별 결과 비교' })).not.toBeInTheDocument();
});

it('clears comparison and restores defaults when the calculator changes', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<CalculatorClient slug="fuel-cost" />);
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  await user.click(screen.getByRole('button', { name: '비교 기준으로 저장' }));
  rerender(<CalculatorClient slug="deposit-interest" />);
  expect(screen.queryByRole('region', { name: '조건별 결과 비교' })).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: '예치 원금' })).toHaveValue('1000000');
});

it('copies calculation conditions with the result so another scenario is not confused', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText');
  render(<CalculatorClient slug="fuel-cost" />);
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  await user.click(screen.getByRole('button', { name: '결과 복사' }));
  expect(copy.mock.calls[0][0]).toContain('주행거리: 420 km');
  expect(copy.mock.calls[0][0]).toContain('예상 유류비: ₩51,000');
});

it('keeps tiny valid inputs compact in the conditions instead of expanding their exponent', async () => {
  const user = userEvent.setup();
  render(<CalculatorClient slug="fuel-cost" />);
  const distance = screen.getByRole('textbox', { name: '주행거리' });
  await user.clear(distance);
  await user.type(distance, '1e-1000000001');
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(screen.getByRole('heading', { name: '계산 결과' })).toBeVisible();
  expect(screen.getByText('1e-1000000001 km')).toBeInTheDocument();
});
