import { describe, expect, it } from 'vitest';
import { calculatorCatalog, calculatorBySlug } from '@/lib/calculators/registry';
import { validateCalculatorCatalog } from '@/lib/calculators/catalog';

describe('calculator catalog', () => {
  it('accepts the complete catalog and rejects incomplete release content', () => {
    expect(validateCalculatorCatalog(calculatorCatalog)).toEqual([]);
    const fixture = structuredClone(calculatorCatalog);
    fixture[0].guide.sources = [];
    fixture[1].route = fixture[0].route;
    fixture[2].relatedSlugs = ['unknown-calculator'];
    fixture[3].guide.examples = [];
    fixture[4].lastReviewed = '2026-02-31';
    fixture[5].guide.limitations = [];
    const errors = validateCalculatorCatalog(fixture);
    expect(errors).toContain('maintenance-cost: at least one source is required');
    expect(errors).toContain('duplicate route: /car/maintenance-cost/');
    expect(errors).toContain('ev-charging-cost: unknown related slug unknown-calculator');
    expect(errors).toContain('purchase-cost: at least two examples are required');
    expect(errors).toContain('installment: invalid review date');
    expect(errors).toContain('loan-interest: limitations are required');
    expect(validateCalculatorCatalog(fixture.slice(1))).toContain('expected exactly 9 calculators');
  });
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
