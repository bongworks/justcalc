import type { calculatorCategories } from '@/lib/calculators/categories';
import type { CalculatorCatalogEntry } from '@/lib/calculators/types';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { categoryGuidance } from '@/content/category-guidance';
import { DecisionGuideCards } from '@/components/content/DecisionGuideCards';

type Category = typeof calculatorCategories[number];

export function CategoryPage({
  category,
  calculators,
}: {
  category: Category;
  calculators: ReadonlyArray<CalculatorCatalogEntry>;
}) {
  const guidance = categoryGuidance[category.slug];
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: '홈', href: '/' }, { label: category.label }]} />
      <header>
        <h1>{category.label} 계산기</h1>
        <p>{category.description}</p>
      </header>
      <section className="category-guidance" aria-labelledby="category-guidance-title">
        <h2 id="category-guidance-title">어떤 순서로 계산하면 좋을까요?</h2>
        <p>{guidance.introduction}</p>
        <ol>
          {guidance.steps.map((step) => (
            <li key={step.label}>
              <h3>{step.label}</h3>
              <p>{step.text}</p>
              <ul>
                {step.calculatorSlugs.map((slug) => {
                  const calculator = calculators.find((entry) => entry.slug === slug);
                  return calculator ? <li key={slug}><a href={calculator.route}>{calculator.title}</a></li> : null;
                })}
              </ul>
            </li>
          ))}
        </ol>
      </section>
      <DecisionGuideCards category={category.slug} />
      <h2>전체 {category.label} 계산기</h2>
      {calculators.length > 0 ? (
        <nav className="category-calculator-list" aria-label={`${category.label} 계산기 목록`}>
          <ul>
            {calculators.map((calculator) => (
              <li key={calculator.route}>
                <a href={calculator.route}>{calculator.title}</a>
                <p>{calculator.description}</p>
              </li>
            ))}
          </ul>
        </nav>
      ) : <p>준비 중인 계산기입니다.</p>}
    </div>
  );
}
