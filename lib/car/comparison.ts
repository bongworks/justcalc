import Decimal from 'decimal.js';

export interface LeasePurchaseComparisonInput {
  purchaseMonthlyWon: Decimal;
  leaseMonthlyWon: Decimal;
  months: number;
  purchaseResidualWon: Decimal;
  leaseInitialWon: Decimal;
}

export interface LeasePurchaseComparisonResult {
  purchaseTotalWon: Decimal;
  leaseTotalWon: Decimal;
  differenceWon: Decimal;
}

export interface RentalLeaseComparisonInput {
  rentalMonthlyWon: Decimal;
  leaseMonthlyWon: Decimal;
  months: number;
}

export interface RentalLeaseComparisonResult {
  rentalTotalWon: Decimal;
  leaseTotalWon: Decimal;
  differenceWon: Decimal;
}

export interface DepreciationInput {
  purchaseWon: Decimal;
  residualWon: Decimal;
  months: number;
}

export interface DepreciationResult {
  totalLossWon: Decimal;
  monthlyLossWon: Decimal;
}

export interface TotalOwnershipInput {
  purchaseCostWon: Decimal;
  annualRunningWon: Decimal;
  years: number;
  resaleWon: Decimal;
}

export interface TotalOwnershipResult {
  totalWon: Decimal;
}

export interface HighwayTollBudgetInput {
  oneWayTollWon: Decimal;
  returnTrips: number;
}

export interface HighwayTollBudgetResult {
  totalWon: Decimal;
}

function positiveIntegerPeriod(value: number): Decimal {
  const period = new Decimal(value);
  if (!period.isInteger() || period.lte(0)) {
    throw new Error('기간은 0보다 큰 정수여야 합니다.');
  }
  return period;
}

// Compare net purchase cost after retained value with the all-in lease outlay.
export function calculateLeasePurchaseComparison(
  input: LeasePurchaseComparisonInput,
): LeasePurchaseComparisonResult {
  const months = positiveIntegerPeriod(input.months);
  const purchaseTotalWon = input.purchaseMonthlyWon.mul(months).sub(input.purchaseResidualWon);
  const leaseTotalWon = input.leaseInitialWon.add(input.leaseMonthlyWon.mul(months));

  return {
    purchaseTotalWon,
    leaseTotalWon,
    differenceWon: purchaseTotalWon.sub(leaseTotalWon),
  };
}

// Keep both alternatives on one identical period so the signed difference is meaningful.
export function calculateRentalLeaseComparison(
  input: RentalLeaseComparisonInput,
): RentalLeaseComparisonResult {
  const months = positiveIntegerPeriod(input.months);
  const rentalTotalWon = input.rentalMonthlyWon.mul(months);
  const leaseTotalWon = input.leaseMonthlyWon.mul(months);

  return {
    rentalTotalWon,
    leaseTotalWon,
    differenceWon: rentalTotalWon.sub(leaseTotalWon),
  };
}

// Spread the value lost over the exact term selected by the user.
export function calculateDepreciation(input: DepreciationInput): DepreciationResult {
  const months = positiveIntegerPeriod(input.months);
  const totalLossWon = input.purchaseWon.sub(input.residualWon);

  return {
    totalLossWon,
    monthlyLossWon: totalLossWon.div(months),
  };
}

// Resale is recovered once at the end of the ownership period.
export function calculateTotalOwnership(input: TotalOwnershipInput): TotalOwnershipResult {
  const years = positiveIntegerPeriod(input.years);
  return {
    totalWon: input.purchaseCostWon.add(input.annualRunningWon.mul(years)).sub(input.resaleWon),
  };
}

// A return trip has two one-way toll charges.
export function calculateHighwayTollBudget(
  input: HighwayTollBudgetInput,
): HighwayTollBudgetResult {
  const returnTrips = new Decimal(input.returnTrips);
  if (!returnTrips.isInteger() || returnTrips.isNegative()) {
    throw new Error('왕복 횟수는 0 이상의 정수여야 합니다.');
  }

  return { totalWon: input.oneWayTollWon.mul(returnTrips).mul(2) };
}
