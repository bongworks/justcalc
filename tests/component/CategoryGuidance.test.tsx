import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { CategoryPage } from '@/components/content/CategoryPage';
import { calculatorCategories } from '@/lib/calculators/categories';
import { getCalculatorsByCategory } from '@/lib/calculators/registry';

afterEach(cleanup);

test.each(calculatorCategories)('$label hub explains a task sequence with working calculator links', (category) => {
  const calculators = getCalculatorsByCategory(category.slug);
  render(<CategoryPage category={category} calculators={calculators} />);

  const guidance = screen.getByRole('region', { name: '어떤 순서로 계산하면 좋을까요?' });
  const steps = within(guidance).getAllByRole('heading', { level: 3 });
  expect(steps.length).toBeGreaterThanOrEqual(2);
  expect(steps.length).toBeLessThanOrEqual(3);
  for (const step of steps) {
    const item = step.closest('li')!;
    expect(within(item).getByText((_, element) => element?.tagName === 'P')).toBeVisible();
    const links = within(item).getAllByRole('link');
    for (const link of links) {
      expect(calculators.some(({ route, title }) => route === link.getAttribute('href') && title === link.textContent)).toBe(true);
    }
  }
});

test('car hub helps a prospective owner include operating costs after the purchase budget', () => {
  render(<CategoryPage category={calculatorCategories[0]} calculators={getCalculatorsByCategory('car')} />);
  const guidance = screen.getByRole('region', { name: '어떤 순서로 계산하면 좋을까요?' });
  const links = within(guidance).getAllByRole('link');
  const routes = links.map((link) => link.getAttribute('href'));
  expect(routes).toContain('/car/purchase-cost/');
  expect(routes).toContain('/car/maintenance-cost/');
  expect(routes.indexOf('/car/purchase-cost/')).toBeLessThan(routes.indexOf('/car/maintenance-cost/'));
});

test.each(calculatorCategories)('$label catalogue explains what each calculator covers', (category) => {
  const calculators = getCalculatorsByCategory(category.slug);
  render(<CategoryPage category={category} calculators={calculators} />);
  const catalogue = screen.getByRole('navigation', { name: `${category.label} 계산기 목록` });
  for (const calculator of calculators) {
    expect(within(catalogue).getByRole('link', { name: calculator.title })).toHaveAttribute('href', calculator.route);
    expect(within(catalogue).getByText(calculator.description)).toBeVisible();
  }
});
