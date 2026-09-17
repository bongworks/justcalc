# Calculator Experience and AdSense Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all calculator pages a clear, responsive result-first experience while preparing an opt-in, post-result AdSense manual slot that remains absent until approved production IDs are supplied.

**Architecture:** Preserve static `CalculatorPage` content and local `CalculatorClient` calculation state. Add a validated build-time advertising configuration helper, one isolated `AdSlot` client boundary, and a workspace layout that keeps semantic DOM order form → result → sharing → guidance; CSS supplies the desktop grid and mobile collapse. Extend the existing source privacy guard so only the explicitly reviewed ad boundary can use the Google advertising global.

**Tech Stack:** Next.js 16 App Router static export, React 19, TypeScript, Vitest + Testing Library, Playwright, CSS, Node source gates.

**Spec:** `docs/superpowers/specs/2026-09-17-calculator-experience-adsense-readiness-design.md`

## Global Constraints

- Do not change calculator formulas, input labels, validation, GA event payloads, canonical URLs, JSON-LD, or related-calculator registry data.
- Inputs and results must not be sent to URLs, storage, analytics, or advertising code.
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` must match `ca-pub-` followed by 10–24 digits; `NEXT_PUBLIC_ADSENSE_RESULT_SLOT_ID` must be 10–24 digits.
- Ads are enabled only in a production build with both valid values; otherwise no Google ad script, slot, or reserved gap is emitted.
- Render one responsive manual slot only after a successful result; label it `광고` and never position it inside form controls or directly beside a result value.
- Preserve static export and the existing 44px touch targets, keyboard navigation, no-horizontal-overflow checks, and privacy source gate.
- Do not activate a live ad, apply to AdSense, invent operator/contact information, or add a consent manager.

---

## File Structure

- Create: `lib/adsense/config.ts` — typed, testable validation for production publisher and result-slot configuration.
- Create: `components/adsense/AdSenseLoader.tsx` — static layout-level Next `Script` wrapper for the validated publisher client.
- Create: `components/adsense/AdSlot.tsx` — isolated client-only manual result-slot renderer and fill request.
- Create: `tests/unit/adsense-config.test.ts` — configuration validation examples.
- Create: `tests/component/AdSlot.test.tsx` — no-slot and valid-slot behaviour.
- Modify: `app/layout.tsx` — calculate config once and conditionally render the loader.
- Modify: `components/calculator/CalculatorPage.tsx` — add semantic shared workspace/layout landmarks without changing its static content contract.
- Modify: `components/calculator/CalculatorClient.tsx` — retain local calculation state and place the slot after a result.
- Modify: `components/calculator/CalculatorForm.tsx` — add a form-card header and stable action grouping only.
- Modify: `components/calculator/ResultPanel.tsx` — add the instructional empty state and visual hooks without changing result content/copy semantics.
- Modify: `app/globals.css` — responsive grid/card/result/advertising visual treatment for every calculator page.
- Modify: `scripts/check-no-input-leak.mjs` and `tests/unit/release-gates.test.ts` — narrow advertising-global review boundary and prohibit it anywhere else.
- Modify: `tests/component/CalculatorPage.test.tsx`, `tests/component/ResultPanel.test.tsx`, and `tests/e2e/calculators.spec.ts` — prove semantic workspace order, pre-result instructions, post-result placement, and responsive behaviour.
- Modify: `.env.example`, `app/privacy/page.tsx`, `README.md`, and `docs/release-checklist.md` — document build-time opt-in and operational prerequisites accurately.

## Task 1: Define and test the AdSense activation contract

**Files:**
- Create: `lib/adsense/config.ts`
- Create: `tests/unit/adsense-config.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `AdSenseConfig` with `clientId: string` and `resultSlotId: string`.
- Produces: `getAdSenseConfig(environment?: string, clientId?: string, resultSlotId?: string): AdSenseConfig | undefined`.
- Consumed by: the root layout and calculator workspace; neither needs to duplicate ID validation.

- [ ] **Step 1: Write the failing config tests**

```ts
import { expect, it } from 'vitest';
import { getAdSenseConfig } from '@/lib/adsense/config';

it('enables one manual slot only for production with valid public IDs', () => {
  expect(getAdSenseConfig('production', 'ca-pub-1234567890123456', '1234567890')).toEqual({
    clientId: 'ca-pub-1234567890123456',
    resultSlotId: '1234567890',
  });
});

it('keeps ads disabled outside production or with malformed identifiers', () => {
  expect(getAdSenseConfig('development', 'ca-pub-1234567890123456', '1234567890')).toBeUndefined();
  expect(getAdSenseConfig('production', 'publisher', '1234567890')).toBeUndefined();
  expect(getAdSenseConfig('production', 'ca-pub-1234567890123456', 'slot-name')).toBeUndefined();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/adsense-config.test.ts`

Expected: FAIL because `lib/adsense/config.ts` does not exist.

- [ ] **Step 3: Implement the minimum configuration helper**

```ts
export interface AdSenseConfig { clientId: string; resultSlotId: string; }

const clientIdPattern = /^ca-pub-\d{10,24}$/;
const slotIdPattern = /^\d{10,24}$/;

export function getAdSenseConfig(
  environment = process.env.NODE_ENV,
  clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  resultSlotId = process.env.NEXT_PUBLIC_ADSENSE_RESULT_SLOT_ID,
): AdSenseConfig | undefined {
  if (environment !== 'production' || !clientId || !resultSlotId) return undefined;
  return clientIdPattern.test(clientId) && slotIdPattern.test(resultSlotId) ? { clientId, resultSlotId } : undefined;
}
```

Add blank `NEXT_PUBLIC_ADSENSE_CLIENT_ID` and `NEXT_PUBLIC_ADSENSE_RESULT_SLOT_ID` entries to `.env.example`, with a Korean comment stating both are public build-time IDs and leave the feature disabled when blank.

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `pnpm test tests/unit/adsense-config.test.ts`

Expected: PASS with both activation-contract tests green.

- [ ] **Step 5: Commit the activation contract**

```bash
git add lib/adsense/config.ts tests/unit/adsense-config.test.ts .env.example
git commit -m "feat: add guarded adsense configuration"
```

## Task 2: Add isolated loader and post-result manual slot

**Files:**
- Create: `components/adsense/AdSenseLoader.tsx`
- Create: `components/adsense/AdSlot.tsx`
- Create: `tests/component/AdSlot.test.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `AdSenseConfig` from `lib/adsense/config.ts`.
- Produces: `AdSenseLoader({ clientId }: Pick<AdSenseConfig, 'clientId'>)`.
- Produces: `AdSlot({ config }: { config: AdSenseConfig })` with a labelled responsive `ins` slot.
- Consumed by: the root layout and `CalculatorClient` only after Task 3 wiring.

- [ ] **Step 1: Write failing component tests**

```tsx
it('does not render a slot without an opt-in configuration', () => {
  render(<AdSlot config={undefined} />);
  expect(screen.queryByLabelText('광고')).not.toBeInTheDocument();
});

it('renders one labelled responsive manual slot with a valid configuration', () => {
  render(<AdSlot config={{ clientId: 'ca-pub-1234567890123456', resultSlotId: '1234567890' }} />);
  const ad = screen.getByLabelText('광고');
  expect(ad.querySelector('ins')).toHaveAttribute('data-ad-slot', '1234567890');
  expect(ad.querySelector('ins')).toHaveAttribute('data-ad-client', 'ca-pub-1234567890123456');
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run: `pnpm test tests/component/AdSlot.test.tsx`

Expected: FAIL because `AdSlot` does not exist.

- [ ] **Step 3: Implement the smallest isolated advertising boundary**

```tsx
// components/adsense/AdSenseLoader.tsx
import Script from 'next/script';

export function AdSenseLoader({ clientId }: { clientId: string }) {
  return <Script async strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`} crossOrigin="anonymous" />;
}
```

```tsx
// components/adsense/AdSlot.tsx
'use client';

import { useEffect } from 'react';
import type { AdSenseConfig } from '@/lib/adsense/config';

export function AdSlot({ config }: { config?: AdSenseConfig }) {
  useEffect(() => {
    if (!config) return;
    try { window.adsbygoogle = window.adsbygoogle || []; window.adsbygoogle.push({}); } catch { /* Ads must never interrupt calculation. */ }
  }, [config]);
  if (!config) return null;
  return <aside className="ad-slot" aria-label="광고"><p>광고</p><ins className="adsbygoogle" data-ad-client={config.clientId} data-ad-slot={config.resultSlotId} data-ad-format="auto" data-full-width-responsive="true" /></aside>;
}
```

Add the narrow `Window` declaration inside this file, import `getAdSenseConfig` in `app/layout.tsx`, calculate it once, and conditionally place `<AdSenseLoader clientId={adSense.clientId} />` in the document head. Never pass calculator state to either component.

- [ ] **Step 4: Run component and type-aware lint checks**

Run: `pnpm test tests/component/AdSlot.test.tsx && pnpm lint`

Expected: PASS; no Next Script lint error and no TypeScript error.

- [ ] **Step 5: Commit isolated AdSense UI**

```bash
git add components/adsense/AdSenseLoader.tsx components/adsense/AdSlot.tsx tests/component/AdSlot.test.tsx app/layout.tsx
git commit -m "feat: add opt-in post-result ad slot"
```

## Task 3: Wire the common calculator workspace and improve semantic hierarchy

**Files:**
- Modify: `components/calculator/CalculatorPage.tsx`
- Modify: `components/calculator/CalculatorClient.tsx`
- Modify: `components/calculator/CalculatorForm.tsx`
- Modify: `components/calculator/ResultPanel.tsx`
- Modify: `tests/component/CalculatorPage.test.tsx`
- Modify: `tests/component/ResultPanel.test.tsx`

**Interfaces:**
- Consumes: `AdSenseConfig | undefined`, `CalculatorDefinition`, `DisplayResult`, and current calculation callbacks.
- Produces: form/result layout landmarks with unchanged form and result interfaces.
- Guarantees: no result slot is present before a successful calculation; link sharing remains after the result/slot region.

- [ ] **Step 1: Write failing hierarchy and placement tests**

```tsx
it('keeps an instructional result area before calculation and keeps the disabled ad slot absent', async () => {
  render(<CalculatorPage definition={definition}><Calculation /></CalculatorPage>);
  expect(screen.getByText('입력한 조건으로 계산 결과를 확인하세요.')).toBeVisible();
  expect(screen.queryByLabelText('광고')).not.toBeInTheDocument();
  await user.type(screen.getByRole('textbox'), '300{Enter}');
  expect(screen.getByRole('heading', { name: '계산 결과' })).toBeVisible();
  expect(screen.queryByLabelText('광고')).not.toBeInTheDocument();
});
```

Add an assertion that the calculator form has the accessible heading `계산 조건`, and update the existing result-panel test to expect the empty helper text without a result heading.

- [ ] **Step 2: Run the component tests to verify they fail**

Run: `pnpm test tests/component/CalculatorPage.test.tsx tests/component/ResultPanel.test.tsx`

Expected: FAIL because neither the form heading nor the pre-result helper exists and no post-result slot is wired.

- [ ] **Step 3: Implement layout-only markup changes**

In `CalculatorPage`, retain the existing static `calculator-workspace` wrapper and add only its accessible label; preserve title, breadcrumbs, guides, metadata, and related links exactly.

In `CalculatorClient`, call `getAdSenseConfig()` once, group `CalculatorForm` and `ResultPanel` in a `calculator-workspace-grid`, and render `<AdSlot config={adSense} />` immediately after that grid only when `result` is non-null. Keep page-link sharing after the optional slot. This avoids cloning server-provided children and keeps the existing page route interface unchanged.

In `CalculatorForm`, add a visually styled `<div className="calculator-form-heading"><h2>계산 조건</h2><p>필요한 항목만 입력한 뒤 계산하기를 눌러 주세요.</p></div>` before the fieldset. Preserve `form`, `noValidate`, hydration guard, fieldset, labels, submit/reset behaviour, and error linkage.

In `ResultPanel`, always render the existing polite live region. When `result` is absent, render `<p className="result-empty">입력한 조건으로 계산 결과를 확인하세요.</p>`. When present, retain all current heading, rows, tables, copy control, live announcement, and disclaimer markup.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `pnpm test tests/component/CalculatorPage.test.tsx tests/component/ResultPanel.test.tsx tests/component/CalculatorForm.test.tsx`

Expected: PASS; calculation, reset, copy, no-result, and placement tests all pass.

- [ ] **Step 5: Commit the shared calculator hierarchy**

```bash
git add components/calculator/CalculatorPage.tsx components/calculator/CalculatorClient.tsx components/calculator/CalculatorForm.tsx components/calculator/ResultPanel.tsx tests/component/CalculatorPage.test.tsx tests/component/ResultPanel.test.tsx
git commit -m "feat: improve shared calculator flow"
```

## Task 4: Apply the responsive visual system to all calculators

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/e2e/calculators.spec.ts`

**Interfaces:**
- Consumes: class names introduced in Task 3.
- Produces: 2-column desktop workspace, sticky result rail, mobile single-column flow, zero disabled-ad gap, and distinct form/result hierarchy.
- Guarantees: the existing tests can still select labels, buttons, `.result-panel`, and tables.

- [ ] **Step 1: Write failing viewport expectations**

```ts
test('calculator workspace stays single-column on mobile and keeps the result after the action', async ({ page, isMobile }) => {
  test.skip(!isMobile);
  await page.goto('/car/fuel-cost/');
  await expect(page.locator('.calculator-workspace-grid')).toHaveCSS('grid-template-columns', '1fr');
  await page.getByRole('button', { name: '계산하기' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
```

Add a desktop assertion that `.calculator-workspace-grid` is a grid and the result panel is visible after calculation.

- [ ] **Step 2: Run the targeted Playwright test to verify it fails**

Run: `pnpm test:e2e -- tests/e2e/calculators.spec.ts --grep "workspace stays single-column"

Expected: FAIL because the shared grid class and its mobile CSS do not exist.

- [ ] **Step 3: Implement scoped CSS**

Replace only calculator-related CSS rules in `app/globals.css` with the following visual system while preserving existing unrelated page styles:

```css
.calculator-workspace-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(18rem, .72fr); align-items: start; gap: 1.5rem; }
.calculator-form, .result-panel { border-radius: 1rem; box-shadow: 0 12px 32px rgb(23 40 73 / .06); }
.calculator-form { padding: clamp(1.25rem, 3vw, 2rem); }
.calculator-form-heading { padding-bottom: 1.25rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--line); }
.result-panel { position: sticky; top: 1.25rem; border-color: #b8cef9; background: #f4f8ff; }
.result-empty { margin: 0; color: var(--muted); }
.button-primary { width: 100%; border-radius: .625rem; }
.ad-slot { margin: 0; padding: 1rem; border: 1px solid var(--line); border-radius: 1rem; background: var(--surface); }
.ad-slot > p { margin: 0 0 .5rem; color: var(--muted); font-size: .75rem; font-weight: 700; }
@media (max-width: 52rem) { .calculator-workspace-grid { display: block; } .result-panel { position: static; margin-top: 1.5rem; } }
```

Keep form actions on one row only when space allows, retain keyboard focus styling, use tabular numbers for result values, and apply `min-height` exclusively inside `.ad-slot` after configuration enabled.

- [ ] **Step 4: Run responsive and accessibility journeys**

Run: `pnpm test:e2e -- tests/e2e/calculators.spec.ts`

Expected: PASS for the nine calculator calculations, keyboard flow, tables, no storage/network requests, and mobile no-overflow journey.

- [ ] **Step 5: Commit shared responsive styling**

```bash
git add app/globals.css tests/e2e/calculators.spec.ts
git commit -m "style: refine calculator result workspace"
```

## Task 5: Preserve privacy gates and document operational activation

**Files:**
- Modify: `scripts/check-no-input-leak.mjs`
- Modify: `tests/unit/release-gates.test.ts`
- Modify: `app/privacy/page.tsx`
- Modify: `README.md`
- Modify: `docs/release-checklist.md`

**Interfaces:**
- Consumes: `components/adsense/AdSlot.tsx` as the sole reviewed advertising-global boundary.
- Produces: source-gate protection that rejects `adsbygoogle` outside that boundary and operational documentation that accurately describes conditional ad activation.
- Guarantees: calculator values cannot reach ad code, advertising remains absent without environment configuration, and human prerequisites cannot be mistaken for automated completion.

- [ ] **Step 1: Write failing source-gate and policy assertions**

```ts
it('rejects advertising globals outside the isolated slot boundary', () => {
  expect(scanSource('components/calculator/Fixture.tsx', 'window.adsbygoogle.push({})')).toContain('components/calculator/Fixture.tsx: direct advertising access outside reviewed boundary');
});

it('allows only the reviewed AdSlot advertising boundary', () => {
  expect(scanSource('components/adsense/AdSlot.tsx', reviewedAdSlotSource)).toEqual([]);
});
```

Add policy-page assertions that the page mentions the conditional production configuration and continues to say calculator values are not transmitted.

- [ ] **Step 2: Run the privacy gate tests to verify they fail**

Run: `pnpm test tests/unit/release-gates.test.ts && pnpm check:privacy`

Expected: FAIL because the gate has no approved AdSlot boundary or advertising-global rule.

- [ ] **Step 3: Implement the narrow gate and accurate docs**

Add `components/adsense/AdSlot.tsx` to a reviewed-boundary map with its SHA-256 only after reviewing its effect for no state/input/result data. In AST traversal, reject identifiers named `adsbygoogle` and direct `window.adsbygoogle` access outside that reviewed path. Keep the existing calculator/GA rules unchanged.

Replace the privacy-page ad paragraph with conditional wording: advertising code is absent unless approved production IDs are supplied at build time; once enabled, Google advertising may process device/cookie information under the then-reviewed policy and consent requirements; calculator values and results are never included. Do not claim consent exists.

Document the two environment names, blank-by-default/no-render result, manual post-result placement, and non-code prerequisites in README and the release checklist. Explicitly require live review of consent, network activity, fill, CLS, and completion rate before activation.

- [ ] **Step 4: Run privacy and documentation-related tests**

Run: `pnpm test tests/unit/release-gates.test.ts tests/e2e/seo.spec.ts && pnpm check:privacy`

Expected: PASS; no unreviewed advertising global and policy route remains present in static/SEO coverage.

- [ ] **Step 5: Commit privacy and activation docs**

```bash
git add scripts/check-no-input-leak.mjs tests/unit/release-gates.test.ts app/privacy/page.tsx README.md docs/release-checklist.md
git commit -m "docs: define adsense activation safeguards"
```

## Task 6: Run full release-quality verification

**Files:**
- Modify only if verification reveals a scoped defect in the files above.

**Interfaces:**
- Consumes: all prior completed tasks.
- Produces: fresh, recorded evidence for the static ad-disabled build and calculator behaviour.

- [ ] **Step 1: Install the locked dependency graph if absent**

Run: `pnpm install --frozen-lockfile`

Expected: dependencies match `pnpm-lock.yaml` without lockfile changes.

- [ ] **Step 2: Run static code and unit gates**

Run: `pnpm lint && pnpm check:catalog && pnpm check:privacy && pnpm test`

Expected: all commands exit 0.

- [ ] **Step 3: Build the explicit ID-less production artifact**

Run: `NEXT_PUBLIC_GA_MEASUREMENT_ID='' NEXT_PUBLIC_ADSENSE_CLIENT_ID='' NEXT_PUBLIC_ADSENSE_RESULT_SLOT_ID='' pnpm build && pnpm check:static`

Expected: static build exits 0, static checker passes, and rendered output contains no Google ad script or `adsbygoogle` markup.

- [ ] **Step 4: Run browser verification on the static artifact**

Run: `pnpm test:e2e`

Expected: desktop and 375px mobile journeys exit 0; calculations remain local, no calculator input/result is persisted or requested, and no ad slot appears in the ID-less artifact.

- [ ] **Step 5: Inspect the change set and commit any scoped fix**

Run: `git diff --check && git status --short && git log --oneline -6`

Expected: no whitespace errors, only intended files changed, and the work is represented by the five task commits plus this verification state.
