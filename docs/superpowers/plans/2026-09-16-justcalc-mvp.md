# 바로계산기 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `bongworks/justcalc` 공개 저장소에 자동차·대출·생활비 9개 계산기를 정확한 산식, 접근 가능한 UI, 정적 SEO 기반으로 제공한다.

**Architecture:** Next.js App Router가 모든 공개 콘텐츠와 메타데이터를 정적으로 렌더링한다. 계산 로직은 UI·라우팅과 분리된 십진 정밀도 순수 함수로 구현하고, 계산기별 등록 정보가 입력 폼·콘텐츠·관련 링크·SEO를 구동한다. 사용자 입력은 클라이언트 메모리에만 존재하며 서버 액션, API 라우트, URL 파라미터, 분석 이벤트로 보내지 않는다.

**Tech Stack:** Node.js LTS, pnpm, Next.js App Router, React, TypeScript strict mode, Tailwind CSS, decimal.js, Zod, Vitest, Testing Library, Playwright, ESLint.

**Spec:** `docs/superpowers/specs/2026-09-16-life-car-loan-calculators-design.md`

## Global Constraints

- 서비스명은 `바로계산기`, 원격 저장소는 공개 `bongworks/justcalc`이다.
- P0에는 데이터베이스, 로그인, 외부 자동차·금융 API, 서버 저장, URL 입력값, 자동 광고를 넣지 않는다.
- 계산값·금리·거리·수입·비용은 서버 로그, API 요청, 분석 이벤트, 광고 요청에 포함하지 않는다.
- 모든 공개 페이지는 초기 HTML에 제목·설명·공식·한계·출처·검토일·canonical·JSON-LD를 포함한다.
- 금액은 원화 정수로 표시하고, 중간 계산은 `Decimal`로 수행한다.
- 금융·자동차 결과는 참고용이며 실제 계약·청구액과 다를 수 있음을 결과 가까이에 표시한다.
- 광고 컴포넌트는 만들지 않는다. 광고 도입은 광고 없는 제한 출시와 성능 기준선 수집 이후의 별도 작업이다.
- 접근성 기준은 16px 이상 본문, 4.5:1 이상 대비, 44px 이상 터치 대상, 키보드 완전 조작, visible focus, reduced motion 지원이다.
- 성능 목표는 실제 사용자 p75 기준 LCP 2.5초 이하, INP 200ms 이하, CLS 0.1 이하이다.
- 사용자·에이전트가 만든 기존 `.gstack/` 파일은 수정·추가·커밋하지 않는다.

## Planned File Structure

```text
justcalc/
├── .github/workflows/ci.yml
├── app/
│   ├── (site)/
│   │   ├── page.tsx
│   │   ├── car/[slug]/page.tsx
│   │   ├── finance/[slug]/page.tsx
│   │   └── life/[slug]/page.tsx
│   ├── about/page.tsx
│   ├── editorial-policy/page.tsx
│   ├── contact/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── layout.tsx
│   ├── robots.ts
│   ├── sitemap.ts
│   └── globals.css
├── components/
│   ├── calculator/CalculatorPage.tsx
│   ├── calculator/CalculatorForm.tsx
│   ├── calculator/ResultPanel.tsx
│   ├── calculator/RepaymentTable.tsx
│   ├── content/CalculatorGuide.tsx
│   ├── content/RelatedCalculators.tsx
│   ├── seo/JsonLd.tsx
│   └── site/{Header,Footer,Breadcrumbs}.tsx
├── content/calculators.ts
├── lib/
│   ├── calculators/{types,registry,validation,format}.ts
│   ├── calculators/definitions.ts
│   ├── finance/{loan,compound}.ts
│   ├── car/{maintenance,fuel,ev,purchase}.ts
│   └── life/budget.ts
├── public/{favicon.svg,og-default.png}
├── tests/
│   ├── unit/{finance,car,life,registry}.test.ts
│   ├── component/{CalculatorForm,ResultPanel,CalculatorPage}.test.tsx
│   └── e2e/{home,calculators,seo}.spec.ts
├── package.json
├── next.config.ts
├── playwright.config.ts
├── vitest.config.ts
├── README.md
└── LICENSE
```

## Task 1: Create the public repository and reproducible Next.js foundation

**Files:**

- Create: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `playwright.config.ts`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `public/favicon.svg`, `public/og-default.png`
- Create: `.gitignore`, `.npmrc`, `README.md`, `LICENSE`, `.github/workflows/ci.yml`
- Create: `tests/e2e/home.spec.ts`

**Interfaces:**

- Produces `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` commands used by all later tasks.
- Produces the `SiteLayout` root with `lang="ko"`, static page shell, skip link, header, main landmark, and footer.

- [ ] **Step 1: Create or verify the public GitHub repository without touching `.gstack/`**

Run, after confirming GitHub authentication is available without printing credentials:

```bash
curl --fail-with-body \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/bongworks/justcalc
```

If it returns 404, create it with:

```bash
curl --fail-with-body \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/orgs/bongworks/repos \
  -d '{"name":"justcalc","description":"바로계산기 - 생활비, 자동차, 대출 비용 계산기","private":false,"has_issues":true,"has_projects":false,"has_wiki":false}'
```

Then set the remote once:

```bash
git remote add origin https://github.com/bongworks/justcalc.git
```

Expected: GitHub returns repository metadata with `private: false`; do not print credential-helper output.

- [ ] **Step 2: Scaffold a failing page smoke test**

Create `tests/e2e/home.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('홈에서 바로계산기와 자동차 계산기 진입점을 보여준다', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/바로계산기/);
  await expect(page.getByRole('heading', { level: 1, name: /차를 사고 유지하고/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /자동차 유지비 계산기/ })).toBeVisible();
});
```

- [ ] **Step 3: Initialize the app and install the exact runtime categories**

Run:

```bash
corepack enable
pnpm create next-app@latest /tmp/justcalc-scaffold --ts --tailwind --eslint --app --src-dir false --import-alias '@/*' --use-pnpm --yes
rsync -a --exclude '.git' --exclude 'docs' --exclude '.gstack' /tmp/justcalc-scaffold/ ./
pnpm add decimal.js zod
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
pnpm exec playwright install --with-deps chromium
```

Then configure package scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

- [ ] **Step 4: Implement the minimal accessible site shell and homepage**

`app/layout.tsx` must render this structure:

```tsx
<html lang="ko">
  <body>
    <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
    <header>바로계산기</header>
    <main id="main-content">{children}</main>
    <footer>계산 결과는 참고용입니다.</footer>
  </body>
</html>
```

`app/page.tsx` must use only static content and link to the nine P0 routes. The first screen contains the product statement, three category links, and no advertisement or popup.

- [ ] **Step 5: Configure unit and browser tests**

Create `vitest.config.ts` with the React plugin, `jsdom` environment, and `tests/**/*.test.{ts,tsx}` inclusion. Create `playwright.config.ts` with `baseURL: 'http://127.0.0.1:3000'`, a `next dev` web server, Chromium desktop project, and a 375px mobile Chromium project.

- [ ] **Step 6: Run foundation verification**

Run:

```bash
pnpm lint
pnpm test
pnpm build
pnpm test:e2e -- tests/e2e/home.spec.ts
```

Expected: all commands exit 0; homepage has a Korean title, H1, and visible automobile calculator link.

- [ ] **Step 7: Add a CI workflow and commit the foundation**

`ci.yml` runs checkout, Node LTS setup with pnpm cache, `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, and `pnpm build` for pushes and pull requests.

Run:

```bash
git add . ':!.gstack'
git commit -m "feat: bootstrap 바로계산기 site"
git push -u origin main
```

Expected: public `bongworks/justcalc` has the first pushed commit and CI begins.

### Task 2: Implement shared precision, validation, and calculator registry

**Files:**

- Create: `lib/calculators/types.ts`, `lib/calculators/validation.ts`, `lib/calculators/format.ts`, `lib/calculators/registry.ts`
- Create: `content/calculators.ts`
- Create: `tests/unit/registry.test.ts`, `tests/unit/validation.test.ts`

**Interfaces:**

- Produces `CalculatorCatalogEntry` with `slug`, `category`, `route`, `title`, `description`, `guide`, `relatedSlugs`, and `lastReviewed`; Task 6 extends it into `CalculatorDefinition<I, O>` with form parsing and calculation behavior.
- Produces `parseMoney`, `parsePositiveDecimal`, `parseNonNegativeDecimal`, `formatWon`, `formatNumber`, and `formatPercent`.
- Produces static catalog information only; it does not import calculator engines before Tasks 3 and 4 are complete.

- [ ] **Step 1: Write registry and decimal-boundary tests**

Create `tests/unit/validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parsePositiveDecimal } from '@/lib/calculators/validation';

describe('parsePositiveDecimal', () => {
  it('accepts a Korean-formatted numeric string after commas are removed', () => {
    expect(parsePositiveDecimal('12,345.67').toString()).toBe('12345.67');
  });

  it('rejects zero, negative values, and empty input', () => {
    expect(() => parsePositiveDecimal('0')).toThrow();
    expect(() => parsePositiveDecimal('-1')).toThrow();
    expect(() => parsePositiveDecimal('')).toThrow();
  });
});
```

Create `tests/unit/registry.test.ts` asserting nine unique routes, no duplicate slugs, every related slug exists, and every P0 page has title, guide, sources, and review date.

- [ ] **Step 2: Run tests to verify the expected missing-module failure**

Run:

```bash
pnpm test -- tests/unit/validation.test.ts tests/unit/registry.test.ts
```

Expected: FAIL because validation and registry modules do not exist.

- [ ] **Step 3: Implement shared types and decimal parsing**

Create `lib/calculators/types.ts` with these interfaces:

```ts
export type CalculatorCategory = 'car' | 'finance' | 'life';

export interface CalculatorGuide {
  formula: string;
  examples: ReadonlyArray<{ title: string; text: string }>;
  limitations: ReadonlyArray<string>;
  sources: ReadonlyArray<{ label: string; href: string }>;
}

export interface CalculatorCatalogEntry {
  slug: string;
  category: CalculatorCategory;
  route: string;
  title: string;
  description: string;
  lastReviewed: string;
  relatedSlugs: ReadonlyArray<string>;
  guide: CalculatorGuide;
}

export interface CalculatorDefinition<I, O> extends CalculatorCatalogEntry {
  parse: (raw: Record<string, string>) => I;
  calculate: (input: I) => O;
}
```

In `validation.ts`, strip commas and whitespace, construct `new Decimal(normalized)`, and reject non-finite, zero-or-negative, and non-integer money inputs according to the named function. Never convert through JavaScript `number` before constructing Decimal.

- [ ] **Step 4: Implement display formatting and the catalog record contract**

`formatWon(value)` returns `₩` plus Korean-locale grouped whole won after a single defined round-half-up operation. `formatNumber(value, decimalPlaces)` returns grouped Korean-locale digits without scientific notation. `formatPercent(value)` returns a decimal percentage string with the `%` suffix.

In `content/calculators.ts`, define all nine catalog records with their exact routes from the spec, Korean title/description, source links, review date, related slugs, formula explanation, examples, limitations, and no keyword-stuffed duplicate prose. Do not import calculator engines in this task; Task 6 adds behavioral definitions after all engines exist.

- [ ] **Step 5: Run tests and type checking**

Run:

```bash
pnpm test -- tests/unit/validation.test.ts tests/unit/registry.test.ts
pnpm lint
pnpm build
```

Expected: all pass; a failed parse remains a field validation error and does not create `NaN` output.

- [ ] **Step 6: Commit the shared domain layer**

Run:

```bash
git add lib/calculators content/calculators.ts tests/unit/validation.test.ts tests/unit/registry.test.ts
git commit -m "feat: add calculator registry and validation"
```

### Task 3: Implement automobile calculation engines and regression tests

**Files:**

- Create: `lib/car/fuel.ts`, `lib/car/ev.ts`, `lib/car/maintenance.ts`, `lib/car/purchase.ts`
- Create: `lib/finance/loan.ts`
- Create: `tests/unit/car/fuel.test.ts`, `tests/unit/car/ev.test.ts`, `tests/unit/car/maintenance.test.ts`, `tests/unit/car/purchase.test.ts`
- Create: `tests/unit/finance/equal-payment.test.ts`

**Interfaces:**

- Consumes Decimal parsing helpers from Task 2.
- Produces `calculateFuelCost`, `calculateEvChargingCost`, `calculateMaintenanceCost`, `calculatePurchaseCost`, and `calculateEqualPaymentLoan`.
- Produces objects composed only of `Decimal`, strings, and named item rows; UI rounds only via Task 2 formatters.

- [ ] **Step 1: Write fuel and EV calculation tests**

Create `tests/unit/car/fuel.test.ts`:

```ts
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateFuelCost } from '@/lib/car/fuel';

describe('calculateFuelCost', () => {
  it('calculates fuel litres, total cost, and cost per km without float drift', () => {
    const result = calculateFuelCost({
      distanceKm: new Decimal('420'),
      efficiencyKmPerLitre: new Decimal('14'),
      wonPerLitre: new Decimal('1700'),
    });
    expect(result.litres.toString()).toBe('30');
    expect(result.totalWon.toString()).toBe('51000');
    expect(result.wonPerKm.toString()).toBe('121.42857142857142857143');
  });
});
```

Create equivalent EV tests using 240km, 6km/kWh, and 300 won/kWh, asserting 40kWh and 12,000 won. Include invalid zero-efficiency parser tests.

- [ ] **Step 2: Write maintenance and purchase cost tests**

Test that maintenance sums fuel/charging, insurance, tax, maintenance, and other cost; derives monthly and per-km cost; and switches exactly one energy row based on `powertrain: 'ice' | 'ev'`.

Test vehicle purchase cost with vehicle price 30,000,000, optional cost 1,000,000, cash 5,000,000, financed principal 20,000,000, 6% annual rate, 60 months. Assert funding gap 6,000,000 and a positive instalment interest result. Also assert an overfunded case reports a negative funding gap rather than hiding it.

Create `tests/unit/finance/equal-payment.test.ts` asserting that `calculateEqualPaymentLoan` returns a 12-row schedule for 12,000,000 won at 6% for 12 months, the final balance is zero, and the 0% case pays exactly one twelfth of the principal each month.

- [ ] **Step 3: Run automobile engine tests to verify the expected failure**

Run:

```bash
pnpm test -- tests/unit/car tests/unit/finance/equal-payment.test.ts
```

Expected: FAIL because the automobile modules and equal-payment loan helper are absent.

- [ ] **Step 4: Implement the four pure automobile functions**

Use these contracts:

```ts
export function calculateFuelCost(input: FuelCostInput): FuelCostResult;
export function calculateEvChargingCost(input: EvChargingInput): EvChargingResult;
export function calculateMaintenanceCost(input: MaintenanceInput): MaintenanceResult;
export function calculatePurchaseCost(input: PurchaseCostInput): PurchaseCostResult;
```

For all four functions, use `Decimal.div`, `Decimal.mul`, and `Decimal.add`; do not use `Number`, `Math.round`, or browser APIs. Implement `calculateEqualPaymentLoan` in `lib/finance/loan.ts` before importing it into `calculatePurchaseCost`; it returns a full equal-payment schedule with the final-row principal set to the exact remaining balance.

- [ ] **Step 5: Run automobile tests**

Run:

```bash
pnpm test -- tests/unit/car tests/unit/finance/equal-payment.test.ts
pnpm lint
```

Expected: all calculation totals, per-unit values, and funding-gap signs match tests.

- [ ] **Step 6: Commit automobile calculation engines**

Run:

```bash
git add lib/car lib/finance/loan.ts tests/unit/car tests/unit/finance/equal-payment.test.ts
git commit -m "feat: add automobile cost calculations"
```

### Task 4: Implement finance and household engines with amortization-table invariants

**Files:**

- Modify: `lib/finance/loan.ts`
- Create: `lib/finance/compound.ts`, `lib/life/budget.ts`
- Create: `tests/unit/finance/loan.test.ts`, `tests/unit/finance/compound.test.ts`, `tests/unit/life/budget.test.ts`

**Interfaces:**

- Produces `calculateSimpleInterest`, `calculateRepaymentPlans`, `calculateEqualPaymentLoan`, `calculateCompoundSavings`, and `calculateMonthlyBudget`.
- `calculateRepaymentPlans` returns `{ equalPayment, equalPrincipal, bullet }`, each with `rows`, `totalInterest`, `totalPaid`, and named representative payment values.
- `calculateEqualPaymentLoan` from Task 3 is reused by `calculateRepaymentPlans` and the vehicle purchase calculation.

- [ ] **Step 1: Write loan repayment regression tests**

Create `tests/unit/finance/loan.test.ts`:

```ts
import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { calculateRepaymentPlans } from '@/lib/finance/loan';

describe('calculateRepaymentPlans', () => {
  it('ends every plan with zero remaining principal', () => {
    const result = calculateRepaymentPlans({
      principal: new Decimal('12000000'),
      annualRatePercent: new Decimal('6'),
      months: 12,
    });
    expect(result.equalPayment.rows.at(-1)?.balance.toString()).toBe('0');
    expect(result.equalPrincipal.rows.at(-1)?.balance.toString()).toBe('0');
    expect(result.bullet.rows.at(-1)?.balance.toString()).toBe('0');
  });

  it('uses a principal-only division for zero-percent equal payments', () => {
    const result = calculateRepaymentPlans({
      principal: new Decimal('1200'),
      annualRatePercent: new Decimal('0'),
      months: 12,
    });
    expect(result.equalPayment.rows[0]?.payment.toString()).toBe('100');
    expect(result.equalPayment.totalInterest.toString()).toBe('0');
  });
});
```

Add assertions that sum of every row's principal equals original principal, total paid equals principal plus total interest, bullet-plan final payment includes entire principal, and simple interest uses the selected 365 or 366 day denominator.

- [ ] **Step 2: Write compound savings and budget tests**

For compound savings, assert the following independently:

- initial principal 1,000,000, monthly contribution 100,000, annual rate 0%, 12 months results in 2,200,000 total paid, zero interest, and 2,200,000 maturity amount;
- monthly rows have monotonically non-decreasing balance for non-negative inputs;
- user-entered tax rate is optional and absent means only pre-tax output.

For budget, assert total spending, spending ratio, remaining after target savings, and category rows from an input with 3,000,000 income, 1,000,000 housing, 300,000 car, 500,000 food, 100,000 communications, 100,000 health, 200,000 other fixed, 300,000 variable, 500,000 savings target.

- [ ] **Step 3: Run finance tests to verify failure**

Run:

```bash
pnpm test -- tests/unit/finance tests/unit/life
```

Expected: FAIL because compound savings and budget modules do not exist and `calculateRepaymentPlans` has not yet been exported from the existing loan module.

- [ ] **Step 4: Implement the loan engines**

Use this row contract:

```ts
export interface RepaymentRow {
  month: number;
  payment: Decimal;
  principal: Decimal;
  interest: Decimal;
  balance: Decimal;
}
```

Calculate each row using the unrounded Decimal balance. In the final row, set principal to the exact remaining balance so a harmless display-rounding difference never leaves a residual balance. For the equal-payment formula, branch at zero monthly rate before using the denominator `(1 + r)^n - 1`.

- [ ] **Step 5: Implement compound savings and budget engines**

For monthly contribution timing, define and document that the contribution is deposited at the end of each month. Apply one month of interest to the opening balance, then add that month's contribution. Return pre-tax result always, and return after-tax result only when `taxRatePercent` is supplied.

For budget, return category rows with exact cost and ratio of total expense. If total expenses are zero, return zero ratios rather than dividing by zero.

- [ ] **Step 6: Run finance and full engine verification**

Run:

```bash
pnpm test -- tests/unit/finance tests/unit/life tests/unit/car
pnpm lint
pnpm build
```

Expected: every amortization table closes at zero, zero-rate cases pass, and Task 3 reuses finance logic.

- [ ] **Step 7: Commit finance and household engines**

Run:

```bash
git add lib/finance lib/life tests/unit/finance tests/unit/life
git commit -m "feat: add loan savings and budget calculations"
```

### Task 5: Build the reusable accessible calculator UI

**Files:**

- Create: `components/calculator/CalculatorPage.tsx`, `components/calculator/CalculatorForm.tsx`, `components/calculator/ResultPanel.tsx`, `components/calculator/RepaymentTable.tsx`
- Create: `components/content/CalculatorGuide.tsx`, `components/content/RelatedCalculators.tsx`
- Create: `components/site/Header.tsx`, `components/site/Footer.tsx`, `components/site/Breadcrumbs.tsx`
- Create: `tests/component/CalculatorForm.test.tsx`, `tests/component/ResultPanel.test.tsx`, `tests/component/CalculatorPage.test.tsx`

**Interfaces:**

- Consumes the generic `CalculatorDefinition<I, O>` type from Task 2 and calculator results from Tasks 3–4; Task 6 supplies complete route definitions.
- Produces a client-only `CalculatorForm` which receives `onCalculate(raw: Record<string, string>): void` and never calls `fetch`, server actions, or route navigation.
- Produces a server-rendered `CalculatorGuide` and `RelatedCalculators` section.

- [ ] **Step 1: Write form accessibility and privacy tests**

Create `tests/component/CalculatorForm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { CalculatorForm } from '@/components/calculator/CalculatorForm';

it('labels a numeric field, validates it near the field, and submits no URL data', async () => {
  const onCalculate = vi.fn();
  const user = userEvent.setup();
  render(<CalculatorForm fields={[{ name: 'distanceKm', label: '주행거리', unit: 'km', required: true }]} onCalculate={onCalculate} />);
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(screen.getByText('주행거리를 입력해 주세요.')).toBeVisible();
  expect(onCalculate).not.toHaveBeenCalled();
});
```

Add a test that result summary has `aria-live="polite"`, that one result text appears once in the accessibility-facing DOM, and that reset clears client state.

- [ ] **Step 2: Run component tests to verify failure**

Run:

```bash
pnpm test -- tests/component
```

Expected: FAIL because shared components do not exist.

- [ ] **Step 3: Implement form fields and error behavior**

Render a semantic `<form noValidate>`, real `<label htmlFor>`, `<input inputMode="decimal">`, visible unit text, inline field errors, and submit/reset `<button>` elements. Maintain raw strings in client state, parse only in submit handling, and never serialize values to pathname, search parameters, local storage, or an event payload.

- [ ] **Step 4: Implement results, guides, and related links**

`ResultPanel` renders only after successful client calculation. It presents a concise summary first, detailed rows or table second, copy button third, then a separate static disclaimer. The copy text contains output labels and the reference warning, but the URL remains the base route.

`CalculatorGuide` renders the formula, two or more concrete examples, limitations, sources, and `lastReviewed`. `RelatedCalculators` resolves only valid registry slugs, limits output to four, and uses descriptive link text.

- [ ] **Step 5: Implement responsive base styles without generic AI decoration**

In `app/globals.css`, use a light neutral background, one reserved blue action color, modest borders, readable Korean typography, explicit focus rings, and spacing based on 4px increments. Do not add gradients, glass panels, hero illustrations, auto-rotating carousels, emoji icons, or marketing popups. At 375px, inputs stack vertically and result tables scroll only inside a labelled horizontal wrapper.

- [ ] **Step 6: Run component and browser smoke tests**

Run:

```bash
pnpm test -- tests/component
pnpm test:e2e -- tests/e2e/home.spec.ts
pnpm lint
```

Expected: form errors are local and labelled; result announcements are not duplicated; shell works with keyboard.

- [ ] **Step 7: Commit shared UI**

Run:

```bash
git add components app/globals.css tests/component
git commit -m "feat: add accessible calculator interface"
```

### Task 6: Register and publish all nine calculator pages

**Files:**

- Create: `app/(site)/car/[slug]/page.tsx`, `app/(site)/finance/[slug]/page.tsx`, `app/(site)/life/[slug]/page.tsx`
- Create: `lib/calculators/definitions.ts`
- Modify: `lib/calculators/registry.ts`, `app/page.tsx`
- Create: `tests/e2e/calculators.spec.ts`

**Interfaces:**

- Consumes registry definitions and shared UI from Tasks 2–5.
- Produces nine static routes and `generateStaticParams` from the registry.
- Produces no API route, server action, or dynamic financial-data fetch.

- [ ] **Step 1: Write end-to-end calculator journeys**

Create `tests/e2e/calculators.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('유류비 계산기가 브라우저에서 비용을 계산하고 URL에 입력값을 남기지 않는다', async ({ page }) => {
  await page.goto('/car/fuel-cost/');
  await page.getByLabel('주행거리').fill('420');
  await page.getByLabel('연비').fill('14');
  await page.getByLabel('유종 단가').fill('1700');
  await page.getByRole('button', { name: '계산하기' }).click();
  await expect(page.getByText('예상 유류비')).toBeVisible();
  await expect(page.getByText('₩51,000')).toBeVisible();
  await expect(page).toHaveURL('/car/fuel-cost/');
});
```

Add journeys for loan repayment comparison: fill 12,000,000 won, 6%, 12 months; assert all three plan names, no `NaN`, and a final balance of 0 in every table. Add a mobile-project journey confirming the calculate button remains visible and no horizontal page scroll occurs.

- [ ] **Step 2: Run e2e tests to verify missing route failure**

Run:

```bash
pnpm test:e2e -- tests/e2e/calculators.spec.ts
```

Expected: FAIL because the calculator routes do not exist.

- [ ] **Step 3: Implement category route factories**

Each dynamic route filters definitions by category and calls `notFound()` for wrong category/slug combinations. Implement `generateStaticParams`, `generateMetadata`, and the page component as follows:

```tsx
export async function generateStaticParams() {
  return getCalculatorsByCategory('car').map(({ slug }) => ({ slug }));
}

export default function CarCalculatorPage({ params }: { params: { slug: string } }) {
  const definition = getCalculatorByCategoryAndSlug('car', params.slug);
  if (!definition) notFound();
  return <CalculatorPage definition={definition} />;
}
```

Adapt only the category literal per route; do not duplicate calculator content or formulas in page files.

- [ ] **Step 4: Add complete calculator definitions and field descriptors**

For each P0 route, create the `CalculatorDefinition` in `lib/calculators/definitions.ts` by combining its Task 2 catalog entry with exact field labels from the spec, realistic non-sensitive example values, input constraints, result summary fields, detail rows, and the corresponding pure calculation function. The registry must expose complete definitions only after this wiring.

For the three repayment modes, use one `자동차 할부` page whose mode selector updates its results. The `대출 상환 방식 비교` page always renders all three plans.

- [ ] **Step 5: Run all calculator journeys and static build**

Run:

```bash
pnpm test:e2e -- tests/e2e/calculators.spec.ts
pnpm test
pnpm build
```

Expected: all nine paths are generated, every form calculates without a network request, and URLs never gain calculation values.

- [ ] **Step 6: Commit P0 calculator pages**

Run:

```bash
git add app/'(site)' lib/calculators/definitions.ts lib/calculators/registry.ts app/page.tsx tests/e2e/calculators.spec.ts
git commit -m "feat: publish P0 calculator pages"
```

### Task 7: Add public trust, policy, and SEO assets

**Files:**

- Create: `components/seo/JsonLd.tsx`
- Create: `app/robots.ts`, `app/sitemap.ts`
- Create: `app/about/page.tsx`, `app/editorial-policy/page.tsx`, `app/contact/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`
- Modify: `app/layout.tsx`, `components/site/Footer.tsx`
- Create: `tests/e2e/seo.spec.ts`

**Interfaces:**

- Consumes calculator registry route/title/review metadata.
- Produces valid `WebSite`, `WebPage`, and `BreadcrumbList` JSON-LD that matches rendered text.
- Produces a sitemap containing exactly the homepage, static policy pages, and all nine calculator routes.

- [ ] **Step 1: Write SEO and trust-page checks**

Create `tests/e2e/seo.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('대출 상환 방식 페이지 emits canonical and visible review information', async ({ page }) => {
  await page.goto('/finance/loan-repayment/');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.getByText('마지막 검토일')).toBeVisible();
  await expect(page.getByText('참고용 계산')).toBeVisible();
});

test('robots and sitemap list public calculator URLs', async ({ page }) => {
  await page.goto('/robots.txt');
  await expect(page.getByText('Sitemap:')).toBeVisible();
  await page.goto('/sitemap.xml');
  await expect(page.getByText('/car/maintenance-cost/')).toBeVisible();
});
```

Add a test that privacy page explicitly says calculation inputs are neither transmitted nor stored, while describing analytics/cookie handling separately; add a test that footer links all five policy pages.

- [ ] **Step 2: Run SEO tests to verify expected failure**

Run:

```bash
pnpm test:e2e -- tests/e2e/seo.spec.ts
```

Expected: FAIL because policy pages and metadata routes do not exist.

- [ ] **Step 3: Implement metadata and structured data**

Set `metadataBase` only after a real domain exists. Before then, generate relative canonical paths in the test environment and make deployment require `NEXT_PUBLIC_SITE_URL` to be a valid HTTPS URL. Use `WebSite`, `WebPage`, and `BreadcrumbList`; do not use FAQPage or HowTo markup for rich-result claims.

`JsonLd` must escape JSON safely and receive only data shown in the page. It must never include calculator form values.

- [ ] **Step 4: Implement policy and trust pages with actual scope statements**

Write Korean pages covering: purpose; editorial policy and correction process; privacy separation between calculation input handling and third-party analytics/advertising; and terms declaring results as informational, not financial or legal advice. The contact page must state that the service is not yet ready for public operation until the owner supplies a genuine contact channel and operating identity; it must not fabricate either value.

Until a real contact email and legal operator details are supplied, do not deploy the production policy pages or apply for AdSense. This is a release gate, not a value to invent in code.

- [ ] **Step 5: Implement robots and sitemap**

`robots.ts` allows public crawling and points to `/sitemap.xml`. `sitemap.ts` builds only public, canonical routes from registry and excludes query variants. Add no ad or tracking scripts.

- [ ] **Step 6: Run SEO verification**

Run:

```bash
pnpm test:e2e -- tests/e2e/seo.spec.ts
pnpm build
```

Expected: every P0 route has a single canonical, visible review context, matching JSON-LD, and sitemap entry.

- [ ] **Step 7: Commit trust and SEO assets**

Run:

```bash
git add app components/seo components/site/Footer.tsx tests/e2e/seo.spec.ts
git commit -m "feat: add trust pages and technical SEO"
```

### Task 8: Validate quality, performance budgets, and public delivery readiness

**Files:**

- Create: `scripts/check-calculator-catalog.mjs`
- Create: `scripts/check-no-input-leak.mjs`
- Create: `lib/calculators/catalog.ts`
- Modify: `package.json`, `.github/workflows/ci.yml`, `README.md`
- Create: `docs/release-checklist.md`

**Interfaces:**

- Consumes catalog data and built HTML route list.
- Produces non-zero exits for duplicate routes, missing guide fields, invalid related links, absent review dates, input-like URL parameters, and noindex/canonical failures.

- [ ] **Step 1: Write quality-gate script tests as fixture checks**

Create fixture catalog objects in `tests/unit/registry.test.ts` that omit a source, repeat a route, and reference an unknown related slug. Assert `validateCalculatorCatalog` returns specific errors for each fixture.

- [ ] **Step 2: Run the quality-gate test to verify failure before implementation**

Run:

```bash
pnpm test -- tests/unit/registry.test.ts
```

Expected: FAIL while the catalog validator module is absent.

- [ ] **Step 3: Implement catalog and privacy-leak checks**

`lib/calculators/catalog.ts` exports `validateCalculatorCatalog(definitions): string[]` and validates nine P0 records, unique route/slug/title, at least two examples, at least one source, review date in ISO form, limitation text, and related slugs resolving to existing records. `check-calculator-catalog.mjs` imports that function, prints each returned error to stderr, and exits 1 if any error exists.

`check-no-input-leak.mjs` searches application source for direct use of `window.location.search`, `URLSearchParams`, `localStorage`, `sessionStorage`, `fetch(`, and `navigator.sendBeacon` inside calculator form/result modules. It allows only explicitly documented static import matches and exits non-zero on prohibited use.

- [ ] **Step 4: Add release checks to CI and document exact release gates**

Add `pnpm check:catalog` and `pnpm check:privacy` scripts. CI runs them before the build. `docs/release-checklist.md` requires all tests, desktop/mobile calculator journeys, keyboard-only completion, Lighthouse review, sitemap/canonical review, no user-input leak, human formula review, and a supplied legal operator contact before production deployment.

- [ ] **Step 5: Run the complete verification suite**

Run:

```bash
pnpm lint
pnpm check:catalog
pnpm check:privacy
pnpm test
pnpm build
pnpm test:e2e
```

Expected: every command exits 0. Record the command outputs and browser versions in the pull request description.

- [ ] **Step 6: Commit delivery readiness**

Run:

```bash
git add scripts package.json .github/workflows/ci.yml README.md docs/release-checklist.md tests/unit/registry.test.ts
git commit -m "chore: add calculator release quality gates"
git push
```

## Explicit Post-MVP Work (Not in this Plan)

1. Choose and register an operating domain, then set `NEXT_PUBLIC_SITE_URL` and verify production canonicals/sitemap.
2. Supply genuine operator identity and contact information, complete policy pages, and obtain legal/privacy review appropriate to the operating jurisdiction.
3. Connect Search Console and Naver Search Advisor, submit sitemap, and collect 4–8 weeks of query, indexing, and completion data.
4. Apply for AdSense only after the trust pages and production domain are ready; start with one manual post-result slot and re-run mobile, CLS, completion-rate, and policy checks using live ads.
5. Select P1 calculators from actual search and user-flow data; do not mass-generate shallow pages.

## Plan Self-Review

- Spec coverage: Tasks 1–2 establish static Next.js, privacy boundaries, registry, and SEO content. Tasks 3–4 implement every P0 formula. Tasks 5–6 deliver accessible pages and all nine routes. Task 7 covers technical SEO and trust pages. Task 8 enforces accuracy, privacy, and release gates. Ads and production deployment remain intentionally deferred per the spec.
- Completeness scan: No implementation action relies on an unnamed function or an unbounded future task. Genuine legal identity, contact, and operating domain are deliberately launch-blocking external inputs, not invented data.
- Interface consistency: all calculator pages consume `CalculatorDefinition<I, O>`; pure decimal engines feed definitions; shared UI consumes definitions; sitemap and checks consume the same registry.
