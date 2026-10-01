/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation preserves the existing sanitized page-view flow. */
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { decisionGuides } from '@/content/decision-guides';
import { calculatorCatalog } from '@/lib/calculators/registry';
import { getSiteOrigin, pageMetadata, webPageData } from '@/lib/seo/site';

export const dynamicParams = false;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return decisionGuides.map(({ slug }) => ({ slug }));
}

async function getGuide(params: Props['params']) {
  const { slug } = await params;
  const guide = decisionGuides.find((entry) => entry.slug === slug);
  if (!guide) notFound();
  return guide;
}

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await getGuide(params));
}

export default async function Guide({ params }: Props) {
  const guide = await getGuide(params);
  return <article className="page-shell decision-article">
    <JsonLd data={webPageData(guide)} />
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: getSiteOrigin() + '/' },
      { '@type': 'ListItem', position: 2, name: '계산 활용 가이드', item: getSiteOrigin() + '/guides/' },
      { '@type': 'ListItem', position: 3, name: guide.title, item: getSiteOrigin() + guide.route },
    ] }} />
    <Breadcrumbs items={[{ label: '홈', href: '/' }, { label: '계산 활용 가이드', href: '/guides/' }, { label: guide.title }]} />
    <header><p className="eyebrow">계산 활용 가이드</p><h1>{guide.title}</h1><p>{guide.description}</p><p className="review-date">작성일: <time dateTime={guide.published}>{guide.published}</time> · <a href="/editorial-policy/">작성 기준과 오류 정정</a></p></header>
    <section className="guide-summary" aria-labelledby="guide-summary-title"><h2 id="guide-summary-title">먼저 짚고 갈 점</h2><p>{guide.summary}</p><p>예제는 본문에 적은 조건으로 계산했습니다.</p></section>
    <nav className="guide-toc" aria-label="이 가이드의 목차"><h2>목차</h2><ol>{guide.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>)}<li><a href="#checklist">내 조건으로 계산할 때</a></li></ol></nav>
    {guide.sections.map((section) => <section className="guide-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
      <h2 id={`${section.id}-title`}>{section.title}</h2>
      {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {section.bullets && <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
      {section.table && <div className="table-scroll" tabIndex={0} role="region" aria-label={section.table.caption}><table><caption>{section.table.caption}</caption><thead><tr>{section.table.headers.map((header) => <th scope="col" key={header}>{header}</th>)}</tr></thead><tbody>{section.table.rows.map((row, index) => <tr key={index}>{row.map((cell, column) => column === 0 ? <th scope="row" key={column}>{cell}</th> : <td key={column}>{cell}</td>)}</tr>)}</tbody></table></div>}
    </section>)}
    <section className="guide-section" id="checklist" aria-labelledby="checklist-title"><h2 id="checklist-title">내 조건으로 계산할 때</h2><ul>{guide.checklist.map((item) => <li key={item}>{item}</li>)}</ul></section>
    <nav className="related-calculators" aria-label="관련 계산기"><h2>직접 계산해 보기</h2><ul>{guide.calculatorSlugs.map((slug) => {
      const calculator = calculatorCatalog.find((entry) => entry.slug === slug);
      return calculator ? <li key={slug}><a href={calculator.route}>{calculator.title}</a></li> : null;
    })}</ul></nav>
    <section className="guide-section" aria-labelledby="guide-sources-title"><h2 id="guide-sources-title">계산 근거와 참고 자료</h2><p>계산식과 개념을 확인할 때 참고한 자료입니다.</p><ul>{guide.sources.map((source) => <li key={source.href}><a href={source.href}>{source.label}</a></li>)}</ul><p>오류를 발견했다면 <a href="/contact/">문의 안내</a>로 알려주세요.</p></section>
  </article>;
}
