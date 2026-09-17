# Salary and Finance Calculators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add local salary, employment, savings, and lending calculators for the highest-intent Korean searches.

**Architecture:** Pure Decimal modules own calculations; immutable 2026 policy constants have named source URLs and effective dates. Definitions supply parsed fields and presentation; generic calculator UI remains unchanged.

**Tech Stack:** TypeScript, Decimal.js, Next.js static export, Vitest, Playwright.

**Spec:** docs/superpowers/specs/2026-09-17-calculator-catalog-expansion-design.md

## Global Constraints

- Complete the platform foundation plan first.
- Policy constants must have a reviewed official source and a visible 기준연도 2026 assumption.
- All benefit/tax outputs say 예상 결과 and never claim eligibility.
- Use user-entered limits/rates where a verified annual rule is unavailable.

---

### Task 1: Salary, wage, and employment estimate modules

**Files:**
- Create: lib/salary/policy-2026.ts
- Create: lib/salary/pay.ts
- Create: lib/salary/benefits.ts
- Create: lib/salary/planning.ts
- Create: lib/salary/pay.test.ts
- Create: lib/salary/benefits.test.ts
- Create: lib/salary/planning.test.ts

**Interfaces:**
- calculateTakeHomePay({ annualSalaryWon, monthlyNonTaxableWon, dependents, childDependents })
- calculateHourlyMonthlyPay({ hourlyWon, weeklyHours, paidWeeks })
- calculateWeeklyHolidayPay({ hourlyWon, weeklyHours, weeksWorked })
- calculateSeverancePay({ averageDailyWageWon, continuousServiceDays })
- calculateAnnualLeaveAllowance({ unusedDays, ordinaryDailyWageWon })
- calculateUnemploymentBenefitEstimate({ dailyWageWon, eligibleDays, dailyLowerLimitWon, dailyUpperLimitWon })
- calculateParentalLeaveEstimate({ ordinaryMonthlyWageWon, months, replacementRatePercent, monthlyCapWon })
- calculateSalaryNegotiation({ currentAnnualWon, desiredAnnualWon })
- calculateFreelancerWithholding({ grossWon, withholdingRatePercent, deductibleExpenseWon })

- [ ] **Step 1: Write failing formula and boundary tests**

~~~ts
test('weekly holiday allowance is zero below 15 hours', () => {
  expect(calculateWeeklyHolidayPay({ hourlyWon: d(10000), weeklyHours: d(14), weeksWorked: d(1) }).allowanceWon).toEqual(d(0));
});
test('severance is 30 days of daily wage for 365 service days', () => {
  expect(calculateSeverancePay({ averageDailyWageWon: d(100000), continuousServiceDays: 365 }).estimatedWon).toEqual(d(3000000));
});
test('unemployment estimate respects the user-entered daily cap', () => {
  expect(calculateUnemploymentBenefitEstimate({ dailyWageWon: d(500000), eligibleDays: 120, dailyLowerLimitWon: d(60000), dailyUpperLimitWon: d(70000) }).dailyBenefitWon).toEqual(d(70000));
});
test('freelancer withholding never uses a negative taxable base', () => {
  expect(calculateFreelancerWithholding({ grossWon: d(100000), deductibleExpenseWon: d(200000), withholdingRatePercent: d(3.3) }).withholdingWon).toEqual(d(0));
});
~~~

- [ ] **Step 2: Run to verify failure**

Run: pnpm test lib/salary/pay.test.ts lib/salary/benefits.test.ts lib/salary/planning.test.ts

Expected: FAIL because salary calculation modules are absent.

- [ ] **Step 3: Implement modules**

calculateHourlyMonthlyPay derives monthly base as hourly × weekly hours × paid weeks; it adds weekly holiday pay only at 15 or more weekly hours. calculateSeverancePay is daily wage × 30 × service days / 365. Benefit functions cap a base amount between user-entered lower/upper limits; parental leave produces one row per month. Take-home-pay uses only the explicit policy table in policy-2026.ts and returns each deduction item separately. Freelancer withholding uses max(gross - deductible expense, 0) × user rate. Salary negotiation is desired minus current and percentage is zero for a zero current salary.

- [ ] **Step 4: Run focused tests**

Run: pnpm test lib/salary/pay.test.ts lib/salary/benefits.test.ts lib/salary/planning.test.ts

Expected: PASS with Decimal equality and no NaN/Infinity paths.

- [ ] **Step 5: Commit**

~~~bash
git add lib/salary
git commit -m "feat: add local salary calculation modules"
~~~

### Task 2: Register and editorially complete salary calculators

**Files:**
- Modify: content/calculators.ts
- Modify: lib/calculators/definitions.ts
- Modify: tests/unit/definitions.test.ts
- Modify: tests/e2e/calculators.spec.ts

**Interfaces:**
- Registers these salary slugs: take-home-pay, hourly-monthly-pay, weekly-holiday-pay, severance-pay, annual-leave-allowance, unemployment-benefit, parental-leave-benefit, salary-negotiation, freelancer-withholding.
- Every benefit result has rows labelled 기준연도, 계산 가정, and actual eligibility differs.

- [ ] **Step 1: Write the failing catalogue/definition test**

~~~ts
expect(getCalculatorByCategoryAndSlug('salary', 'severance-pay')).toMatchObject({
  route: '/salary/severance-pay/', title: '퇴직금 계산기',
});
expect(getCalculatorBySlug('take-home-pay')?.guide.limitations.join(' ')).toMatch(/예상/);
~~~

- [ ] **Step 2: Run to verify failure**

Run: pnpm test tests/unit/definitions.test.ts tests/unit/registry.test.ts

Expected: FAIL because these catalogue entries are absent.

- [ ] **Step 3: Register forms and guide content**

Use shared money/rate/month parsers. Tax/benefit pages must ask for every unverifiable threshold as a labeled input. Add two distinct examples and official source links per calculator, relate take-home pay to annual leave/severance, and relate freelance withholding to VAT/margin calculators.

- [ ] **Step 4: Verify local-only rendering**

Run: pnpm check:catalog && pnpm test tests/unit/definitions.test.ts tests/unit/registry.test.ts && pnpm test:e2e -- tests/e2e/calculators.spec.ts

Expected: all salary routes calculate with no XHR/fetch/POST/storage writes.

- [ ] **Step 5: Commit**

~~~bash
git add content/calculators.ts lib/calculators/definitions.ts tests/unit/definitions.test.ts tests/unit/registry.test.ts tests/e2e/calculators.spec.ts
git commit -m "feat: publish salary and employment calculators"
~~~

### Task 3: Savings and lending calculations

**Files:**
- Create: lib/finance/savings.ts
- Create: lib/finance/affordability.ts
- Create: lib/finance/ratios.ts
- Create: tests/unit/finance/savings.test.ts
- Create: tests/unit/finance/affordability.test.ts
- Create: tests/unit/finance/ratios.test.ts

**Interfaces:**
- calculateSavingsMaturity({ monthlyContribution, annualRatePercent, months, taxRatePercent })
- calculateDepositInterest({ principal, annualRatePercent, months, taxRatePercent })
- calculateLoanAffordability({ netMonthlyIncomeWon, existingMonthlyDebtWon, allowedDebtRatioPercent, annualRatePercent, months })
- calculateDsr({ annualIncomeWon, annualDebtPaymentsWon }), calculateDti({ annualIncomeWon, annualHousingDebtPaymentsWon }), calculateLtv({ loanWon, propertyValueWon })
- convertCurrency({ amount, wonPerUnit })

- [ ] **Step 1: Write failing tests**

~~~ts
test('deposit interest applies entered tax', () => {
  expect(calculateDepositInterest({ principal: d(10000000), annualRatePercent: d(3), months: 12, taxRatePercent: d(15.4) }).afterTaxInterest).toEqual(d(253800));
});
test('affordability is zero after debt consumes the allowable payment', () => {
  expect(calculateLoanAffordability({ netMonthlyIncomeWon: d(3000000), existingMonthlyDebtWon: d(1500000), allowedDebtRatioPercent: d(50), annualRatePercent: d(5), months: 240 }).affordablePrincipalWon).toEqual(d(0));
});
test('LTV avoids division by zero', () => {
  expect(calculateLtv({ loanWon: d(10000000), propertyValueWon: d(0) }).percent).toEqual(d(0));
});
~~~

- [ ] **Step 2: Run to verify failure**

Run: pnpm test tests/unit/finance/savings.test.ts tests/unit/finance/affordability.test.ts tests/unit/finance/ratios.test.ts

Expected: FAIL because new finance modules are absent.

- [ ] **Step 3: Implement the formula modules**

Savings compounds monthly after a month-end contribution, deposit uses principal × annual rate × months / 1200, and tax is gross interest × tax rate / 100. Affordability derives maximum payment as max(net monthly income × ratio / 100 - existing debt, 0), then inverts the equal-payment amortization formula; zero rate is payment × months. DSR/DTI/LTV return zero for zero denominators. Manual exchange conversion is amount × won per unit only.

- [ ] **Step 4: Verify**

Run: pnpm test tests/unit/finance/savings.test.ts tests/unit/finance/affordability.test.ts tests/unit/finance/ratios.test.ts tests/unit/finance/loan.test.ts

Expected: PASS.

- [ ] **Step 5: Commit**

~~~bash
git add lib/finance tests/unit/finance
git commit -m "feat: add savings and finance ratio modules"
~~~

### Task 4: Register finance calculator pages

**Files:**
- Modify: content/calculators.ts
- Modify: lib/calculators/definitions.ts
- Modify: tests/unit/definitions.test.ts
- Modify: tests/e2e/calculators.spec.ts

**Interfaces:**
- Registers: savings-maturity, deposit-interest, loan-affordability, dsr, dti, ltv, card-instalment, manual-exchange-rate.
- card-instalment delegates to calculateRepaymentPlans with equalPayment mode; it does not duplicate loan amortization.

- [ ] **Step 1: Write failing registry test**

~~~ts
expect(getCalculatorsByCategory('finance').map(({ slug }) => slug)).toEqual(expect.arrayContaining([
  'savings-maturity', 'deposit-interest', 'loan-affordability', 'dsr', 'dti', 'ltv', 'card-instalment', 'manual-exchange-rate',
]));
~~~

- [ ] **Step 2: Run to verify failure**

Run: pnpm test tests/unit/registry.test.ts

Expected: FAIL because the eight slugs are absent.

- [ ] **Step 3: Register validated calculator definitions**

Mark manual-exchange-rate as non-real-time in its description, form hint, result row, examples, and limitation. Register DSR/DTI/LTV as ratio tools, not lending approval predictions. Use existing monthly schedule renderer for card-instalment.

- [ ] **Step 4: Run focused release gates**

Run: pnpm check:catalog && pnpm check:privacy && pnpm test tests/unit/registry.test.ts tests/unit/definitions.test.ts && pnpm test:e2e -- tests/e2e/calculators.spec.ts

Expected: PASS with no request or persistence of values.

- [ ] **Step 5: Commit**

~~~bash
git add content/calculators.ts lib/calculators/definitions.ts tests/unit/registry.test.ts tests/unit/definitions.test.ts tests/e2e/calculators.spec.ts
git commit -m "feat: publish finance planning calculators"
~~~
