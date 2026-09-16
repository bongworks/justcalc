import { calculators } from '@/content/calculators';
import type { CalculatorCatalogEntry } from '@/lib/calculators/types';

export const calculatorCatalog: ReadonlyArray<CalculatorCatalogEntry> = calculators;
export const calculatorBySlug = new Map(calculatorCatalog.map((calculator) => [calculator.slug, calculator]));
export const calculatorByRoute = new Map(calculatorCatalog.map((calculator) => [calculator.route, calculator]));

export function getCalculatorBySlug(slug: string) {
  return calculatorBySlug.get(slug);
}

export function getCalculatorByRoute(route: string) {
  return calculatorByRoute.get(route);
}
