# Moducalc-Inspired Calculator UI Design

## Goal

Give the home page and every calculator a cohesive, fast-to-scan interface inspired by the information hierarchy of Moducalc, while preserving 바로계산기 branding, calculator behavior, privacy boundaries, routes, and SEO contracts.

## Constraints

- Keep all formulas, parser limits, labels, routes, canonical URLs, existing JSON-LD, related-calculator data, and analytics behavior unchanged.
- Reuse only high-level interaction and layout ideas from the reference. Do not copy its brand, copy, icons, imagery, gradients, advertising pattern, or source.
- The existing hidden maximum validation remains a safety guard, but visible helper copy must not say `최대 1,000조`.
- Keep calculation inputs and results local to the browser. Do not add storage, query-string state, or network requests.
- Preserve one H1 per route, semantic headings, keyboard behavior, focus rings, 44px touch targets, mobile layout, and static export.

## Visual System

Use an original light neutral palette with a saturated blue accent, compact white header, rounded cards, understated borders, and higher contrast for primary actions. Typography remains the existing Korean system stack. The visual system is expressed through global design tokens and shared component class names so all nine calculators remain visually consistent.

## Home Page

The homepage becomes a concise discovery surface:

1. A compact hero introduces the service with an eyebrow, one focused H1, and a short privacy statement.
2. Category chips act as in-page navigation.
3. Each category becomes a clear section with a small descriptor and calculator-link cards. Cards use an original category marker and arrow affordance, provide a stable hover/focus state, and remain semantic links.
4. The layout is a three-column grid on wide screens, two columns at intermediate widths, and one column on mobile.

No search field is introduced because the present catalogue contains only nine tools and all of them are visible without a filtering interaction.

## Shared Calculator Pages

All calculator pages share a structured calculator surface:

1. Breadcrumbs and title remain unchanged for discoverability and current SEO meaning.
2. A compact blue category banner provides the calculator category and description without altering the H1.
3. The existing form and result panel stay in semantic DOM order. On desktop they appear as a responsive two-column surface; on mobile, form precedes result.
4. Form inputs receive clearer label-to-control grouping, a compact helper line, and stronger calculate/reset hierarchy. The existing `example` is retained, while range boilerplate is replaced with concise unit-appropriate wording such as `예: 12,000` or `원 단위로 입력`.
5. Result panels use an accent-tinted background and maintain existing live-region, copy, table, and disclaimer behavior.
6. Guides and related calculators remain below the interactive surface with a clearer reading rhythm.

## Input Validation Copy

`MAX_VALUE` and the parser error path remain untouched. The generic visible field hint changes from `0 이상, 최대 1,000조 · 금액은 정수로 입력` to `원 단위 정수로 입력`. Distance and efficiency hints lose the maximum phrase and retain their example. Invalid or huge values continue to receive the existing validation error only when they are actually submitted.

## SEO

Live browser inspection on 2026-09-17 confirmed that the home page and 자동차 유지비 page already render a single H1, canonical URL, title/description, Open Graph/Twitter metadata, and JSON-LD. These outputs must remain present. No FAQ schema, keyword meta tag, or speculative schema type is added. The installation and runtime readiness of `claude-seo` was verified; its CLI URL fetcher was blocked by the local command-line DNS resolver, so the production DOM metadata was inspected via the browser instead.

## Tests and Acceptance Criteria

- Component tests prove concise visible field hints without weakening parser validation.
- Home page tests prove all category links and calculator links remain reachable.
- Calculator component tests retain form labels, local calculation, results, reset, copy, and live region behavior.
- Playwright checks cover all calculator routes, keyboard calculation, both mobile and desktop grid order, and no horizontal overflow.
- Lint, unit/component tests, privacy and static-export gates, and production build succeed.

## Out of Scope

- New calculator functions, catalogue search, user accounts, saved calculation state, data collection, ad placements, formula changes, or external content/API integrations.
