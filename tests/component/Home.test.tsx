import '@testing-library/jest-dom/vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Home from '@/app/page';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('renders popular and recently added discovery links in static HTML without browser state', () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  const storage = vi.spyOn(Storage.prototype, 'setItem');
  const push = vi.spyOn(history, 'pushState');
  const replace = vi.spyOn(history, 'replaceState');
  const initialUrl = location.href;
  render(<div dangerouslySetInnerHTML={{ __html: renderToStaticMarkup(<Home />) }} />);

  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('차량 비용부터 생활비, 급여, 세금, 건강까지 필요한 계산을 한곳에서.');
  const popular = screen.getByRole('region', { name: '인기 계산기' });
  const recent = screen.getByRole('region', { name: '최근 추가한 계산기' });
  expect(within(popular).getByRole('heading', { level: 2, name: '인기 계산기' })).toBeVisible();
  expect(within(recent).getByRole('heading', { level: 2, name: '최근 추가한 계산기' })).toBeVisible();
  expect(within(popular).getByRole('link', { name: '대출 상환 방식 비교 계산기' })).toHaveAttribute('href', '/finance/loan-repayment/');
  expect(within(recent).getByRole('link', { name: '수동 시차 비교 계산기' })).toHaveAttribute('href', '/education/time-zone-comparison/');
  expect(within(popular).getByText(/실시간 이용 순위가 아닌/)).toBeVisible();
  for (const region of [popular, recent]) {
    expect(within(region).getAllByRole('listitem')).toHaveLength(6);
    expect(within(region).getAllByRole('heading', { level: 3 })).toHaveLength(6);
  }
  expect(fetch).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
  expect(push).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
  expect(location.href).toBe(initialUrl);
});
