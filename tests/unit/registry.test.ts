import { describe, expect, it } from 'vitest';
import { calculatorCategories } from '@/lib/calculators/categories';
import { calculatorCatalog, calculatorBySlug, getCalculatorsByCategory } from '@/lib/calculators/registry';
import { validateCalculatorCatalog } from '@/lib/calculators/catalog';
import type { CalculatorCatalogEntry } from '@/lib/calculators/types';

const categorySlugs = new Set(calculatorCategories.map(({ slug }) => slug));

describe('calculator catalog', () => {
  it('publishes all 78 planned routes including every remaining category entry', () => {
    expect(calculatorCatalog).toHaveLength(78);
    const remaining = {
      car: ['lease-vs-purchase', 'rental-vs-lease', 'depreciation', 'total-ownership-cost', 'highway-toll-budget'],
      health: ['bmi', 'bmr', 'daily-calories', 'macro-nutrients', 'target-weight', 'running-pace', 'walking-calories', 'water-intake'],
      life: ['dday', 'date-between', 'date-offset', 'weekday', 'international-age', 'korean-age', 'zodiac', 'percentage', 'household-split', 'electricity-estimate', 'phone-plan-cost', 'tip-split'],
      education: ['gpa', 'grade-conversion', 'study-plan', 'lottery-numbers', 'random-picker', 'unit-conversion', 'fuel-efficiency-conversion', 'time-zone-comparison'],
    } as const;
    for (const category of Object.keys(remaining) as Array<keyof typeof remaining>) {
      for (const slug of remaining[category]) expect(calculatorBySlug.get(slug)?.route).toBe(`/${category}/${slug}/`);
    }
  });
  it('publishes the exact property and business routes', () => {
    const expected = {
      realestate: ['acquisition-tax', 'brokerage-fee', 'deposit-rent-conversion', 'rent-vs-deposit', 'moving-budget', 'one-person-setup-budget', 'housing-affordability', 'rental-yield', 'holding-cost-checklist'],
      business: ['vat', 'margin', 'markup', 'break-even', 'sales-commission', 'online-market-settlement', 'freelancer-net-income', 'monthly-profit-loss', 'business-feasibility', 'discount-rate'],
    } as const;
    for (const category of ['realestate', 'business'] as const) {
      expect(getCalculatorsByCategory(category).map(({ slug }) => slug).sort()).toEqual([...expected[category]].sort());
      for (const slug of expected[category]) expect(calculatorBySlug.get(slug)?.route).toBe(`/${category}/${slug}/`);
    }
  });
  it('registers all eight finance planning calculators', () => {
    expect(getCalculatorsByCategory('finance').map(({ slug }) => slug)).toEqual(expect.arrayContaining([
      'savings-maturity', 'deposit-interest', 'loan-affordability', 'dsr', 'dti', 'ltv', 'card-instalment', 'manual-exchange-rate',
    ]));
  });
  it('accepts the complete catalog and rejects incomplete release content', () => {
    expect(validateCalculatorCatalog(calculatorCatalog, categorySlugs)).toEqual([]);
    const fixture = structuredClone(calculatorCatalog);
    fixture[0].guide.sources = [];
    fixture[1].route = fixture[0].route;
    fixture[2].relatedSlugs = ['unknown-calculator'];
    fixture[3].guide.examples = [];
    fixture[4].lastReviewed = '2026-02-31';
    fixture[5].guide.limitations = [];
    const errors = validateCalculatorCatalog(fixture, categorySlugs);
    expect(errors).toContain('maintenance-cost: at least one source is required');
    expect(errors).toContain('duplicate route: /car/maintenance-cost/');
    expect(errors).toContain('ev-charging-cost: unknown related slug unknown-calculator');
    expect(errors).toContain('purchase-cost: at least two examples are required');
    expect(errors).toContain('installment: invalid review date');
    expect(errors).toContain('loan-interest: limitations are required');
    const standalone = structuredClone(calculatorCatalog.slice(0, 1));
    standalone[0].relatedSlugs = [];
    expect(validateCalculatorCatalog(standalone, categorySlugs)).toEqual([]);
  });
  it('registers a non-empty catalog with distinct routes', () => {
    expect(calculatorCatalog.length).toBeGreaterThan(0);
    expect(new Set(calculatorCatalog.map((calculator) => calculator.route)).size).toBe(
      calculatorCatalog.length,
    );
  });

  it('rejects a calculator assigned to an unregistered category', () => {
    const fixture = structuredClone(calculatorCatalog) as CalculatorCatalogEntry[];
    fixture[0] = {
      ...fixture[0],
      category: 'unknown' as CalculatorCatalogEntry['category'],
      route: '/unknown/maintenance-cost/',
    };

    expect(validateCalculatorCatalog(fixture, categorySlugs)).toContain(
      'maintenance-cost: invalid canonical route',
    );
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
