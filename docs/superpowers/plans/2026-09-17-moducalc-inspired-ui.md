# Moducalc-Inspired Calculator UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage and all calculator pages feel like one clean, card-based calculator product while simplifying visible input guidance.

**Architecture:** Keep all static page and calculator behavior in place. Add only presentation hooks to existing shared calculator components, use the calculator category already supplied by the definition for the banner, and evolve global CSS tokens and responsive layouts. Field hints are derived at the definition layer so every calculator receives concise guidance while parser bounds remain unchanged.

**Tech Stack:** Next.js 16 App Router static export, React 19, TypeScript, CSS, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-17-moducalc-inspired-ui-design.md`

## Global Constraints

- Do not change formulas, parser limits, field labels, routes, canonical URLs, JSON-LD, analytics events, or related-calculator data.
- Do not copy Moducalc branding, text, illustrations, icons, gradients, or advertising treatment.
- Preserve browser-only calculation and the current no-storage/no-network behavior.
- Replace only visible maximum-range boilerplate. Retain validation errors for values that actually exceed `MAX_VALUE`.
- Preserve semantic headings, focus styles, 44px targets, responsive DOM order, static export, and no-overflow behavior.

---

## File Structure

- Modify: `lib/calculators/definitions.ts` — concise shared and car-specific field hint strings.
- Modify: `components/calculator/CalculatorPage.tsx` — category banner and shared visual hooks without changing metadata/content order.
- Modify: `components/calculator/CalculatorForm.tsx` — compact form guidance hook only if existing markup needs a dedicated selector.
- Modify: `components/calculator/ResultPanel.tsx` — result visual hooks only if existing markup needs a dedicated selector.
- Modify: `app/page.tsx` — home discovery markup for category sections and calculator cards.
- Modify: `app/globals.css` — original home and shared calculator visual system with responsive breakpoints.
- Modify: `tests/unit/definitions.test.ts` — visible-hint contract alongside preserved validation tests.
- Modify: `tests/component/CalculatorForm.test.tsx` — concise helper rendering without breaking accessible descriptions.
- Modify: `tests/e2e/home.spec.ts` — category cards and calculator links remain discoverable.
- Modify: `tests/e2e/calculators.spec.ts` — shared calculator banner, mobile order, and no-overflow checks.

### Task 1: Lock concise-hint behavior with tests

**Files:**
- Modify: `tests/unit/definitions.test.ts`
- Modify: `tests/component/CalculatorForm.test.tsx`
- Modify: `lib/calculators/definitions.ts`

**Interfaces:**
- Consumes: existing `CalculatorField.hint` from `lib/calculators/types.ts`.
- Produces: concise user-visible hint strings with no `최대 1,000조` text.
- Guarantees: `MAX_VALUE` parser behavior remains unchanged.

- [ ] **Step 1: Write failing definition and form tests**

```ts
it('keeps examples but does not expose the implementation maximum in visible hints', () => {
  const annualDistance = maintenance.fields.find((field) => field.name === 'annualDistanceKm');
  const insurance = maintenance.fields.find((field) => field.name === 'annualInsuranceWon');
  expect(annualDistance?.hint).toBe('예: 12,000');
  expect(insurance?.hint).toBe('원 단위 정수로 입력 · 예: 800,000');
  expect(JSON.stringify(maintenance.fields)).not.toContain('최대 1,000조');
});
```

```tsx
it('shows concise helper text without changing the labelled field description', () => {
  render(<CalculatorForm fields={[{ name: 'amount', label: '금액', unit: '원', hint: '원 단위 정수로 입력 · 예: 100,000' }]} onCalculate={() => {}} />);
  expect(screen.getByText('원 단위 정수로 입력 · 예: 100,000')).toBeVisible();
  expect(screen.getByRole('textbox', { name: '금액' })).toHaveAccessibleDescription('원 원 단위 정수로 입력 · 예: 100,000');
});
```

- [ ] **Step 2: Run focused tests and observe expected failure**

Run: `pnpm test tests/unit/definitions.test.ts tests/component/CalculatorForm.test.tsx`

Expected: FAIL because existing hints contain `최대 1,000조`.

- [ ] **Step 3: Make the smallest definition-only change**

Change `number()` default hint to `원 단위 정수로 입력`, format numeric examples with `formatNumber` or literal Korean thousands separators consistently, and replace explicit car distance/efficiency hints with example-only text. Keep `bounded()` and its max error message untouched.

- [ ] **Step 4: Re-run focused tests**

Run: `pnpm test tests/unit/definitions.test.ts tests/component/CalculatorForm.test.tsx`

Expected: PASS and no parser-boundary test regression.

- [ ] **Step 5: Commit the hint contract**

```bash
git add lib/calculators/definitions.ts tests/unit/definitions.test.ts tests/component/CalculatorForm.test.tsx
git commit -m "feat: simplify calculator input hints"
```

### Task 2: Add shared calculator category context

**Files:**
- Modify: `components/calculator/CalculatorPage.tsx`
- Modify: `tests/component/CalculatorPage.test.tsx`

**Interfaces:**
- Consumes: `CalculatorDefinition.category`, `title`, and `description`.
- Produces: `<section className="calculator-category-banner">` between the title block and interactive calculator workspace.
- Guarantees: breadcrumbs, one H1, structured data, guide, and related links stay in their current order.

- [ ] **Step 1: Write a failing category-banner test**

```tsx
it('shows the calculator category and description before the interactive workspace', () => {
  render(<CalculatorPage definition={definition} />);
  const banner = screen.getByLabelText('자동차 계산기 안내');
  expect(banner).toHaveTextContent('자동차');
  expect(banner).toHaveTextContent(definition.description);
  expect(banner.compareDocumentPosition(screen.getByLabelText('계산기 작업 영역')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
```

- [ ] **Step 2: Run the test and observe expected failure**

Run: `pnpm test tests/component/CalculatorPage.test.tsx`

Expected: FAIL because the category banner does not exist.

- [ ] **Step 3: Add semantic, content-preserving markup**

Map `car`, `finance`, and `life` to Korean category labels in `CalculatorPage` and render an aria-labelled banner after `.calculator-heading`. Do not add another heading level that competes with the page H1.

- [ ] **Step 4: Run shared calculator component tests**

Run: `pnpm test tests/component/CalculatorPage.test.tsx tests/component/CalculatorForm.test.tsx tests/component/ResultPanel.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit shared category context**

```bash
git add components/calculator/CalculatorPage.tsx tests/component/CalculatorPage.test.tsx
git commit -m "feat: add calculator category context"
```

### Task 3: Rebuild home discovery markup before styling

**Files:**
- Modify: `app/page.tsx`
- Modify: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `calculatorCatalog` and current category IDs/routes.
- Produces: category sections containing accessible calculator cards with existing anchor hrefs.
- Guarantees: a single H1 and every calculator link remains visible and reachable without client-side filtering.

- [ ] **Step 1: Write failing home journey assertions**

```ts
test('home groups every calculator into visible category cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home-calculator-card')).toHaveCount(9);
  await expect(page.locator('#car .home-calculator-card')).toHaveCount(5);
  await expect(page.locator('#finance .home-calculator-card')).toHaveCount(3);
  await expect(page.locator('#life .home-calculator-card')).toHaveCount(1);
});
```

- [ ] **Step 2: Run the home test and observe expected failure**

Run: `pnpm test:e2e -- tests/e2e/home.spec.ts --grep "visible category cards"`

Expected: FAIL because `.home-calculator-card` does not exist.

- [ ] **Step 3: Add original discovery markup**

Keep `categories` as the source of category copy. Wrap each existing route link in an `<a className="home-calculator-card">` containing title, short existing description when available from the registry, and an `aria-hidden` arrow. Preserve category IDs and nav hrefs exactly.

- [ ] **Step 4: Re-run home tests**

Run: `pnpm test:e2e -- tests/e2e/home.spec.ts`

Expected: PASS with current headings and routes.

- [ ] **Step 5: Commit home markup**

```bash
git add app/page.tsx tests/e2e/home.spec.ts
git commit -m "feat: improve calculator discovery on home"
```

### Task 4: Apply the shared visual system and responsive layouts

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/e2e/calculators.spec.ts`

**Interfaces:**
- Consumes: existing site, home, calculator, form, result, guide, and banner class names.
- Produces: compact header, original home cards, blue calculator context banner, two-column desktop workspace, and single-column mobile workspace.
- Guarantees: form/result DOM order, sticky result behavior on wide screens, focus visibility, and no horizontal overflow.

- [ ] **Step 1: Write failing desktop and mobile layout checks**

```ts
test('all calculators show an original category banner and maintain form-first mobile order', async ({ page, isMobile }) => {
  await page.goto('/finance/compound-interest/');
  await expect(page.locator('.calculator-category-banner')).toBeVisible();
  if (isMobile) {
    const form = await page.locator('.calculator-form').boundingBox();
    const result = await page.locator('.result-panel').boundingBox();
    expect(form && result && form.y < result.y).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
```

- [ ] **Step 2: Run the focused browser check and observe expected failure**

Run: `pnpm test:e2e -- tests/e2e/calculators.spec.ts --grep "original category banner"`

Expected: FAIL before Task 2/4 classes and styles are in place.

- [ ] **Step 3: Implement CSS without altering behavior**

Retain existing tokens and add a small token set for navy, blue tint, muted blue, and card shadow. Restyle the header to be compact and white; rewrite home rules around `.home-*` classes; add `.calculator-category-banner`; tune card padding, field borders, results, and guides; and preserve current breakpoint behavior. Use a three/two/one-column home grid and retain one-column calculator layout below 52rem.

- [ ] **Step 4: Run responsive end-to-end checks**

Run: `pnpm test:e2e -- tests/e2e/home.spec.ts tests/e2e/calculators.spec.ts`

Expected: PASS across desktop/mobile projects; no horizontal overflow and all calculations remain local.

- [ ] **Step 5: Commit the visual system**

```bash
git add app/globals.css tests/e2e/calculators.spec.ts
git commit -m "style: unify calculator and home experience"
```

### Task 5: Validate SEO and static delivery

**Files:**
- Modify: none unless a failing verification exposes a direct regression.

**Interfaces:**
- Consumes: current `pageMetadata`, `JsonLd`, `sitemap`, and static export configuration.
- Produces: evidence that visual changes preserve SEO and deployment output.

- [ ] **Step 1: Run source and component checks**

Run: `pnpm lint && pnpm test && pnpm check:catalog && pnpm check:privacy`

Expected: PASS.

- [ ] **Step 2: Build static output and run static checks**

Run: `pnpm build && pnpm check:static`

Expected: PASS; every calculator route emits static HTML.

- [ ] **Step 3: Inspect SEO output**

Run: `pnpm test:e2e -- tests/e2e/seo.spec.ts`

Expected: PASS; canonical tags, titles, descriptions, JSON-LD, sitemap, and robots remain correct.

- [ ] **Step 4: Commit only if verification required a source correction**

```bash
git add <corrected-files>
git commit -m "fix: preserve calculator SEO metadata"
```

## Plan Self-Review

- Spec coverage: Task 1 implements concise hints with validation retained. Tasks 2 and 4 cover every shared calculator surface. Tasks 3 and 4 cover homepage structure and responsive card discovery. Task 5 protects the live SEO and static-output contract.
- Placeholder scan: no TBD/TODO markers or unnamed implementation actions remain.
- Type consistency: all task references use current `CalculatorDefinition`, `CalculatorField.hint`, shared component classes, and existing test runners.
