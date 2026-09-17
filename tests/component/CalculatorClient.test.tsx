import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { CalculatorClient } from '@/components/calculator/CalculatorClient';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each(['lottery-numbers', 'random-picker'])('draws %s only after submit and copies local results', async (slug) => {
  const user = userEvent.setup();
  const getRandomValues = vi.fn((values: Uint32Array) => { values[0] = 0; return values; });
  vi.stubGlobal('crypto', { getRandomValues });
  const fetch = vi.spyOn(globalThis, 'fetch');
  const storage = vi.spyOn(Storage.prototype, 'setItem');
  const copy = vi.spyOn(navigator.clipboard, 'writeText');
  render(<CalculatorClient slug={slug} />);
  expect(getRandomValues).not.toHaveBeenCalled();
  expect(screen.queryByRole('heading', { name: '계산 결과' })).not.toBeInTheDocument();
  if (slug === 'random-picker') {
    const choices = screen.getByRole('textbox', { name: '후보 목록' });
    await user.clear(choices);
    await user.type(choices, '사과, 배, 귤');
    expect(getRandomValues).not.toHaveBeenCalled();
  }
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  const expected = slug === 'lottery-numbers' ? '1, 2, 3, 4, 5, 6' : '사과';
  expect(screen.getByText(expected, { exact: true })).toBeVisible();
  expect(getRandomValues).toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '결과 복사' }));
  expect(copy.mock.calls[0][0]).toContain(expected);
  expect(fetch).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '초기화' }));
  expect(screen.queryByRole('heading', { name: '계산 결과' })).not.toBeInTheDocument();
});

it('shows a local error when secure browser random generation is unavailable', async () => {
  const user = userEvent.setup();
  vi.stubGlobal('crypto', undefined);
  render(<CalculatorClient slug="lottery-numbers" />);
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(screen.getByRole('alert')).toHaveTextContent('입력값을 확인해 주세요.');
  expect(screen.queryByRole('heading', { name: '계산 결과' })).not.toBeInTheDocument();
});
