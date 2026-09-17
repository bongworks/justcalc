# Salary and finance calculators: final fix report

## P3: loan affordability at an unrepresentably small positive rate

- Added a regression fixture for 300만원 net monthly income, 20만원 existing monthly debt, 20% allowance, 12 months, and an annual rate of `1e-100%`. The expected affordable principal is 4,800,000원.
- Before the fix, the focused test returned 0 because 100-digit `Decimal` arithmetic rounded `1 + monthlyRate` to 1; the annuity numerator therefore became zero.
- `calculateLoanAffordability` now uses the mathematically stable zero-rate limit only when the monthly rate is zero or adding it to one is unrepresentable at the calculator's configured precision. Normal positive-rate and zero-rate paths retain their existing results.

## Verification

- `pnpm test tests/unit/finance/affordability.test.ts`: 8 passed.
- `pnpm test tests/unit/finance`: 56 passed.
- `pnpm test`: 32 files, 241 tests passed.
- `pnpm lint`: blocked by 20 pre-existing `@next/next/no-html-link-for-pages` errors in the about, editorial-policy, privacy, and terms pages (also duplicated under the nested finance-modules worktree); none are in this fix's files.
