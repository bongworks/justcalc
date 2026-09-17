# Task 2 report: Salary calculator catalogue and editorial registration

Status: complete.

## Delivered

- Registered nine `/salary/` calculators: take-home pay, hourly/monthly pay, weekly holiday pay, severance pay, annual leave allowance, unemployment benefit, parental leave benefit, salary negotiation, and freelancer withholding.
- Added Korean formulas, two examples, limitations, official sources, review dates, and valid current catalogue relationships for each page.
- Kept take-home pay as a **manual configuration estimate**: employee rates, pension lower/upper bases, monthly income tax, and local tax rate are explicit required inputs. No payroll rate or tax table was added.
- Kept unemployment limits and parental leave rate/cap as manual inputs. The parental page is expressly a flat rate/cap scenario; freelancer withholding is expressly an expense-adjusted scenario.
- Benefit displays include `기준연도`, `계산 가정`, and `실제 지급·수급 자격` rows.
- Changed calculator E2E route coverage to derive from registered definitions, supplying only non-statutorily-labelled manual scenario inputs.

The current catalogue does not yet contain the planned `vat` and `margin` pages, so this task does not create broken related-calculator links. The freelancer guide directs users to those separate VAT/margin calculations when they are registered by the business-catalogue task.

## TDD and verification

1. RED: `pnpm test tests/unit/definitions.test.ts tests/unit/registry.test.ts` failed as expected because `/salary/severance-pay/` was unregistered.
2. GREEN: the same focused tests passed after registration.
3. `pnpm test` passed: 32 files, 221 tests.
4. `pnpm check:catalog` passed: 18 calculators, each with valid guide requirements and related routes.
5. `pnpm build` passed and generated all static salary routes.
6. `PLAYWRIGHT_PORT=3017 pnpm exec playwright test tests/e2e/calculators.spec.ts` passed: 19 passed, 1 expected desktop-mobile skip. It used a temporary local port because port 3000 belonged to the parent workspace server; the Playwright config was restored unchanged.
7. Scoped ESLint passed for all changed files; `git diff --check` passed.

`pnpm lint` remains blocked by pre-existing `@next/next/no-html-link-for-pages` errors in non-task `app` files, duplicated under the nested finance worktree. No lint error was reported for Task 2 files.

## P2 follow-up fix (2026-09-17)

1. RED: Added definition-level salary-negotiation rendering cases. `pnpm test tests/unit/definitions.test.ts` failed as intended: 10% and -10% displayed as 1,000% and -1,000%.
2. GREEN: The salary-negotiation definition now formats its already-percent result directly, preserving signed 10%, -10%, and the zero-baseline finite 0% result.
3. Corrected the severance guide's 3.5-year arithmetic: `120,000 × 30 × 1,277 ÷ 365 = 12,595,068.49…`, which rounds to `12,595,068원` at whole-won precision.
4. Verification: `pnpm test tests/unit/definitions.test.ts` passed (6 tests); `pnpm check:catalog` passed (18 calculators); `git diff --check` passed.
