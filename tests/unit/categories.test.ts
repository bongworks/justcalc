import { expect, test } from 'vitest';
import { calculatorCategories, getCategoryBySlug } from '@/lib/calculators/categories';
import { getCategoryCalculators } from '@/lib/calculators/registry';

test('exposes the eight static calculator categories', () => {
  expect(calculatorCategories.map(({ slug }) => slug)).toEqual([
    'car',
    'finance',
    'salary',
    'realestate',
    'business',
    'health',
    'life',
    'education',
  ]);
  expect(getCategoryBySlug('salary')).toMatchObject({ label: '급여·고용', route: '/salary/' });
  expect(getCategoryBySlug('unknown')).toBeUndefined();
});

test('returns registered calculators for a category', () => {
  expect(getCategoryCalculators('car').map(({ slug }) => slug)).toContain('fuel-cost');
  expect(getCategoryCalculators('salary').map(({ slug }) => slug)).toEqual([
    'take-home-pay',
    'hourly-monthly-pay',
    'weekly-holiday-pay',
    'severance-pay',
    'annual-leave-allowance',
    'unemployment-benefit',
    'parental-leave-benefit',
    'salary-negotiation',
    'freelancer-withholding',
  ]);
});
