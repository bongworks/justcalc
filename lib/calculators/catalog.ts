import type { CalculatorCatalogEntry } from './types';

export function validateCalculatorCatalog(
  definitions: ReadonlyArray<CalculatorCatalogEntry>,
  categorySlugs: ReadonlySet<string>,
): string[] {
  const errors: string[] = [];
  for (const key of ['slug', 'route', 'title'] as const) {
    const seen = new Set<string>();
    for (const entry of definitions) {
      if (!entry[key]?.trim()) errors.push(`${entry.slug}: missing ${key}`);
      if (seen.has(entry[key])) errors.push(`duplicate ${key}: ${entry[key]}`);
      seen.add(entry[key]);
    }
  }
  const slugs = new Set(definitions.map(({ slug }) => slug));
  for (const entry of definitions) {
    const fail = (message: string) => errors.push(`${entry.slug}: ${message}`);
    if (!categorySlugs.has(entry.category) || !/^[a-z]+(?:-[a-z]+)*$/.test(entry.slug) || entry.route !== `/${entry.category}/${entry.slug}/`) fail('invalid canonical route');
    if (!entry.description?.trim() || !entry.guide?.formula?.trim()) fail('description and formula are required');
    if (!entry.guide?.examples || entry.guide.examples.length < 2 || entry.guide.examples.some(({ title, text }) => !title.trim() || !text.trim())) fail('at least two examples are required');
    if (!entry.guide?.sources?.length || entry.guide.sources.some(({ label, href }) => !label.trim() || !/^https:\/\//.test(href))) fail('at least one source is required');
    if (!entry.guide?.limitations?.length || entry.guide.limitations.some((value) => !value.trim())) fail('limitations are required');
    const date = new Date(`${entry.lastReviewed}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.lastReviewed) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== entry.lastReviewed) fail('invalid review date');
    for (const slug of entry.relatedSlugs) if (!slugs.has(slug)) fail(`unknown related slug ${slug}`);
  }
  return errors;
}
