import { describe, expect, it } from 'vitest';
import { calculatorCatalog, calculatorBySlug } from '@/lib/calculators/registry';

describe('calculator catalog', () => {
  it('registers the nine distinct P0 routes', () => {
    expect(calculatorCatalog).toHaveLength(9);
    expect(new Set(calculatorCatalog.map((calculator) => calculator.route)).size).toBe(9);
  });

  it('uses a unique slug for every calculator', () => {
    expect(new Set(calculatorCatalog.map((calculator) => calculator.slug)).size).toBe(
      calculatorCatalog.length,
    );
  });

  it('links related calculators only to registered calculators', () => {
    for (const calculator of calculatorCatalog) {
      for (const relatedSlug of calculator.relatedSlugs) {
        expect(calculatorBySlug.get(relatedSlug)).toBeDefined();
      }
    }
  });

  it('provides reviewable guide content for every P0 page', () => {
    for (const calculator of calculatorCatalog) {
      expect(calculator.title).not.toHaveLength(0);
      expect(calculator.guide.formula).not.toHaveLength(0);
      expect(calculator.guide.examples.length).toBeGreaterThan(0);
      expect(calculator.guide.limitations.length).toBeGreaterThan(0);
      expect(calculator.guide.sources.length).toBeGreaterThan(0);
      expect(calculator.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
