import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { JSDOM } from 'jsdom';
import { calculators } from '../content/calculators.ts';
import { homePage, policyPages, productionOrigin } from '../lib/seo/site.ts';

export function validateStaticPage(html, page, gaEnabled) {
  const errors = [];
  const doc = new JSDOM(html).window.document;
  const fail = (message) => errors.push(`${page.route}: ${message}`);
  const canonical = productionOrigin + page.route;
  const links = doc.querySelectorAll('link[rel="canonical"]');
  if (links.length !== 1 || links[0].getAttribute('href') !== canonical) fail(`canonical must equal ${canonical}`);
  if ([...doc.querySelectorAll('meta[name="robots"]')].some((meta) => /noindex/i.test(meta.content))) fail('noindex is forbidden');
  if (!doc.title || !doc.querySelector('meta[name="description"]')?.content || !doc.querySelector('h1')) fail('title, description and rendered h1 are required');
  const data = [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap((script) => {
    try { const item = JSON.parse(script.textContent); return Array.isArray(item) ? item : [item]; } catch { fail('invalid JSON-LD'); return []; }
  });
  if (!data.some((item) => item['@type'] === 'WebPage' && item.url === canonical)) fail('matching WebPage JSON-LD is required');
  if (!gaEnabled && /ga-bootstrap|googletagmanager\.com\/gtag\/js/.test(html)) fail('GA must be absent without a measurement ID');
  return errors;
}

export function checkStaticOutput(directory = resolve('out'), gaEnabled = false) {
  const errors = [];
  for (const artifact of ['api', 'server.js', '.next', 'node_modules']) {
    if (existsSync(resolve(directory, artifact))) errors.push(`server artifact is forbidden: ${artifact}`);
  }
  const pages = [homePage, ...policyPages, ...calculators];
  let maxJs = 0;
  let maxCss = 0;
  for (const page of pages) {
    const file = resolve(directory, `.${page.route}`, 'index.html');
    if (!existsSync(file)) { errors.push(`missing static artifact: ${page.route}index.html`); continue; }
    const html = readFileSync(file, 'utf8');
    errors.push(...validateStaticPage(html, page, gaEnabled));
    const doc = new JSDOM(html).window.document;
    for (const [selector, attribute, budget] of [['script[src]', 'src', 300 * 1024], ['link[rel="stylesheet"]', 'href', 30 * 1024]]) {
      const assets = new Set([...doc.querySelectorAll(selector)].map((item) => item.getAttribute(attribute)).filter((url) => url.startsWith('/')));
      let total = 0;
      for (const asset of assets) {
        const path = resolve(directory, `.${asset.split('?')[0]}`);
        if (!existsSync(path)) errors.push(`${page.route}: missing asset ${asset}`);
        else total += gzipSync(readFileSync(path)).length;
      }
      if (total > budget) errors.push(`${page.route}: ${attribute === 'src' ? 'JS' : 'CSS'} gzip budget exceeded (${total} > ${budget})`);
      if (attribute === 'src') maxJs = Math.max(maxJs, total); else maxCss = Math.max(maxCss, total);
    }
  }
  const required = ['robots.txt', 'sitemap.xml', '404.html', 'favicon.svg', 'og-default.png'];
  for (const file of required) if (!existsSync(resolve(directory, file))) errors.push(`missing static artifact: ${file}`);
  if (existsSync(resolve(directory, 'sitemap.xml'))) {
    const sitemap = new JSDOM(readFileSync(resolve(directory, 'sitemap.xml'), 'utf8'), { contentType: 'text/xml' });
    const urls = [...sitemap.window.document.querySelectorAll('loc')].map((node) => node.textContent);
    const expected = pages.map(({ route }) => productionOrigin + route);
    if (urls.length !== 15 || new Set(urls).size !== 15 || expected.some((url) => !urls.includes(url))) errors.push('sitemap must contain exactly the 15 canonical routes');
  }
  if (existsSync(resolve(directory, 'robots.txt'))) {
    const robots = readFileSync(resolve(directory, 'robots.txt'), 'utf8');
    if (!robots.includes(`Sitemap: ${productionOrigin}/sitemap.xml`) || /^Disallow:\s*\/$/m.test(robots)) errors.push('robots must allow indexing and reference canonical sitemap');
  }
  for (const category of ['car', 'finance', 'life']) {
    const folder = resolve(directory, category);
    const actual = existsSync(folder) ? readdirSync(folder, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => `/${category}/${entry.name}/`) : [];
    if (actual.length !== calculators.filter((entry) => entry.category === category).length || actual.some((route) => !calculators.some((entry) => entry.route === route))) errors.push(`${category}: exported calculator routes differ from catalog`);
  }
  return { errors, maxJs, maxCss, pageCount: pages.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = checkStaticOutput(resolve('out'), process.argv.includes('--ga-fixture'));
  result.errors.forEach((error) => console.error(error));
  if (result.errors.length) process.exitCode = 1;
  else console.log(`Static export OK: ${result.pageCount} canonical HTML pages (9 calculators, 5 policy pages, home), robots/sitemap/assets; max gzip JS ${result.maxJs} B / CSS ${result.maxCss} B; GA ${process.argv.includes('--ga-fixture') ? 'fixture permitted' : 'absent'}.`);
}
