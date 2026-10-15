import Decimal from 'decimal.js';

export interface DsrInput {
  annualIncomeWon: Decimal;
  annualDebtPaymentsWon: Decimal;
}

export interface DtiInput {
  annualIncomeWon: Decimal;
  annualHousingDebtPaymentsWon: Decimal;
  annualOtherDebtInterestWon?: Decimal;
}

export interface LtvInput {
  loanWon: Decimal;
  propertyValueWon: Decimal;
}

export interface RatioResult {
  percent: Decimal | null;
}

export interface CurrencyConversionInput {
  amount: Decimal;
  wonPerUnit: Decimal;
}

export interface CurrencyConversionResult {
  amountWon: Decimal;
}

function percentage(numerator: Decimal, denominator: Decimal): RatioResult {
  // An unavailable ratio must remain distinct from a genuine zero percent.
  return { percent: denominator.isZero() ? null : numerator.div(denominator).mul(100) };
}

export function calculateDsr(input: DsrInput): RatioResult {
  return percentage(input.annualDebtPaymentsWon, input.annualIncomeWon);
}

export function calculateDti(input: DtiInput): RatioResult {
  const annualDebtPaymentsWon = input.annualHousingDebtPaymentsWon.add(input.annualOtherDebtInterestWon ?? 0);
  return percentage(annualDebtPaymentsWon, input.annualIncomeWon);
}

export function calculateLtv(input: LtvInput): RatioResult {
  return percentage(input.loanWon, input.propertyValueWon);
}

export function convertCurrency(input: CurrencyConversionInput): CurrencyConversionResult {
  return { amountWon: input.amount.mul(input.wonPerUnit) };
}
