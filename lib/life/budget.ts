import Decimal from 'decimal.js';

export interface MonthlyBudgetInput {
  incomeWon: Decimal;
  housingWon: Decimal;
  carWon: Decimal;
  foodWon: Decimal;
  communicationsWon: Decimal;
  healthWon: Decimal;
  otherFixedWon: Decimal;
  variableWon: Decimal;
  savingsTargetWon: Decimal;
}

export interface BudgetCategory {
  key: 'housing' | 'car' | 'food' | 'communications' | 'health' | 'otherFixed' | 'variable';
  label: string;
  costWon: Decimal;
  ratio: Decimal;
}

export interface MonthlyBudgetResult {
  totalSpendingWon: Decimal;
  spendingRatio: Decimal;
  remainingAfterSavingsWon: Decimal;
  categories: BudgetCategory[];
}

export function calculateMonthlyBudget(input: MonthlyBudgetInput): MonthlyBudgetResult {
  const costs: Omit<BudgetCategory, 'ratio'>[] = [
    { key: 'housing', label: '주거비', costWon: input.housingWon },
    { key: 'car', label: '자동차비', costWon: input.carWon },
    { key: 'food', label: '식비', costWon: input.foodWon },
    { key: 'communications', label: '통신·구독비', costWon: input.communicationsWon },
    { key: 'health', label: '보험·의료비', costWon: input.healthWon },
    { key: 'otherFixed', label: '기타 고정비', costWon: input.otherFixedWon },
    { key: 'variable', label: '기타 변동비', costWon: input.variableWon },
  ];
  const totalSpendingWon = costs.reduce((total, category) => total.add(category.costWon), new Decimal(0));

  return {
    totalSpendingWon,
    spendingRatio: input.incomeWon.isZero() ? new Decimal(0) : totalSpendingWon.div(input.incomeWon),
    remainingAfterSavingsWon: input.incomeWon.minus(totalSpendingWon).minus(input.savingsTargetWon),
    categories: costs.map((category) => ({
      ...category,
      ratio: totalSpendingWon.isZero() ? new Decimal(0) : category.costWon.div(totalSpendingWon),
    })),
  };
}
