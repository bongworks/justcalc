import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Reviewed boundaries map catalog metadata / enums and four bounded UTM codes to GA.
// Changes fail closed: review payloads and browser tests before updating a hash.
const reviewedBoundaries = {
  'lib/analytics/events.ts': 'feeddad750e057560672b91c6098644ab97640911e7a23bd6c17e6ada962c3a7',
  'components/analytics/GoogleAnalytics.tsx': 'ef091b40aaf6d6d19bb77348f41b561d41f8d752edac6f7a64474490ebc15ccf',
};
const prohibited = new Set(['URLSearchParams', 'localStorage', 'sessionStorage', 'fetch', 'sendBeacon', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB', 'pushState', 'replaceState', 'FormData']);
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
  function accessPath(node) {
    if (ts.isIdentifier(node)) return [node.text];
    if (ts.isPropertyAccessExpression(node)) return [...accessPath(node.expression), node.name.text];
    if (ts.isElementAccessExpression(node)) return [...accessPath(node.expression), ts.isStringLiteral(node.argumentExpression) ? node.argumentExpression.text : '*'];
    return [];
  }
  function visit(node) {
    if (ts.isStringLiteral(node) && node.text === 'use server') errors.push(`${file}: server actions are forbidden`);
    if ((ts.isIdentifier(node) || ts.isStringLiteral(node)) && prohibited.has(node.text)) errors.push(`${file}: prohibited ${node.text}`);
    if (ts.isIdentifier(node) && ['window', 'globalThis', 'self'].includes(node.text)) {
      const parent = node.parent;
      // Whole browser globals must not escape into aliases, casts or callbacks.
      // Direct member receivers and availability checks do not acquire an alias.
      const directUse = ((ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) && parent.expression === node) || ts.isTypeOfExpression(parent);
      if (!directUse) errors.push(`${file}: browser global object acquisition is forbidden`);
    }
    if ((ts.isIdentifier(node) || ts.isStringLiteral(node)) && node.text === 'location') {
      const member = node.parent;
      // Permit only these complete scalar reads, never the Location object itself.
      // Reject acquisition before an alias can hide subsequent query access.
      const safeRead = ts.isPropertyAccessExpression(member) && member.name === node &&
        ts.isIdentifier(member.expression) && member.expression.text === 'window' &&
        ts.isPropertyAccessExpression(member.parent) && member.parent.expression === member &&
        ['origin', 'pathname'].includes(member.parent.name.text);
      if (!safeRead) errors.push(`${file}: location object acquisition is forbidden`);
    }
    if (ts.isElementAccessExpression(node) && ['window', 'globalThis', 'self'].includes(node.expression.getText(ast)) && !ts.isStringLiteral(node.argumentExpression)) errors.push(`${file}: dynamic browser global access is forbidden`);
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const path = accessPath(node);
      if (path.includes('location') && path.at(-1) !== 'location' && !['origin', 'pathname'].includes(path.at(-1))) errors.push(`${file}: full URL/query access or navigation is forbidden`);
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && node.operatorToken.kind <= ts.SyntaxKind.LastAssignment && accessPath(node.left).includes('location')) errors.push(`${file}: location writes are forbidden`);
    if (ts.isCallExpression(node) && (ts.isPropertyAccessExpression(node.expression) || ts.isElementAccessExpression(node.expression)) && ['submit', 'requestSubmit'].includes(accessPath(node.expression).at(-1))) errors.push(`${file}: native form submission is forbidden`);
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(ast) === 'form') {
      const attributes = node.attributes.properties;
      const names = attributes.filter(ts.isJsxAttribute).map((attribute) => attribute.name.getText(ast));
      if (!names.includes('onSubmit') || names.includes('action') || names.includes('method') || attributes.some(ts.isJsxSpreadAttribute)) errors.push(`${file}: native form serialization is forbidden; use the guarded local submit handler`);
    }
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
