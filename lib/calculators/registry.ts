import { calculators } from '@/content/calculators';
import type { CalculatorCatalogEntry } from '@/lib/calculators/types';
import type { CalculatorCategory } from '@/lib/calculators/types';
import { calculatorDefinitions } from '@/lib/calculators/definitions';

export const calculatorCatalog: ReadonlyArray<CalculatorCatalogEntry> = calculators;
export const calculatorBySlug = new Map(calculatorDefinitions.map((calculator) => [calculator.slug, calculator]));
export const calculatorByRoute = new Map(calculatorDefinitions.map((calculator) => [calculator.route, calculator]));

export function getCalculatorBySlug(slug: string) {
  return calculatorBySlug.get(slug);
}

export function getCalculatorByRoute(route: string) {
  return calculatorByRoute.get(route);
}

export function getCalculatorsByCategory(category: CalculatorCategory) {
  return calculatorDefinitions.filter((calculator) => calculator.category === category);
}

export function getCalculatorByCategoryAndSlug(category: CalculatorCategory, slug: string) {
  const calculator = getCalculatorBySlug(slug);
  return calculator?.category === category ? calculator : undefined;
}
