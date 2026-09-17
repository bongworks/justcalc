import Decimal from 'decimal.js';

export interface AcquisitionTaxInput {
  purchaseWon: Decimal;
  ratePercent: Decimal;
}

export interface BrokerageFeeInput {
  transactionWon: Decimal;
  ratePercent: Decimal;
  capWon: Decimal;
}

export interface DepositRentConversionInput {
  depositWon: Decimal;
  conversionRatePercent: Decimal;
  months: number;
}

export interface RentComparisonInput {
  depositWon: Decimal;
  monthlyRentWon: Decimal;
  conversionRatePercent: Decimal;
}

export interface RentalYieldInput {
  annualRentWon: Decimal;
  purchaseWon: Decimal;
  annualCostsWon: Decimal;
}

export interface BudgetItem {
  name: string;
  amountWon: Decimal;
}

export interface ItemBudgetInput {
  items: readonly BudgetItem[];
}

export function calculateAcquisitionTax(input: AcquisitionTaxInput): { taxWon: Decimal } {
  return { taxWon: input.purchaseWon.mul(input.ratePercent).div(100) };
}

export function calculateBrokerageFee(input: BrokerageFeeInput): { feeWon: Decimal } {
  return { feeWon: Decimal.min(input.transactionWon.mul(input.ratePercent).div(100), input.capWon) };
}

export function calculateDepositRentConversion(input: DepositRentConversionInput): { rentWon: Decimal } {
  return { rentWon: input.depositWon.mul(input.conversionRatePercent).div(100).mul(input.months).div(12) };
}

export function calculateRentComparison(input: RentComparisonInput): { monthlyEquivalentWon: Decimal } {
  const { rentWon } = calculateDepositRentConversion({ ...input, months: 1 });
  return { monthlyEquivalentWon: input.monthlyRentWon.add(rentWon) };
}

export function calculateRentalYield(input: RentalYieldInput): { percent: Decimal } {
  const netRentWon = Decimal.max(input.annualRentWon.sub(input.annualCostsWon), 0);
  return { percent: input.purchaseWon.isZero() ? new Decimal(0) : netRentWon.div(input.purchaseWon).mul(100) };
}

function sumBudget(input: ItemBudgetInput): { totalWon: Decimal } {
  return { totalWon: input.items.reduce((sum, item) => sum.add(item.amountWon), new Decimal(0)) };
}

export function calculateMovingBudget(input: ItemBudgetInput): { totalWon: Decimal } {
  return sumBudget(input);
}

export function calculateSetupBudget(input: ItemBudgetInput): { totalWon: Decimal } {
  return sumBudget(input);
}
