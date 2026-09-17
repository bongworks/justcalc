'use client';

import { useState } from 'react';
import type { calculatorCategories } from '@/lib/calculators/categories';
import type { CalculatorCatalogEntry } from '@/lib/calculators/types';

type Category = typeof calculatorCategories[number];

export function CalculatorDirectory({
  calculators,
  categories,
}: {
  calculators: ReadonlyArray<CalculatorCatalogEntry>;
  categories: ReadonlyArray<Category>;
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  // Search remains ephemeral and only narrows the catalogue already rendered on the page.
  const filteredCalculators = normalizedQuery
    ? calculators.filter(({ title, description }) =>
      `${title}\n${description}`.toLocaleLowerCase('ko-KR').includes(normalizedQuery))
    : calculators;
  const visibleCategories = normalizedQuery
    ? categories.filter(({ slug }) => filteredCalculators.some((calculator) => calculator.category === slug))
    : categories;

  return (
    <div className="calculator-directory">
      <div className="directory-search">
        <label htmlFor="calculator-search">계산기 검색</label>
        <input
          aria-label="계산기 검색"
          id="calculator-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="계산기 이름이나 설명을 검색하세요"
          type="search"
          value={query}
        />
        <p aria-live="polite">
          {normalizedQuery
            ? `${filteredCalculators.length}개의 계산기를 찾았습니다.`
            : `전체 ${calculators.length}개의 계산기를 살펴보세요.`}
        </p>
      </div>

      <nav className="category-nav" aria-label="계산기 카테고리">
        <ul>
          {categories.map((category) => (
            <li key={category.slug}><a href={category.route}>{category.label}</a></li>
          ))}
        </ul>
      </nav>

      {filteredCalculators.length > 0 || !normalizedQuery ? (
        <div className="category-grid">
          {visibleCategories.map((category) => {
            const categoryCalculators = filteredCalculators.filter((calculator) => calculator.category === category.slug);
            const headingId = `${category.slug}-title`;

            return (
              <section className="category-card" key={category.slug} aria-labelledby={headingId}>
                <div className="category-card-heading">
                  <h3 id={headingId}><a href={category.route}>{category.label} 계산기</a></h3>
                  <a className="category-hub-link" href={category.route} aria-label={`${category.label} 계산기 전체 보기`}>전체 보기</a>
                </div>
                <p>{category.description}</p>
                {categoryCalculators.length > 0 ? (
                  <ul>
                    {categoryCalculators.map(({ title, description, route }) => (
                      <li key={route}>
                        <a className="home-calculator-card" href={route}>
                          <h4>{title}</h4>
                          <p>{description}</p>
                          <span aria-hidden="true">→</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : <p className="category-empty">준비 중인 계산기입니다.</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <p className="directory-empty" role="status">검색 결과가 없습니다.</p>
      )}
    </div>
  );
}
