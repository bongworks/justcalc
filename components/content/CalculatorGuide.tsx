import type { CalculatorGuide as GuideContent } from '@/lib/calculators/types';

export function CalculatorGuide({ guide, lastReviewed }: { guide: GuideContent; lastReviewed: string }) {
  return (
    <section className="calculator-guide" aria-label="계산 방법과 기준">
      <h2>계산 방법과 기준</h2>
      <h3>계산식</h3><p className="formula">{guide.formula}</p>
      <h3>계산 예시</h3>
      {guide.examples.map((example) => <section className="guide-example" key={example.title}><h4>{example.title}</h4><p>{example.text}</p></section>)}
      <h3>계산의 한계와 유의사항</h3><ul>{guide.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
      <h3>참고 자료</h3><ul>{guide.sources.map((source) => <li key={source.href}><a href={source.href}>{source.label}</a></li>)}</ul>
      <p className="review-date">마지막 검토일: <time dateTime={lastReviewed}>{lastReviewed}</time></p>
    </section>
  );
}
