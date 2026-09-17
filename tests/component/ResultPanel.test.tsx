import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { ResultPanel } from '@/components/calculator/ResultPanel';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const result = { summary: { label: '예상 유류비', value: '51,000원' }, rows: [{ label: '필요 연료량', value: '30L' }] };

it('shows a successful summary once in a persistent polite live region', () => {
  const { rerender, container } = render(<ResultPanel result={null} />);
  expect(screen.queryByRole('heading', { name: '계산 결과' })).not.toBeInTheDocument();
  expect(screen.getByText('입력한 조건으로 계산 결과를 확인하세요.')).toBeVisible();
  expect(container.querySelector('[aria-live="polite"]')).toBeEmptyDOMElement();
  rerender(<ResultPanel result={result} />);
  expect(screen.getAllByText('51,000원')).toHaveLength(1);
  expect(screen.getByText('51,000원').closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
  expect(screen.getByText(/계산 결과는 참고용/)).toBeVisible();
  rerender(<ResultPanel result={null} />);
  expect(screen.queryByText('51,000원')).not.toBeInTheDocument();
});

it('copies labelled output and reference warning without changing or copying the URL', async () => {
  const user = userEvent.setup();
  const copy = vi.spyOn(navigator.clipboard, 'writeText');
  const initialUrl = location.href;
  render(<ResultPanel result={result} />);
  await user.click(screen.getByRole('button', { name: '결과 복사' }));
  expect(copy).toHaveBeenCalledWith('예상 유류비: 51,000원\n필요 연료량: 30L\n참고용 계산이며 실제 계약·청구 금액과 다를 수 있습니다.');
  expect(location.href).toBe(initialUrl);
  expect(screen.getByRole('status')).toHaveTextContent('결과를 복사했습니다.');
  expect(screen.getAllByText('51,000원')).toHaveLength(1);
});

it('handles clipboard failure visibly without removing results', async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
  render(<ResultPanel result={result} />);
  await user.click(screen.getByRole('button', { name: '결과 복사' }));
  expect(screen.getByRole('status')).toHaveTextContent('복사하지 못했습니다. 결과를 직접 선택해 복사해 주세요.');
  expect(screen.getByText('51,000원')).toBeVisible();
});
