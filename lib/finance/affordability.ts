import Decimal from 'decimal.js';

// Match the guard precision used by the existing equal-payment loan module.
const AffordabilityDecimal = Decimal.clone({ precision: 100 });

export interface LoanAffordabilityInput {
  netMonthlyIncomeWon: Decimal;
  existingMonthlyDebtWon: Decimal;
  allowedDebtRatioPercent: Decimal;
  annualRatePercent: Decimal;
  months: number;
}

export interface LoanAffordabilityResult {
  maximumMonthlyDebtWon: Decimal;
  availableMonthlyPaymentWon: Decimal;
  affordablePrincipalWon: Decimal;
}

export function calculateLoanAffordability(
  input: LoanAffordabilityInput,
): LoanAffordabilityResult {
  if (input.months <= 0 || !new Decimal(input.months).isInteger()) {
    throw new Error('상환 기간은 0보다 큰 정수의 개월수여야 합니다.');
  }

  const netMonthlyIncomeWon = new AffordabilityDecimal(input.netMonthlyIncomeWon);
  const existingMonthlyDebtWon = new AffordabilityDecimal(input.existingMonthlyDebtWon);
  const maximumMonthlyDebtWon = netMonthlyIncomeWon
    .mul(new AffordabilityDecimal(input.allowedDebtRatioPercent))
    .div(100);
  const availableMonthlyPaymentWon = AffordabilityDecimal.max(
    maximumMonthlyDebtWon.minus(existingMonthlyDebtWon),
    0,
  );
  const monthlyRate = new AffordabilityDecimal(input.annualRatePercent).div(1200);
  let affordablePrincipalWon: Decimal;

  if (availableMonthlyPaymentWon.isZero()) {
    affordablePrincipalWon = new AffordabilityDecimal(0);
  } else if (monthlyRate.isZero()) {
    affordablePrincipalWon = availableMonthlyPaymentWon.mul(input.months);
  } else {
    // Invert the same equal-payment annuity formula used by the loan calculator.
    const growthFactor = new AffordabilityDecimal(1).add(monthlyRate).pow(input.months);
    affordablePrincipalWon = availableMonthlyPaymentWon
      .mul(growthFactor.minus(1))
      .div(monthlyRate.mul(growthFactor));
  }

  return {
    maximumMonthlyDebtWon: new Decimal(maximumMonthlyDebtWon),
    availableMonthlyPaymentWon: new Decimal(availableMonthlyPaymentWon),
    affordablePrincipalWon: new Decimal(affordablePrincipalWon),
  };
}
