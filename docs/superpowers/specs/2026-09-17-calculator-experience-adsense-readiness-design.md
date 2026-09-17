# Calculator Experience and AdSense Readiness Design

## Goal

Make every calculator feel like one focused flow: enter values, calculate, understand the result, then continue to trusted explanatory content. Prepare one clearly labelled manual AdSense placement without loading a Google script, reserving space, or changing privacy behaviour until valid configuration and operating prerequisites exist.

## Context and constraints

- The nine calculator routes are statically exported by Next.js 16 and must remain runnable from `out/` without a server or API.
- Inputs and results must stay in browser memory. They must not enter URLs, browser storage, analytics payloads, or application network requests.
- Existing calculations, field labels, validation, guide content, structured data, canonical URLs, analytics events, and related-calculator links remain unchanged.
- `NEXT_PUBLIC_*` values are embedded at build time. The advertiser client ID and slot ID are public identifiers, but must still be validated before any Google request is emitted.
- A missing ID, a development build, or a missing slot means no AdSense script, no `ins` element, and no empty ad reservation in the DOM.
- The service currently lacks confirmed operator/contact information. AdSense must remain disabled until operator details, a reachable contact channel, the relevant consent policy, AdSense approval, a client ID, and a manual slot ID are all supplied and reviewed.

## User experience

Each calculator page retains its breadcrumb and title, but promotes the work area into an explicitly labelled calculator surface. On wide screens, the input card and result panel form a two-column grid. The result column is sticky only while it fits in the viewport; before a calculation it explains that results will appear there, and after a calculation it gives the existing summary, rows, tables, copy control, and disclaimer visual priority. On small screens, the natural DOM order is preserved: form, result, link sharing, then explanatory material.

The form groups fields visually by available layout rather than changing the calculator definitions or data model. It uses a more distinct card header, consistent control height, generous card padding, and a full-width primary action. Reset stays visibly secondary. The result panel uses a contrasting soft accent surface, a compact status label, tabular numbers, and a stable empty state; errors and keyboard interaction retain their existing accessible behaviour.

The guide and related-calculator sections remain below the interactive area. The result-ad placement sits after the complete calculation result and before link sharing/long-form guidance, never between a field and its label, between the calculate/reset controls, or adjacent to a result value in a way that looks like a UI control. Its label says `광고`.

## AdSense integration boundary

Create a single client `AdSlot` component and server-safe configuration helper:

- `getAdSenseConfig(environment, clientId, resultSlotId)` validates production environment, `ca-pub-` client shape, and numeric manual slot ID. It returns `undefined` otherwise.
- The root layout reads that config. When valid, it uses Next `Script` to load the standard AdSense loader once, asynchronously, with the validated client ID. When invalid, it emits no advertising script.
- `AdSlot` is rendered after a result only when valid configuration exists. It creates exactly one labelled responsive `ins.adsbygoogle` slot and requests fill from an effect after hydration. The effect contains no calculator input, result, page URL, analytics value, or user identifier.
- The layout uses a conservative min-height only after the actual ad component is enabled, preventing a blank gap during the current ID-less state. Empty/unfilled ads remain non-interactive and labelled; final live-ad CLS and completion-rate validation is an operational requirement, not a local test claim.
- The privacy page changes from “there are no ad scripts” to a conditional, accurate disclosure: no ad script is loaded unless the approved production configuration is enabled; when it is, Google advertising can process device/cookie information under the reviewed consent policy. It must continue to state that calculator values are not included.
- `.env.example`, release checklist, and README document the two identifiers, build-time activation rule, and live prerequisites. No secret or third-party identifier is committed.

## Components and data flow

`CalculatorPage` remains the static wrapper for title, metadata, breadcrumb, guide, and related content. Its workspace markup gains layout containers only. `CalculatorClient` owns result state as today and passes it to `ResultPanel`; `ResultPanel` hosts both the deliberate pre-result state and the post-result `AdSlot`, so an ad cannot appear before a user has calculated.

Configuration lives in an isolated `lib/adsense/config.ts` helper. The only browser-global AdSense access is isolated in `components/adsense/AdSlot.tsx`; the privacy source gate explicitly treats this narrowly scoped, reviewed advertising boundary separately from the calculator privacy boundary. No other component receives publisher IDs or directly accesses `adsbygoogle`.

## Accessibility and resilience

- Sections have descriptive accessible names and retain a polite live region for the result.
- The pre-result message is ordinary instructional text and does not announce repeatedly.
- The ad container is identified as advertising, is never styled as a calculation action, and is omitted entirely when disabled.
- Script or fill failures are swallowed locally: calculating, copying, reset, and content navigation remain functional.
- Grid and sticky styling disable at the mobile breakpoint, preserve 44px touch targets, and cannot create horizontal overflow.

## Tests and verification

- Add pure unit tests for disabled, invalid, and valid AdSense configuration.
- Add component tests proving an ID-less build renders neither an ad slot nor a loader-dependent placeholder; prove valid configuration renders a labelled slot only after a result.
- Update calculator-page/result-panel tests for the pre-result state, result hierarchy, and post-result slot position.
- Extend the source privacy gate and tests so direct advertising globals are rejected outside `AdSlot`, while calculator values remain rejected from ad/analytics paths.
- Run lint, privacy/catalog gates, component and unit tests, static export, static checks, and desktop/mobile Playwright journeys. Inspect the rendered desktop and mobile calculator surface. A later production run with approved IDs must additionally verify consent, policy text, network requests, ad fill, CLS, and calculator completion rate.

## Explicitly out of scope

- Applying to AdSense, creating publisher/slot IDs, accepting terms, creating a Google account, or activating live advertisements.
- Inventing legal operator details, contact details, consent language, or a jurisdiction-specific CMP.
- Altering calculator formulas, adding data collection, adding server endpoints, or changing GA event payloads.
- Copying the reference site’s brand, copy, data fields, affiliate ads, or source code.
