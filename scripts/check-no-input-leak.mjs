import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// These two reviewed boundaries map catalog metadata / validated enums to GA.
// Changes fail closed: review payloads and browser tests before updating a hash.
const reviewedBoundaries = {
  'lib/analytics/events.ts': 'feeddad750e057560672b91c6098644ab97640911e7a23bd6c17e6ada962c3a7',
  'components/analytics/GoogleAnalytics.tsx': '11c6791d9fa33cff843138e8432da74f260806efddd9ac6982d7225813499167',
};
const prohibited = new Set(['URLSearchParams', 'localStorage', 'sessionStorage', 'fetch', 'sendBeacon', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB']);
const events = new Set(['calculator_view', 'calculator_start', 'calculator_submit', 'calculator_result', 'calculator_reset', 'related_calculator_click', 'share']);
const optionValues = { source: new Set(['copy_result', 'copy_link', 'related']), result_type: new Set(['success', 'error']) };

export function scanSource(file, source) {
  const errors = [];
  if (/(?:^|\/)api\//.test(file) || /(?:^|\/)route\.[cm]?[jt]sx?$/.test(file)) errors.push(`${file}: backend/API routes are forbidden`);
  const approved = reviewedBoundaries[file];
  if (approved) {
    if (createHash('sha256').update(source).digest('hex') !== approved) errors.push(`${file}: analytics boundary changed; review whitelist and payload tests`);
    return errors;
  }
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isStringLiteral(node) && node.text === 'use server') errors.push(`${file}: server actions are forbidden`);
    if ((ts.isIdentifier(node) || ts.isStringLiteral(node)) && prohibited.has(node.text)) errors.push(`${file}: prohibited ${node.text}`);
    if (ts.isPropertyAccessExpression(node) && /(?:^|\.)location$/.test(node.expression.getText(ast)) && ['search', 'hash', 'href'].includes(node.name.text)) errors.push(`${file}: full URL/query access is forbidden`);
    if ((ts.isIdentifier(node) || ts.isStringLiteral(node)) && ['gtag', 'dataLayer'].includes(node.text)) errors.push(`${file}: direct analytics access outside reviewed boundary`);
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'trackCalculatorEvent') {
      const [event, slug, options] = node.arguments;
      if (!event || !ts.isStringLiteral(event) || !events.has(event.text) || !slug || !['slug', 'calculator.slug'].includes(slug.getText(ast)) || node.arguments.length > 3) errors.push(`${file}: tracker requires whitelisted event and catalog slug`);
      if (options && (!ts.isObjectLiteralExpression(options) || options.properties.some((property) => {
        if (!ts.isPropertyAssignment(property)) return true;
        const key = property.name.getText(ast).replace(/['"]/g, '');
        return !ts.isStringLiteral(property.initializer) || !optionValues[key]?.has(property.initializer.text);
      }))) errors.push(`${file}: tracker options must contain only whitelisted literal values`);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return [...new Set(errors)];
}

export function checkPrivacy(root = process.cwd()) {
  const errors = [];
  let count = 0;
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
        count++;
        errors.push(...scanSource(relative(root, path).replaceAll('\\', '/'), readFileSync(path, 'utf8')));
      }
    }
  }
  for (const directory of ['app', 'components', 'lib', 'content']) walk(resolve(root, directory));
  return { errors, count };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { errors, count } = checkPrivacy();
  errors.forEach((error) => console.error(error));
  if (errors.length) process.exitCode = 1;
  else console.log(`Privacy OK: ${count} application modules; literal event options and reviewed GA boundaries.`);
}
