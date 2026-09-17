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
  expect(screen.getByRole('alert')).toHaveTextContent('무작위 선택은 브라우저의 암호학적 난수가 필요합니다.');
  expect(screen.queryByRole('heading', { name: '계산 결과' })).not.toBeInTheDocument();
});

it.each([
  { slug: 'macro-nutrients', role: 'textbox' as const, label: '지방 비율', invalid: '10', valid: '20', reason: '세 비율의 합계는 100%여야 합니다.' },
  { slug: 'unit-conversion', role: 'combobox' as const, label: '변환 단위', invalid: 'kg', valid: 'm', reason: '같은 종류의 단위끼리만 변환할 수 있습니다.' },
])('explains and associates the $slug evaluation error, then clears it on correction', async ({ slug, role, label, invalid, valid, reason }) => {
  const user = userEvent.setup();
  render(<CalculatorClient slug={slug} />);
  const input = screen.getByRole(role, { name: label });
  async function setValue(value: string) {
    if (role === 'combobox') await user.selectOptions(input, value);
    else { await user.clear(input); await user.type(input, value); }
  }
  await setValue(invalid);
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent(reason);
  expect(alert).toHaveFocus();
  const group = screen.getByRole('group', { name: '계산값 입력' });
  expect(group).toHaveAccessibleDescription(reason);
  expect(group).toHaveAttribute('aria-invalid', 'true');
  expect(screen.queryByRole('heading', { name: '계산 결과' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(screen.getByRole('alert')).toHaveFocus();

  await user.click(screen.getByRole('button', { name: '초기화' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(group).not.toHaveAttribute('aria-invalid');
  await setValue(invalid);
  await user.click(screen.getByRole('button', { name: '계산하기' }));

  await setValue(valid);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(group).not.toHaveAttribute('aria-invalid');
  expect(group).not.toHaveAttribute('aria-describedby');
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(screen.getByRole('heading', { name: '계산 결과' })).toBeVisible();
});
