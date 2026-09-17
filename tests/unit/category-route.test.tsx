import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { CalculatorPage } from '@/components/calculator/CalculatorPage';
import { calculatorCatalog, getCalculatorsByCategory } from '@/lib/calculators/registry';

afterEach(cleanup);

test('each category has a static calculator list', () => {
  expect(getCalculatorsByCategory('car').map(({ slug }) => slug)).toContain('fuel-cost');
  expect(getCalculatorsByCategory('salary')).toHaveLength(9);
});

test('calculator pages use the registered category label', () => {
  const definition = {
    ...calculatorCatalog[0],
    category: 'salary' as const,
    route: '/salary/example/',
  };

  render(<CalculatorPage definition={definition}><div>calculator</div></CalculatorPage>);

  expect(screen.getByRole('navigation', { name: '현재 위치' })).toHaveTextContent('급여·고용');
});
