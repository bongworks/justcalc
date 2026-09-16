import type { ReactNode } from 'react';
import type { CalculatorCatalogEntry, CalculatorDefinition } from '@/lib/calculators/types';
import { CalculatorGuide } from '@/components/content/CalculatorGuide';
import { RelatedCalculators } from '@/components/content/RelatedCalculators';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';

const categoryLabels = { car: '자동차', finance: '금융', life: '생활비' } as const;

export function CalculatorPage<I, O>({ definition, children }: { definition: CalculatorDefinition<I, O> | CalculatorCatalogEntry; children: ReactNode }) {
  return (
    <article className="page-shell calculator-page">
      <Breadcrumbs items={[{ label: '홈', href: '/' }, { label: categoryLabels[definition.category], href: `/${definition.category}/` }, { label: definition.title }]} />
      <header className="calculator-heading"><h1>{definition.title}</h1><p>{definition.description}</p></header>
      <div className="calculator-workspace">{children}</div>
      <CalculatorGuide guide={definition.guide} lastReviewed={definition.lastReviewed} />
      <RelatedCalculators slugs={definition.relatedSlugs} />
    </article>
  );
}
