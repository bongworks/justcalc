import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import Home from '@/app/page';
import { CalculatorPage } from '@/components/calculator/CalculatorPage';
import { calculatorCatalog } from '@/lib/calculators/registry';

afterEach(cleanup);

it('lets a visitor start with a practical question from the home page', () => {
  render(<Home />);
  const guides = screen.getByRole('region', { name: '계산 전에 읽어볼 글' });
  expect(within(guides).getAllByRole('link')).toHaveLength(5);
  expect(within(guides).getByRole('link', { name: /자동차/ })).toHaveAttribute('href', '/guides/car-cost-budget/');
  expect(screen.getByRole('link', { name: '계산기 찾아보기' })).toHaveAttribute('href', '#category-title');
});

it('explains how to prepare and interpret the car budget without repeating its description', () => {
  const definition = calculatorCatalog.find(({ slug }) => slug === 'maintenance-cost')!;
  render(<CalculatorPage definition={definition}><p>계산 도구</p></CalculatorPage>);
  expect(screen.getAllByText(definition.description)).toHaveLength(1);
  expect(screen.getByRole('heading', { name: '입력 전에 준비할 것' })).toBeVisible();
  expect(screen.getByRole('heading', { name: '결과를 읽는 방법' })).toBeVisible();
  expect(screen.getByRole('link', { name: /자동차.*월.*비용/ })).toHaveAttribute('href', '/guides/car-cost-budget/');
});

it('keeps the existing formula guide on calculators without an in-depth explainer', () => {
  const definition = calculatorCatalog.find(({ slug }) => slug === 'dday')!;
  render(<CalculatorPage definition={definition}><p>계산 도구</p></CalculatorPage>);
  expect(screen.getByText(definition.guide.formula)).toBeVisible();
  expect(screen.queryByRole('heading', { name: '입력 전에 준비할 것' })).not.toBeInTheDocument();
});

it('shows the indivisible won in a splitting example next to the calculator', () => {
  const definition = calculatorCatalog.find(({ slug }) => slug === 'household-split')!;
  render(<CalculatorPage definition={definition}><p>계산 도구</p></CalculatorPage>);
  const example = screen.getByRole('region', { name: '78,500원을 세 명이 나누면?' });
  expect(within(example).getByText(/26,167원.*26,167원.*26,166원/)).toBeVisible();
});
