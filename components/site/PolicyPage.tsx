import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteOrigin, webPageData } from '@/lib/seo/site';

export function PolicyPage({ page, children }: { page: { title: string; description: string; route: string }; children: ReactNode }) {
  return <article className="page-shell policy-page">
    <JsonLd data={webPageData(page)} />
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: getSiteOrigin() + '/' },
      { '@type': 'ListItem', position: 2, name: page.title, item: getSiteOrigin() + page.route },
    ] }} />
    <Breadcrumbs items={[{ label: '홈', href: '/' }, { label: page.title }]} />
    <h1>{page.title}</h1><p>{page.description}</p>
    {children}
  </article>;
}
