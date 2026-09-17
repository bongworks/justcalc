import type { calculatorCategories } from '@/lib/calculators/categories';
import type { CalculatorCatalogEntry } from '@/lib/calculators/types';
import { Breadcrumbs } from '@/components/site/Breadcrumbs';

type Category = typeof calculatorCategories[number];

export function CategoryPage({
  category,
  calculators,
}: {
  category: Category;
  calculators: ReadonlyArray<CalculatorCatalogEntry>;
}) {
  return (
    <div className="page-shell">
      <Breadcrumbs items={[{ label: '홈', href: '/' }, { label: category.label }]} />
      <header>
        <h1>{category.label} 계산기</h1>
        <p>{category.description}</p>
      </header>
      {calculators.length > 0 ? (
        <nav aria-label={`${category.label} 계산기 목록`}>
          <ul>
            {calculators.map((calculator) => (
              <li key={calculator.route}>
                <a href={calculator.route}>{calculator.title}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : <p>준비 중인 계산기입니다.</p>}
    </div>
  );
}
