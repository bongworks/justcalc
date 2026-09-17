# Calculator Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Turn the nine-tool static site into a typed, category-driven calculator platform with category hubs, search, and data-derived SEO checks.

**Architecture:** Preserve every existing calculator URL while replacing duplicated category routes and hard-coded home lists with a typed category registry. Existing definitions retain their local, pure evaluation model; category hubs, sitemap, metadata, breadcrumbs, home discovery, and verification consume the same typed registry.

**Tech Stack:** Next.js 16 App Router static export, React 19, TypeScript, Vitest, Playwright, Decimal.js.

**Spec:** docs/superpowers/specs/2026-09-17-calculator-catalog-expansion-design.md

## Global Constraints

- Do not issue calculator-related network requests, create API routes/server actions, persist form values, or place values in URLs.
- Keep the original nine routes and all calculations intact.
- Use static generateStaticParams; unknown category/slug combinations must render 404.
- Every catalogue entry requires Korean title/description, review date, formula, two examples, limitations, sources, and valid related slugs.
- Read the applicable Next.js 16 App Router/static-export documentation in node_modules/next/dist/docs/ before editing routes.

---

### Task 1: Typed category configuration and catalogue contracts

**Files:**
- Create: lib/calculators/categories.ts
- Modify: lib/calculators/types.ts
- Modify: lib/calculators/registry.ts
- Test: tests/unit/categories.test.ts

**Interfaces:**
- Produces calculatorCategories, CalculatorCategory, getCategoryBySlug(category), and getCategoryCalculators(category).
- calculatorCategories contains { slug, label, description, route } for car, finance, salary, realestate, business, health, life, and education.

- [ ] **Step 1: Write the failing category test**

~~~ts
import { expect, test } from 'vitest';
import { calculatorCategories, getCategoryBySlug } from '@/lib/calculators/categories';

test('exposes the eight static calculator categories', () => {
  expect(calculatorCategories.map(({ slug }) => slug)).toEqual([
    'car', 'finance', 'salary', 'realestate', 'business', 'health', 'life', 'education',
  ]);
  expect(getCategoryBySlug('salary')).toMatchObject({ label: '급여·고용', route: '/salary/' });
  expect(getCategoryBySlug('unknown')).toBeUndefined();
});
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: pnpm test tests/unit/categories.test.ts

Expected: FAIL because categories.ts does not exist.

- [ ] **Step 3: Implement the typed configuration**

~~~ts
export const calculatorCategories = [
  { slug: 'car', label: '자동차', description: '차량 구매와 운행 비용을 계산합니다.', route: '/car/' },
  { slug: 'finance', label: '금융', description: '대출과 저축 계획을 비교합니다.', route: '/finance/' },
  { slug: 'salary', label: '급여·고용', description: '급여와 근무 보상을 가늠합니다.', route: '/salary/' },
  { slug: 'realestate', label: '부동산', description: '주거 거래와 보유 비용을 계산합니다.', route: '/realestate/' },
  { slug: 'business', label: '세금·사업', description: '사업 정산과 수익성을 계산합니다.', route: '/business/' },
  { slug: 'health', label: '건강·운동', description: '몸 상태와 운동 목표를 계산합니다.', route: '/health/' },
  { slug: 'life', label: '생활·날짜', description: '일상 비용과 날짜를 계산합니다.', route: '/life/' },
  { slug: 'education', label: '교육·단위', description: '학습과 단위 변환을 돕습니다.', route: '/education/' },
] as const;
export type CalculatorCategory = typeof calculatorCategories[number]['slug'];
export function getCategoryBySlug(slug: string) {
  return calculatorCategories.find((category) => category.slug === slug);
}
~~~

Move CalculatorCategory out of types.ts, import it there, and retain registry functions with the widened type.

- [ ] **Step 4: Run focused tests**

Run: pnpm test tests/unit/categories.test.ts tests/unit/registry.test.ts

Expected: PASS.

- [ ] **Step 5: Commit**

~~~bash
git add lib/calculators/categories.ts lib/calculators/types.ts lib/calculators/registry.ts tests/unit/categories.test.ts tests/unit/registry.test.ts
git commit -m "feat: add calculator category registry"
~~~

### Task 2: Generic static category and calculator routes

**Files:**
- Create: app/(site)/[category]/page.tsx
- Create: app/(site)/[category]/[slug]/page.tsx
- Create: components/content/CategoryPage.tsx
- Remove: app/(site)/car/[slug]/page.tsx
- Remove: app/(site)/finance/[slug]/page.tsx
- Remove: app/(site)/life/[slug]/page.tsx
- Modify: components/calculator/CalculatorPage.tsx
- Test: tests/unit/category-route.test.tsx
- Test: tests/e2e/calculators.spec.ts

**Interfaces:**
- The category route exports a static page for every calculatorCategories entry.
- The calculator route exports { category, slug } for every registered definition and calls notFound() for a mismatch.

- [ ] **Step 1: Write route tests**

~~~ts
import { expect, test } from 'vitest';
import { getCalculatorsByCategory } from '@/lib/calculators/registry';

test('each category has a static calculator list', () => {
  expect(getCalculatorsByCategory('car').map(({ slug }) => slug)).toContain('fuel-cost');
  expect(getCalculatorsByCategory('salary')).toEqual([]);
});
~~~

Extend Playwright with status 200 for /finance/loan-interest/ and 404 for /salary/fuel-cost/.

- [ ] **Step 2: Run the focused route test to verify it fails**

Run: pnpm test tests/unit/category-route.test.tsx

Expected: FAIL until generic routing is added.

- [ ] **Step 3: Implement the static routes**

~~~tsx
export const dynamicParams = false;
export function generateStaticParams() {
  return calculatorDefinitions.map(({ category, slug }) => ({ category, slug }));
}
export default async function Page({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const definition = getCalculatorByCategoryAndSlug(category, slug);
  if (!definition) notFound();
  return <CalculatorPage definition={definition}><CalculatorClient slug={definition.slug} /></CalculatorPage>;
}
~~~

Use the category registry in breadcrumb/banner labels. CategoryPage renders one H1, category description, and semantic calculator links.

- [ ] **Step 4: Run static-route verification**

Run: pnpm test tests/unit/category-route.test.tsx && pnpm test:e2e -- tests/e2e/calculators.spec.ts

Expected: existing nine pages are 200, category mismatch is 404, and no calculation request is sent.

- [ ] **Step 5: Commit**

~~~bash
git add 'app/(site)' components/content/CategoryPage.tsx components/calculator/CalculatorPage.tsx tests/unit/category-route.test.tsx tests/e2e/calculators.spec.ts
git commit -m "feat: use generic static calculator routes"
~~~

### Task 3: Catalogue discovery on home and category hubs

**Files:**
- Create: components/content/CalculatorDirectory.tsx
- Modify: app/page.tsx
- Modify: app/globals.css
- Test: tests/component/CalculatorDirectory.test.tsx
- Test: tests/e2e/home.spec.ts

**Interfaces:**
- CalculatorDirectory({ calculators, categories }) provides category navigation and a client-side title/description filter.
- The filter never sends a request, modifies the URL, or stores a search term.

- [ ] **Step 1: Write a failing filter test**

~~~tsx
render(<CalculatorDirectory calculators={calculatorCatalog} categories={calculatorCategories} />);
await user.type(screen.getByRole('searchbox', { name: '계산기 검색' }), '유류');
expect(screen.getByRole('link', { name: /유류비·연비 계산기/ })).toBeVisible();
expect(screen.queryByRole('link', { name: /월 생활비 예산 계산기/ })).toBeNull();
~~~

- [ ] **Step 2: Run the component test to verify it fails**

Run: pnpm test tests/component/CalculatorDirectory.test.tsx

Expected: FAIL because no directory component/searchbox exists.

- [ ] **Step 3: Implement local discovery**

Render category cards from calculatorCategories, add <input type="search" aria-label="계산기 검색">, and filter case-insensitively against only calculator title and description. Render a clear empty state and do not use useSearchParams, localStorage, or any network API.

- [ ] **Step 4: Run home tests**

Run: pnpm test tests/component/CalculatorDirectory.test.tsx && pnpm test:e2e -- tests/e2e/home.spec.ts

Expected: PASS with keyboard-reachable search, category hubs, and no horizontal overflow at 375px.

- [ ] **Step 5: Commit**

~~~bash
git add components/content/CalculatorDirectory.tsx app/page.tsx app/globals.css tests/component/CalculatorDirectory.test.tsx tests/e2e/home.spec.ts
git commit -m "feat: add local calculator discovery"
~~~

### Task 4: Data-derived sitemap and release checks

**Files:**
- Modify: app/sitemap.ts
- Modify: scripts/check-calculator-catalog.mjs
- Modify: scripts/check-static-output.mjs
- Modify: tests/unit/registry.test.ts
- Modify: tests/e2e/seo.spec.ts
- Modify: docs/analytics-and-search.md
- Test: tests/unit/sitemap.test.ts

**Interfaces:**
- Sitemap output is home, policy pages, category hubs, calculator pages and receives reviewed dates from catalogue entries.
- No validator contains a fixed calculator/page total.

- [ ] **Step 1: Write a failing sitemap test**

~~~ts
const entries = sitemap();
expect(entries.some(({ url }) => url.endsWith('/salary/'))).toBe(true);
expect(entries.filter(({ url }) => url.includes('/car/')).length).toBe(getCalculatorsByCategory('car').length + 1);
~~~

- [ ] **Step 2: Run it to verify it fails**

Run: pnpm test tests/unit/sitemap.test.ts

Expected: FAIL because category hub URLs are absent.

- [ ] **Step 3: Implement derived validation**

Map calculatorCategories into hub entries in app/sitemap.ts. In scripts, compute expected calculator and category paths from registry/configuration; remove literal nine and fifteen expectations. Keep static export/no-secret/no-input-leak assertions.

- [ ] **Step 4: Run release checks**

Run: pnpm check:catalog && pnpm test tests/unit/sitemap.test.ts tests/unit/registry.test.ts && NEXT_PUBLIC_GA_MEASUREMENT_ID='' pnpm build && pnpm check:static

Expected: PASS for the catalogue currently registered at this point.

- [ ] **Step 5: Commit**

~~~bash
git add app/sitemap.ts scripts/check-calculator-catalog.mjs scripts/check-static-output.mjs tests/unit/sitemap.test.ts tests/unit/registry.test.ts tests/e2e/seo.spec.ts docs/analytics-and-search.md
git commit -m "feat: derive calculator SEO checks from catalog"
~~~

### Task 5: Deferred external-data candidate ledger

**Files:**
- Create: content/external-data-candidates.ts
- Test: tests/unit/external-data-candidates.test.ts

**Interfaces:**
- Produces externalDataCandidates with id, label, dataNeeded, candidateSource, browserEligible, reviewStatus, fallbackInput, and lastReviewed.
- The module has no client import and no fetch implementation.

- [ ] **Step 1: Write the failing ledger test**

~~~ts
expect(externalDataCandidates.map(({ id }) => id)).toEqual([
  'exchange-rate', 'fuel-price', 'ev-charging-rate', 'electricity-tariff', 'holiday-calendar', 'time-zone',
]);
expect(externalDataCandidates.every(({ reviewStatus }) => reviewStatus === 'not-reviewed')).toBe(true);
~~~

- [ ] **Step 2: Run the test to verify it fails**

Run: pnpm test tests/unit/external-data-candidates.test.ts

Expected: FAIL because the ledger does not exist.

- [ ] **Step 3: Add non-executing candidate records**

Set every record to browserEligible: false and reviewStatus: 'not-reviewed', record its manual fallback field label, and add no URL fetching code.

- [ ] **Step 4: Verify privacy rules**

Run: pnpm test tests/unit/external-data-candidates.test.ts && pnpm check:privacy

Expected: PASS; the static privacy scanner finds no new network capability.

- [ ] **Step 5: Commit**

~~~bash
git add content/external-data-candidates.ts tests/unit/external-data-candidates.test.ts
git commit -m "docs: record deferred external data candidates"
~~~
