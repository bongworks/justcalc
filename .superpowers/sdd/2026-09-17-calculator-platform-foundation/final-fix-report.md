# Foundation final fix report

## Scope

- Gave every calculator link on category hub pages an explicit `44px` minimum width and height without changing navigation semantics.
- Replaced home E2E catalog snapshot counts with expectations derived from `calculatorCatalog` and `calculatorCategories`, including every category group.
- Kept the site static and local-only; no request, storage, analytics, or persistence behavior changed.

## TDD evidence

1. Added the mobile category-hub touch-target E2E before production edits.
2. Built the unchanged application and ran the focused test at a 375px touch viewport.
3. Observed the expected failure: link height was `17px`, below the required `44px`.
4. Added the scoped `category-calculator-list` selector and minimum target dimensions.
5. Rebuilt and reran the same test: `1 passed`.

An isolated Playwright config on port `3017` was used only while testing because port `3000` was already occupied by a server outside this worktree; the temporary config was removed.

## Verification

- `pnpm exec eslint components/content/CategoryPage.tsx tests/e2e/home.spec.ts` — passed.
- `pnpm vitest run tests/unit/category-route.test.tsx tests/component/CalculatorDirectory.test.tsx` — 2 files, 5 tests passed.
- `pnpm build` — passed; 27 static pages generated.
- `pnpm exec playwright test tests/e2e/home.spec.ts --config=playwright.red.config.ts` — 8 passed, 2 expected desktop skips.
- `pnpm check:privacy` — passed; 48 application modules checked.
- `pnpm check:static` — passed; 23 canonical HTML pages validated, GA and AdSense absent.
- `git diff --check` — passed.
