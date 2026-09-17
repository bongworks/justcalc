import type { ReactNode } from 'react';
import type { CalculatorCatalogEntry, CalculatorDefinition } from '@/lib/calculators/types';
import { CalculatorGuide } from '@/components/content/CalculatorGuide';
import { RelatedCalculators } from '@/components/content/RelatedCalculators';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteOrigin, webPageData } from '@/lib/seo/site';

const categoryLabels = { car: '자동차', finance: '금융', life: '생활비' } as const;

export function CalculatorPage<I, O>({ definition, children }: { definition: CalculatorDefinition<I, O> | CalculatorCatalogEntry; children: ReactNode }) {
  return (
    <article className="page-shell calculator-page">
      <JsonLd data={webPageData(definition)} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: getSiteOrigin() + '/' },
        { '@type': 'ListItem', position: 2, name: categoryLabels[definition.category], item: getSiteOrigin() + '/#' + definition.category },
        { '@type': 'ListItem', position: 3, name: definition.title, item: getSiteOrigin() + definition.route },
      ] }} />
      <Breadcrumbs items={[{ label: '홈', href: '/' }, { label: categoryLabels[definition.category], href: `/#${definition.category}` }, { label: definition.title }]} />
      <header className="calculator-heading"><h1>{definition.title}</h1><p>{definition.description}</p></header>
      <section className="calculator-category-banner" aria-label={`${categoryLabels[definition.category]} 계산기 안내`}>
        <p><strong>{categoryLabels[definition.category]} · {definition.title}</strong></p>
        <p>{definition.description}</p>
      </section>
      <section className="calculator-workspace" aria-label="계산기 작업 영역">{children}</section>
      <CalculatorGuide guide={definition.guide} lastReviewed={definition.lastReviewed} />
      <RelatedCalculators slugs={definition.relatedSlugs} />
    </article>
  );
}
