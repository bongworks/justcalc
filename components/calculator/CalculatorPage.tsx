import type { ReactNode } from 'react';
import type { CalculatorCatalogEntry, CalculatorDefinition } from '@/lib/calculators/types';
import { CalculatorGuide } from '@/components/content/CalculatorGuide';
import { DecisionGuideCards } from '@/components/content/DecisionGuideCards';
import { calculatorInsights } from '@/content/calculator-insights';
import { calculatorWorkedExamples } from '@/content/calculator-worked-examples';
import { RelatedCalculators } from '@/components/content/RelatedCalculators';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { getCategoryBySlug } from '@/lib/calculators/categories';
import { getSiteOrigin, webPageData } from '@/lib/seo/site';

export function CalculatorPage<I, O>({ definition, children }: { definition: CalculatorDefinition<I, O> | CalculatorCatalogEntry; children: ReactNode }) {
  const category = getCategoryBySlug(definition.category);
  const categoryLabel = category?.label ?? definition.category;
  const categoryRoute = category?.route ?? `/${definition.category}/`;
  const insights = calculatorInsights[definition.slug];
  const example = calculatorWorkedExamples[definition.slug];
  return (
    <article className="page-shell calculator-page">
      <JsonLd data={webPageData(definition)} />
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: getSiteOrigin() + '/' },
        { '@type': 'ListItem', position: 2, name: categoryLabel, item: getSiteOrigin() + categoryRoute },
        { '@type': 'ListItem', position: 3, name: definition.title, item: getSiteOrigin() + definition.route },
      ] }} />
      <Breadcrumbs items={[{ label: '홈', href: '/' }, { label: categoryLabel, href: categoryRoute }, { label: definition.title }]} />
      <header className="calculator-heading"><h1>{definition.title}</h1><p>{definition.description}</p></header>
      {insights && <section className="calculator-preparation" aria-labelledby="preparation-title"><h2 id="preparation-title">입력 전에 준비할 것</h2><ul>{insights.preparation.map((tip) => <li key={tip}>{tip}</li>)}</ul></section>}
      <section className="calculator-workspace" aria-label="계산기 작업 영역">{children}</section>
      {example && <section className="calculator-guide" aria-labelledby="worked-example-title"><h2 id="worked-example-title">{example.title}</h2>{example.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>}
      {insights && <section className="calculator-guide" aria-labelledby="interpretation-title"><h2 id="interpretation-title">결과를 읽는 방법</h2><ul>{insights.interpretation.map((tip) => <li key={tip}>{tip}</li>)}</ul><h3>비교할 때 놓치기 쉬운 점</h3><ul>{insights.pitfalls.map((tip) => <li key={tip}>{tip}</li>)}</ul></section>}
      <CalculatorGuide guide={definition.guide} lastReviewed={definition.lastReviewed} />
      <DecisionGuideCards calculatorSlug={definition.slug} />
      <RelatedCalculators slugs={definition.relatedSlugs} />
    </article>
  );
}
