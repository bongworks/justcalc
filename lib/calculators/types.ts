export type CalculatorCategory = 'car' | 'finance' | 'life';

export interface CalculatorGuide {
  formula: string;
  examples: ReadonlyArray<{ title: string; text: string }>;
  limitations: ReadonlyArray<string>;
  sources: ReadonlyArray<{ label: string; href: string }>;
}

export interface CalculatorCatalogEntry {
  slug: string;
  category: CalculatorCategory;
  route: string;
  title: string;
  description: string;
  lastReviewed: string;
  relatedSlugs: ReadonlyArray<string>;
  guide: CalculatorGuide;
}

export interface CalculatorDefinition<I, O> extends CalculatorCatalogEntry {
  parse: (raw: Record<string, string>) => I;
  calculate: (input: I) => O;
}
