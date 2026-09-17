import Decimal from 'decimal.js';

export interface DsrInput {
  annualIncomeWon: Decimal;
  annualDebtPaymentsWon: Decimal;
}

export interface DtiInput {
  annualIncomeWon: Decimal;
  annualHousingDebtPaymentsWon: Decimal;
}

export interface LtvInput {
  loanWon: Decimal;
  propertyValueWon: Decimal;
}

export interface RatioResult {
  percent: Decimal;
}

export interface CurrencyConversionInput {
  amount: Decimal;
  wonPerUnit: Decimal;
}

export interface CurrencyConversionResult {
  amountWon: Decimal;
}

function percentage(numerator: Decimal, denominator: Decimal): RatioResult {
  // A zero base has no meaningful ratio; return the product contract's neutral value.
  return { percent: denominator.isZero() ? new Decimal(0) : numerator.div(denominator).mul(100) };
}

export function calculateDsr(input: DsrInput): RatioResult {
  return percentage(input.annualDebtPaymentsWon, input.annualIncomeWon);
}

export function calculateDti(input: DtiInput): RatioResult {
  return percentage(input.annualHousingDebtPaymentsWon, input.annualIncomeWon);
}

export function calculateLtv(input: LtvInput): RatioResult {
  return percentage(input.loanWon, input.propertyValueWon);
}

export function convertCurrency(input: CurrencyConversionInput): CurrencyConversionResult {
  return { amountWon: input.amount.mul(input.wonPerUnit) };
}
