import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import { calculatorCatalog, getCalculatorsByCategory } from '@/lib/calculators/registry';
import { productionOrigin } from '@/lib/seo/site';

describe('sitemap', () => {
  it('includes every category hub alongside its registered calculator pages', () => {
    const entries = sitemap();

    expect(entries.some(({ url }) => url.endsWith('/salary/'))).toBe(true);
    expect(entries.filter(({ url }) => url.includes('/car/'))).toHaveLength(
      getCalculatorsByCategory('car').length + 1,
    );
  });

  it('uses each catalog review date for its calculator URL', () => {
    const entries = sitemap();

    for (const calculator of calculatorCatalog) {
      expect(entries).toContainEqual({
        url: productionOrigin + calculator.route,
        lastModified: calculator.lastReviewed,
      });
    }
  });
});
