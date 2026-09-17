# Comprehensive Calculator Catalogue Design

## Goal

Expand 바로계산기 from nine automobile, finance, and household-budget tools into a Korean calculator discovery service. The service must earn repeat organic visits through useful, independently indexable calculator pages while keeping every entered value and calculated result in the browser.

## Decisions confirmed with the operator

- The reference scope is the public calculator catalogue patterns of 계산기닷컴, 모두의 계산기, and 에놀라소프트. Their branding, text, assets, and implementation must not be copied.
- Calculators are static and work only from user-entered values in the first release. There are no API calls, server routes, server actions, storage, URL query state, or accounts.
- Real-time-data ideas are recorded as future candidates only. They are not loaded, displayed, or requested in the first release.
- The existing nine calculator URLs and their formulas remain available.
- Search and AdSense value comes from useful page-specific content, not thin parameter-page generation. An annual or amount-specific page may be added only after it has its own reviewed result table and explanatory copy.

## Catalogue and Information Architecture

The new catalogue contains the existing nine tools plus 69 new tools (78 total). Every tool has a stable two-segment Korean-search-friendly URL, a title, a unique description, a reviewed date, a calculation formula, two input examples, limitations, official or primary sources, and up to four related calculators.

| Category | Tools |
| --- | --- |
| 자동차 | Existing: maintenance, fuel, EV charging, purchase cost, instalment. New: lease-versus-purchase, rental-versus-lease, depreciation, total ownership cost, highway-toll budget. |
| 금융 | Existing: loan interest, repayment comparison, compound savings. New: savings maturity, deposit interest, loan affordability, DSR, DTI, LTV, credit-card instalment, exchange-rate manual conversion. |
| 급여·고용 | take-home pay, severance pay, hourly-to-monthly pay, weekly holiday allowance, annual-leave allowance, unemployment benefit estimate, parental-leave benefit estimate, salary negotiation, freelance withholding estimate. |
| 부동산 | acquisition-tax estimate, brokerage fee, deposit-to-rent conversion, rent-versus-deposit, moving budget, one-person-home setup budget, housing affordability, rental-yield, property holding-cost checklist. |
| 세금·사업 | VAT, margin, markup, break-even, sales commission settlement, online-market fee settlement, freelancer net income, simple monthly profit and loss, business feasibility, discount rate. |
| 건강·운동 | BMI, basal metabolic rate, daily calorie, macro nutrients, target weight, running pace, walking calorie, water intake. |
| 생활·날짜 | D-day, days-between-dates, date add/subtract, weekday, international age, Korean age, zodiac, percentage, split household expense, electricity-cost estimate, phone-plan cost, tip split. |
| 교육·재미·단위 | GPA, grade conversion, study-time planner, lottery numbers, random picker, unit conversion, fuel-efficiency conversion, time-zone comparison. |

The home page gains searchable category sections, a calculator search/filter, popular-tool links, and recently added tools. Each category also gains a static landing page that introduces the category, lists its calculators, and supplies internal links. The calculator UI remains form-first and mobile-first; it does not present advertising in a way that interferes with calculation.

## Application Architecture

1. Replace the three duplicate category route implementations with generic static routes at `app/(site)/[category]/page.tsx` and `app/(site)/[category]/[slug]/page.tsx`. `generateStaticParams` reads the catalogue and exports every permitted route; unknown category/slug combinations return 404 at build and runtime.
2. Expand `CalculatorCategory` into the eight categories above. A typed category configuration provides label, description, route, and visual marker, so the home page, breadcrumb, page banner, category hubs, sitemap, and registry do not maintain independent category lists.
3. Keep catalogue editorial information in `content/calculators.ts`; add focused pure Decimal-based calculation modules under `lib/<category>/`; register validated form fields and result presentation once in `lib/calculators/definitions.ts` or narrowly grouped definition modules. A definition never accesses browser APIs or network resources.
4. Keep the existing generic `CalculatorForm`, `CalculatorClient`, `ResultPanel`, guides, related links, JSON-LD, local-only analytics event boundary, and AdSense loader. Extend shared result rendering only where a calculation genuinely requires a table (for example, salary deductions or monthly schedules).
5. Add a checked-in, non-executing external-data candidate catalogue. It describes desired data, a candidate public source, whether it may be called directly from a browser, CORS/terms review status, fallback inputs, and review date. No code imports it into the browser bundle during this release.

## Calculation and Editorial Rules

- Use `decimal.js` for currency, rates, tax brackets, and fractional arithmetic. Parse every raw form value with the existing shared validation helpers and enforce explicit bounded ranges.
- Each formula module is pure and has unit tests for normal inputs, zero values, invalid boundaries, rounding, and legally/financially meaningful thresholds.
- Salary, tax, benefits, and real-estate tools are estimates. Their catalogue entries show a `기준연도`, exact calculation assumptions, official source links, and a prominent limitation that real eligibility and billed amounts can differ. Rules without a reliable reviewed public source are not released.
- Do not collect, persist, serialize, hash, send, or place form data in a link. “Copy link” continues to copy only the base calculator URL.
- Every calculator has exactly one H1, a canonical URL, WebPage JSON-LD, breadcrumb JSON-LD, a semantic input form, result live region, keyboard support, 44px touch controls, and useful related-calculator navigation.

## SEO and Revisit Strategy

- Publish a static category hub and an individual static page for each reviewed calculator. `sitemap.xml` includes the home page, policies, category hubs, and every calculator route with `lastModified` from editorial data.
- Make each page useful without a calculation: explain what it answers, show the formula, two realistic examples, limitations, sources, review date, and related next steps.
- Prioritize high-intent pages first: take-home pay, severance, weekly holiday allowance, DSR/DTI/LTV, acquisition tax, brokerage fee, VAT, margin, break-even, D-day, age, BMI, and manual exchange conversion.
- Add no automatic pages for every salary, price, or date combination. After Search Console data and editorial review exist, selectively create value-specific pages only where the rendered answer, assumptions, and guidance are genuinely unique.
- Record only whitelisted, value-free calculator view/start/submit/result/share events. Analytics must not reveal category inputs or results.

## External Data Candidates (Deferred)

These are backlog entries, not product features in this release: live exchange rates, average fuel prices, EV charging rates, electricity tariffs, public holiday calendar, and time zones. A candidate can proceed only after a separate review confirms public browser use without a secret, valid CORS behavior, stable terms/rate limits, a source attribution requirement, failure behavior, and a user-entered fallback. Any candidate needing a key, proxy, caching service, or privileged request requires a server and is out of scope.

## Failure Handling

- Missing or malformed fields produce field-level Korean validation messages and no stale result.
- Division by zero, invalid dates, impossible ranges, and output outside defined bounds produce an understandable validation error; they never render `NaN` or `Infinity`.
- A category/slug mismatch returns an exported 404 page.
- All calculators work offline after the static assets load because the initial release issues no calculator-related network request.

## Verification and Release Gates

- Unit tests cover each formula, threshold, precision/rounding policy, and validation error.
- Component tests cover representative currency, date, choice/select, table, and copy-link behaviour without leaking input values.
- Playwright enumerates the data-driven catalogue, proves every exported page calculates locally with no XHR/fetch/POST/storage writes, verifies desktop/mobile layout, keyboard flow, one H1, category hubs, canonical tags, sitemap entries, and no horizontal overflow.
- Update catalogue/static-output checks to derive counts and paths from the typed catalogue instead of literal nine-tool or fifteen-page counts.
- Run `pnpm lint`, `pnpm check:catalog`, `pnpm check:privacy`, `pnpm test`, an ID-less `pnpm build`, `pnpm check:static`, and `pnpm test:e2e`. Review mobile AdSense behavior only after a real publisher approval and compliant policy/contact information exist.

## Out of Scope

- Any live API request, API key, server, database, account, saved calculation, query-string state, or calculator-input telemetry.
- Automatic legal/tax updates without an editorial review and a source.
- Copying reference-site content, layout, visual identity, source code, or advertising arrangement.
