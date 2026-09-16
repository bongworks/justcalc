// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanSource } from '../../scripts/check-no-input-leak.mjs';
import { checkStaticOutput, validateStaticPage } from '../../scripts/check-static-output.mjs';

describe('privacy source gate', () => {
  it.each([
    'fetch("/collect", {body: JSON.stringify(raw)})',
    'window.localStorage.setItem("value", input)',
    'sessionStorage.setItem("value", result)',
    'new URLSearchParams(raw)',
    'navigator.sendBeacon("/collect", result)',
    'window.location.search',
    'window["localStorage"].setItem("value", raw)',
    'trackCalculatorEvent("share", slug, { source: raw.amount })',
    'trackCalculatorEvent("share", slug, { ...result })',
    'window.gtag("event", "leak", raw)',
    'window.dataLayer.push(result)',
    'history.pushState(null, "", "?income=" + raw.income)',
    'window.history["replaceState"]({}, "", resultUrl)',
    'location["search"] = raw.amount',
    'window["location"]["href"] = resultUrl',
    'window.location[key] = raw.amount',
    'window.location = resultUrl',
    'location.assign(resultUrl)',
    'new FormData(form)',
    'form.submit()',
    'form.requestSubmit()',
    '<form method="get" onSubmit={submit}><input name="amount" /></form>',
    '<form><input name="amount" /></form>',
    '<form action={resultUrl} onSubmit={submit}><input name="amount" /></form>',
  ])('rejects input transmission path: %s', (source) => {
    expect(scanSource('components/calculator/Fixture.tsx', source).length).toBeGreaterThan(0);
  });

  it('scans helpers and analytics, while allowing static SEO and whitelisted event literals', () => {
    expect(scanSource('lib/calculators/helper.ts', 'fetch("/leak")').length).toBeGreaterThan(0);
    expect(scanSource('lib/analytics/events.ts', 'gtag("event", "leak", result)').length).toBeGreaterThan(0);
    expect(scanSource('lib/seo/site.ts', 'const page = { route: "/car/fuel-cost/", title: "계산기" };')).toEqual([]);
    expect(scanSource('components/calculator/Fixture.tsx', 'trackCalculatorEvent("share", slug, { source: "copy_link" });')).toEqual([]);
    expect(scanSource('components/calculator/Fixture.tsx', '<a href="/car/fuel-cost/">계산기</a>; const url = window.location.origin + window.location.pathname;')).toEqual([]);
  });
  it('rejects backend routes and server actions', () => {
    expect(scanSource('app/api/collect/route.ts', 'export function GET() {}')).toContain('app/api/collect/route.ts: backend/API routes are forbidden');
    expect(scanSource('lib/action.ts', '"use server";')).toContain('lib/action.ts: server actions are forbidden');
  });
});

const page = { route: '/car/fuel-cost/', title: '유류비·연비 계산기' };
const origin = 'https://calc.bongworks.co.kr';
const html = `<html lang="ko"><head><title>${page.title}</title><meta name="description" content="계산 안내"><link rel="canonical" href="${origin}${page.route}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","url":"${origin}${page.route}"}</script></head><body><h1>${page.title}</h1></body></html>`;

describe('static output gate', () => {
  const fixtures: string[] = [];
  afterEach(() => fixtures.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));
  it('accepts canonical static HTML, and rejects noindex, query canonical and missing JSON-LD', () => {
    expect(validateStaticPage(html, page, false)).toEqual([]);
    expect(validateStaticPage(html.replace('</head>', '<meta name="robots" content="noindex"></head>'), page, false)).toContain(`${page.route}: noindex is forbidden`);
    expect(validateStaticPage(html.replace('rel="canonical" href="', 'rel="canonical" href="https://wrong.example/?input='), page, false)).toContain(`${page.route}: canonical must equal ${origin}${page.route}`);
    expect(validateStaticPage(html.replace('application/ld+json', 'text/plain'), page, false)).toContain(`${page.route}: matching WebPage JSON-LD is required`);
  });
  it('rejects GA script in a release without a measurement ID', () => {
    expect(validateStaticPage(html.replace('</head>', '<script id="ga-bootstrap">window.gtag()</script></head>'), page, false)).toContain(`${page.route}: GA must be absent without a measurement ID`);
  });
  it.each([
    ['robots', 'none'],
    ['GoogleBot', 'NOINDEX, follow'],
    ['bingbot', 'noindex'],
    ['naverbot', 'none'],
    ['yeti', 'noindex'],
  ])('rejects indexing restrictions for %s: %s', (name, content) => {
    const fixture = html.replace('</head>', `<meta name="${name}" content="${content}"></head>`);
    expect(validateStaticPage(fixture, page, false)).toContain(`${page.route}: noindex is forbidden`);
  });
  it.each([
    'User-agent: *\nDisallow: /car/',
    'User-agent: *\nDisallow: /*cost/',
    'User-agent: *\nDisallow: /finance/*$',
    'User-agent: Googlebot\nDisallow: /privacy/\n\nUser-agent: *\nAllow: /',
    'User-agent: *\nDisallow: /car/\nAllow: /car/fuel-cost/',
  ])('rejects robots rules blocking any canonical route: %s', (rules) => {
    const directory = mkdtempSync(join(tmpdir(), 'justcalc-robots-fixture-'));
    fixtures.push(directory);
    writeFileSync(join(directory, 'robots.txt'), `${rules}\nSitemap: ${origin}/sitemap.xml`);
    expect(checkStaticOutput(directory).errors).toContain('robots must allow indexing and reference canonical sitemap');
  });
  it.each([
    'User-agent: *\nDisallow: /private/',
    'User-agent: *\nDisallow: /car/\nAllow: /car/',
    'User-agent: *\nDisallow: /car/unknown/$',
  ])('allows harmless disallows and equal-length allow precedence: %s', (rules) => {
    const directory = mkdtempSync(join(tmpdir(), 'justcalc-robots-fixture-'));
    fixtures.push(directory);
    writeFileSync(join(directory, 'robots.txt'), `${rules}\nSitemap: ${origin}/sitemap.xml`);
    expect(checkStaticOutput(directory).errors).not.toContain('robots must allow indexing and reference canonical sitemap');
  });
  it('rejects missing HTML, policies and assets, wrong sitemap, robots and server artifacts', () => {
    const directory = mkdtempSync(join(tmpdir(), 'justcalc-static-fixture-'));
    fixtures.push(directory);
    mkdirSync(join(directory, 'api'));
    writeFileSync(join(directory, 'sitemap.xml'), '<urlset><url><loc>https://wrong.example/</loc></url></urlset>');
    writeFileSync(join(directory, 'robots.txt'), 'Disallow: /');
    const { errors } = checkStaticOutput(directory);
    expect(errors).toContain('missing static artifact: /car/fuel-cost/index.html');
    expect(errors).toContain('missing static artifact: /privacy/index.html');
    expect(errors).toContain('missing static artifact: og-default.png');
    expect(errors).toContain('sitemap must contain exactly the 15 canonical routes');
    expect(errors).toContain('robots must allow indexing and reference canonical sitemap');
    expect(errors).toContain('server artifact is forbidden: api');
  });
});
