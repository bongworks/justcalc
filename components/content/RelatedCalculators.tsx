import { getCalculatorBySlug } from '@/lib/calculators/registry';

export function RelatedCalculators({ slugs }: { slugs: ReadonlyArray<string> }) {
  const calculators = [...new Set(slugs)].map(getCalculatorBySlug).filter((calculator) => calculator !== undefined).slice(0, 4);
  if (!calculators.length) return null;
  return <nav className="related-calculators" aria-label="관련 계산기"><h2>함께 계산해 보세요</h2><ul>{calculators.map((calculator) => <li key={calculator.slug}><a href={calculator.route}>{calculator.title}</a></li>)}</ul></nav>;
}
