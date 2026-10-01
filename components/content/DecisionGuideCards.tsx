/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation preserves the existing sanitized page-view flow. */
import { decisionGuides } from '@/content/decision-guides';

export function DecisionGuideCards({ calculatorSlug, category, limit, showIndexLink = true }: { calculatorSlug?: string; category?: string; limit?: number; showIndexLink?: boolean }) {
  const guides = decisionGuides.filter((guide) => (!calculatorSlug || guide.calculatorSlugs.includes(calculatorSlug)) && (!category || guide.category === category)).slice(0, limit);
  if (!guides.length) return null;
  return <section className="decision-guides" aria-labelledby="decision-guide-title">
    <div className="section-heading"><h2 id="decision-guide-title">계산 전에 읽어볼 글</h2>{showIndexLink && <a href="/guides/">전체 글 보기</a>}</div>
    <ul className="guide-card-grid">{guides.map((guide) => <li key={guide.slug}><a className="guide-card" href={guide.route}><h3>{guide.title}</h3><p>{guide.description}</p></a></li>)}</ul>
  </section>;
}
