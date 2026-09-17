# Everyday, Property, Business, and Vehicle Calculators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Complete the local-only catalogue with property, business, vehicle, health, life/date, education, and unit calculators.

**Architecture:** Each domain has pure Decimal or date-only modules, then typed form definitions and editorial entries. Repeated percentage, split, and unit arithmetic is shared only when the input/output contract is identical. Every calculation remains deterministic from user input.

**Tech Stack:** TypeScript, Decimal.js, Next.js static export, Vitest, Playwright.

**Spec:** docs/superpowers/specs/2026-09-17-calculator-catalog-expansion-design.md

## Global Constraints

- Complete platform foundation and salary/finance plans first.
- Do not represent tax, utility, loan, or property outputs as official quotes or approvals.
- Require user input for rates, fees, and local policy limits unless a reviewed source supports a checked-in rule.
- Date inputs use ISO yyyy-mm-dd and must reject invalid calendar dates.

---

### Task 1: Property and business math modules

**Files:**
- Create: lib/realestate/costs.ts
- Create: lib/business/profit.ts
- Create: tests/unit/realestate/costs.test.ts
- Create: tests/unit/business/profit.test.ts

**Interfaces:**
- calculateBrokerageFee({ transactionWon, ratePercent, capWon }) returns min(transaction × rate / 100, cap).
- calculateDepositRentConversion({ depositWon, conversionRatePercent, months }) returns deposit × rate / 100 × months / 12.
- calculateRentComparison({ depositWon, monthlyRentWon, conversionRatePercent }) returns monthly equivalent rent.
- calculateRentalYield({ annualRentWon, purchaseWon, annualCostsWon }) returns max(annual rent - costs, 0) / purchase × 100.
- calculateVat({ supplyWon, ratePercent, includesVat }) returns supply, VAT, and total.
- calculateMargin({ salesWon, costWon }) and calculateMarkup({ salesWon, costWon }) return zero when the denominator is zero.
- calculateBreakEven({ fixedCostWon, unitPriceWon, variableCostWon }) returns null when unit price is not greater than variable cost.
- calculateCommissionSettlement({ grossSalesWon, platformFeePercent, paymentFeePercent, shippingWon }) returns deductions and settlement.

- [ ] **Step 1: Write failing boundary tests**

~~~ts
test('brokerage fee respects a cap', () => {
  expect(calculateBrokerageFee({ transactionWon: d(100000000), ratePercent: d(0.9), capWon: d(500000) }).feeWon).toEqual(d(500000));
});
test('break-even is unavailable when contribution margin is zero', () => {
  expect(calculateBreakEven({ fixedCostWon: d(100000), unitPriceWon: d(10000), variableCostWon: d(10000) })).toBeNull();
});
test('rental yield is zero for zero purchase price', () => {
  expect(calculateRentalYield({ annualRentWon: d(12000000), purchaseWon: d(0), annualCostsWon: d(0) }).percent).toEqual(d(0));
});
~~~

- [ ] **Step 2: Run to verify failure**

Run: pnpm test tests/unit/realestate/costs.test.ts tests/unit/business/profit.test.ts

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement pure property/business modules**

Implement exact interfaces above using Decimal. Add acquisition-tax estimate as user-entered tax rate × purchase price; do not infer property class. Add moving and setup budgets as named-item sum functions. Add online-market fee settlement as a commission-settlement alias with an optional returns deduction.

- [ ] **Step 4: Verify**

Run: pnpm test tests/unit/realestate/costs.test.ts tests/unit/business/profit.test.ts

Expected: PASS with zero/negative-input parser coverage.

- [ ] **Step 5: Commit**

~~~bash
git add lib/realestate lib/business tests/unit/realestate tests/unit/business
git commit -m "feat: add property and business calculation modules"
~~~

### Task 2: Register property and business calculator pages

**Files:**
- Modify: content/calculators.ts
- Modify: lib/calculators/definitions.ts
- Modify: tests/unit/registry.test.ts
- Modify: tests/unit/definitions.test.ts

**Interfaces:**
- realestate slugs: acquisition-tax, brokerage-fee, deposit-rent-conversion, rent-vs-deposit, moving-budget, one-person-setup-budget, housing-affordability, rental-yield, holding-cost-checklist.
- business slugs: vat, margin, markup, break-even, sales-commission, online-market-settlement, freelancer-net-income, monthly-profit-loss, business-feasibility, discount-rate.

- [ ] **Step 1: Write failing catalogue test**

~~~ts
expect(getCalculatorsByCategory('realestate')).toHaveLength(9);
expect(getCalculatorsByCategory('business').map(({ slug }) => slug)).toEqual(expect.arrayContaining(['vat', 'margin', 'break-even']));
expect(getCalculatorBySlug('brokerage-fee')?.route).toBe('/realestate/brokerage-fee/');
~~~

- [ ] **Step 2: Run to verify failure**

Run: pnpm test tests/unit/registry.test.ts

Expected: FAIL because the catalogue only has car, finance, and life entries.

- [ ] **Step 3: Register definitions and guides**

Add input forms for every named interface. acquisition-tax, brokerage-fee, and housing-affordability must expose their rate/limit assumptions as inputs and guidance, not hard-coded local law. holding-cost-checklist is a calculator that sums explicit annual expense fields, never a regional tax prediction. Each entry includes source, two examples, limitations, review date, and related slugs.

- [ ] **Step 4: Verify catalogue content**

Run: pnpm check:catalog && pnpm test tests/unit/registry.test.ts tests/unit/definitions.test.ts

Expected: PASS with all related slugs resolving.

- [ ] **Step 5: Commit**

~~~bash
git add content/calculators.ts lib/calculators/definitions.ts tests/unit/registry.test.ts tests/unit/definitions.test.ts
git commit -m "feat: publish property and business calculators"
~~~

### Task 3: Vehicle, health, and exercise modules

**Files:**
- Create: lib/car/comparison.ts
- Create: lib/health/body.ts
- Create: tests/unit/car/comparison.test.ts
- Create: tests/unit/health/body.test.ts

**Interfaces:**
- calculateLeasePurchaseComparison({ purchaseMonthlyWon, leaseMonthlyWon, months, purchaseResidualWon, leaseInitialWon }) returns totals and difference.
- calculateDepreciation({ purchaseWon, residualWon, months }) returns total loss and monthly loss.
- calculateTotalOwnership({ purchaseCostWon, annualRunningWon, years, resaleWon }) returns ownership total.
- calculateBmi({ weightKg, heightCm }) returns kg/m²; calculateBmr({ sex, weightKg, heightCm, age }) uses the displayed Mifflin-St Jeor formula.
- calculateDailyCalories({ bmr, activityMultiplier, goalAdjustmentKcal }) returns target kcal.
- calculateMacroNutrients({ caloriesKcal, proteinPercent, carbPercent, fatPercent }) returns grams using 4/4/9 kcal per gram.
- calculateRunningPace({ distanceKm, seconds }) returns seconds per km; calculateWaterIntake({ weightKg, mlPerKg }) returns litres.

- [ ] **Step 1: Write failing formula tests**

~~~ts
test('BMI computes kg per square metre', () => {
  expect(calculateBmi({ weightKg: d(70), heightCm: d(175) }).value.toDecimalPlaces(2)).toEqual(d(22.86));
});
test('macros use 9 kcal per fat gram', () => {
  expect(calculateMacroNutrients({ caloriesKcal: d(1800), proteinPercent: d(20), carbPercent: d(50), fatPercent: d(30) }).fatGrams).toEqual(d(60));
});
test('ownership subtracts resale once', () => {
  expect(calculateTotalOwnership({ purchaseCostWon: d(30000000), annualRunningWon: d(3000000), years: 3, resaleWon: d(15000000) }).totalWon).toEqual(d(24000000));
});
~~~

- [ ] **Step 2: Run to verify failure**

Run: pnpm test tests/unit/car/comparison.test.ts tests/unit/health/body.test.ts

Expected: FAIL because comparison/body modules are absent.

- [ ] **Step 3: Implement modules**

Add rental-versus-lease as same-monthly-total comparison, highway toll budget as one-way toll × return trips, target weight as height-in-metres squared × target BMI, walking calories as user-entered kcal-per-km × kilometres. Reject impossible zero height/distance/time values.

- [ ] **Step 4: Verify**

Run: pnpm test tests/unit/car/comparison.test.ts tests/unit/health/body.test.ts

Expected: PASS.

- [ ] **Step 5: Commit**

~~~bash
git add lib/car lib/health tests/unit/car tests/unit/health
git commit -m "feat: add vehicle comparison and health modules"
~~~

### Task 4: Life, date, education, and unit modules

**Files:**
- Create: lib/life/date.ts
- Create: lib/life/everyday.ts
- Create: lib/education/study.ts
- Create: tests/unit/life/date.test.ts
- Create: tests/unit/life/everyday.test.ts
- Create: tests/unit/education/study.test.ts

**Interfaces:**
- calculateDaysBetween({ start, end }) returns signed calendar days; calculateDateOffset({ date, days }) returns ISO date; calculateInternationalAge({ birthDate, referenceDate }) returns completed years.
- calculatePercentage({ part, whole }) returns zero for a zero whole; calculateSplitExpense({ totalWon, people }) returns per-person and remainder.
- calculateElectricityEstimate({ kwh, wonPerKwh, baseWon }) returns kwh × unit cost + base; calculatePhonePlanCost({ monthlyWon, months, deviceWon, discountWon }) returns total.
- calculateGpa({ courses }) weights grade points by credits; calculateStudyPlan({ totalMinutes, days }) returns daily minutes; convertUnit({ value, from, to }) multiplies through a named base unit.

- [ ] **Step 1: Write failing tests**

~~~ts
test('date difference is calendar-based', () => {
  expect(calculateDaysBetween({ start: '2026-01-01', end: '2026-01-02' }).days).toBe(1);
});
test('expense split preserves a remainder', () => {
  expect(calculateSplitExpense({ totalWon: d(10000), people: 3 })).toMatchObject({ perPersonWon: d(3333), remainderWon: d(1) });
});
test('GPA is credit weighted', () => {
  expect(calculateGpa({ courses: [{ credits: d(3), gradePoint: d(4) }, { credits: d(1), gradePoint: d(2) }] }).gpa).toEqual(d(3.5));
});
~~~

- [ ] **Step 2: Run to verify failure**

Run: pnpm test tests/unit/life/date.test.ts tests/unit/life/everyday.test.ts tests/unit/education/study.test.ts

Expected: FAIL because date/everyday/study modules are absent.

- [ ] **Step 3: Implement local deterministic tools**

D-day is signed day difference with a clear today convention. Weekday derives from parsed ISO date in Korea calendar date terms. Korean age is reference year minus birth year plus one; zodiac is birth year modulo a fixed 12-animal array. Random picker/lottery use browser-only cryptographic random values only after a button event and never send choices; test their output uniqueness/range by injecting a deterministic random source. Unit conversion supports length, mass, temperature, fuel efficiency, and time-zone offset only from user-provided offsets.

- [ ] **Step 4: Verify**

Run: pnpm test tests/unit/life/date.test.ts tests/unit/life/everyday.test.ts tests/unit/education/study.test.ts && pnpm check:privacy

Expected: PASS with no storage/network API introduced.

- [ ] **Step 5: Commit**

~~~bash
git add lib/life lib/education tests/unit/life tests/unit/education
git commit -m "feat: add everyday date and education modules"
~~~

### Task 5: Register remaining calculator catalogue and perform end-to-end release validation

**Files:**
- Modify: content/calculators.ts
- Modify: lib/calculators/definitions.ts
- Modify: components/calculator/ResultPanel.tsx
- Modify: components/calculator/CalculatorClient.tsx
- Modify: tests/unit/definitions.test.ts
- Modify: tests/e2e/calculators.spec.ts
- Modify: tests/e2e/home.spec.ts
- Modify: tests/e2e/seo.spec.ts

**Interfaces:**
- car adds lease-vs-purchase, rental-vs-lease, depreciation, total-ownership-cost, highway-toll-budget.
- health adds bmi, bmr, daily-calories, macro-nutrients, target-weight, running-pace, walking-calories, water-intake.
- life adds dday, date-between, date-offset, weekday, international-age, korean-age, zodiac, percentage, household-split, electricity-estimate, phone-plan-cost, tip-split.
- education adds gpa, grade-conversion, study-plan, lottery-numbers, random-picker, unit-conversion, fuel-efficiency-conversion, time-zone-comparison.

- [ ] **Step 1: Write the failing end-to-end catalogue count and representative result tests**

~~~ts
expect(calculatorCatalog).toHaveLength(78);
expect(getCalculatorsByCategory('health').map(({ slug }) => slug)).toContain('bmi');
expect(getCalculatorsByCategory('education').map(({ slug }) => slug)).toContain('unit-conversion');
~~~

~~~ts
await page.goto('/health/bmi/');
await page.getByLabel('체중').fill('70');
await page.getByLabel('키').fill('175');
await page.getByRole('button', { name: '계산하기' }).click();
await expect(page.getByText(/22\.86/)).toBeVisible();
~~~

- [ ] **Step 2: Run to verify failure**

Run: pnpm test tests/unit/registry.test.ts tests/unit/definitions.test.ts && pnpm test:e2e -- tests/e2e/calculators.spec.ts

Expected: FAIL because remaining routes and entries are absent.

- [ ] **Step 3: Register every remaining calculator**

Add the slugs above with exact inputs/outputs from Tasks 3–4. Do not use manual result text for arithmetic that has a pure module. Enhance ResultPanel only for the stable row/table forms required by schedules and random results; preserve existing local copy behavior and no-input analytics event payloads. Ensure every entry has two examples, limitations, official/primary sources where applicable, and related links.

- [ ] **Step 4: Run complete verification**

Run: pnpm lint && pnpm check:catalog && pnpm check:privacy && pnpm test && NEXT_PUBLIC_GA_MEASUREMENT_ID='' pnpm build && pnpm check:static && pnpm test:e2e

Expected: all 78 static calculator routes, eight category hubs, sitemap metadata, desktop/mobile interactions, and local-only calculation checks pass.

- [ ] **Step 5: Commit**

~~~bash
git add content/calculators.ts lib/calculators/definitions.ts components/calculator tests/unit tests/e2e
git commit -m "feat: complete comprehensive calculator catalog"
~~~
