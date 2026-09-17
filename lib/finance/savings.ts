import Decimal from 'decimal.js';

// Long savings periods need guard digits without changing Decimal's global context.
const SavingsDecimal = Decimal.clone({ precision: 100 });

export interface SavingsMaturityInput {
  monthlyContribution: Decimal;
  annualRatePercent: Decimal;
  months: number;
  taxRatePercent: Decimal;
}

export interface DepositInterestInput {
  principal: Decimal;
  annualRatePercent: Decimal;
  months: number;
  taxRatePercent: Decimal;
}

export interface SavingsInterestResult {
  totalPaid: Decimal;
  totalInterest: Decimal;
  tax: Decimal;
  afterTaxInterest: Decimal;
  maturityAmount: Decimal;
  afterTaxMaturityAmount: Decimal;
}

function assertValidMonths(months: number): void {
  if (months <= 0 || !new Decimal(months).isInteger()) {
    throw new Error('기간은 0보다 큰 정수의 개월수여야 합니다.');
  }
}

function afterTaxResult(
  totalPaid: Decimal,
  totalInterest: Decimal,
  taxRatePercent: Decimal,
): SavingsInterestResult {
  const tax = totalInterest.mul(taxRatePercent).div(100);
  const afterTaxInterest = totalInterest.minus(tax);
  const maturityAmount = totalPaid.add(totalInterest);
  const afterTaxMaturityAmount = totalPaid.add(afterTaxInterest);

  return {
    totalPaid: new Decimal(totalPaid),
    totalInterest: new Decimal(totalInterest),
    tax: new Decimal(tax),
    afterTaxInterest: new Decimal(afterTaxInterest),
    maturityAmount: new Decimal(maturityAmount),
    afterTaxMaturityAmount: new Decimal(afterTaxMaturityAmount),
  };
}

export function calculateSavingsMaturity(input: SavingsMaturityInput): SavingsInterestResult {
  assertValidMonths(input.months);

  const monthlyContribution = new SavingsDecimal(input.monthlyContribution);
  const monthlyRate = new SavingsDecimal(input.annualRatePercent).div(1200);
  let balance = new SavingsDecimal(0);

  for (let month = 1; month <= input.months; month += 1) {
    // A month-end contribution starts earning interest from the following month.
    balance = balance.mul(new SavingsDecimal(1).add(monthlyRate)).add(monthlyContribution);
  }

  const totalPaid = monthlyContribution.mul(input.months);
  const totalInterest = balance.minus(totalPaid);

  return afterTaxResult(
    totalPaid,
    totalInterest,
    new SavingsDecimal(input.taxRatePercent),
  );
}

export function calculateDepositInterest(input: DepositInterestInput): SavingsInterestResult {
  assertValidMonths(input.months);

  const principal = new SavingsDecimal(input.principal);
  const totalInterest = principal
    .mul(new SavingsDecimal(input.annualRatePercent))
    .mul(input.months)
    .div(1200);

  return afterTaxResult(
    principal,
    totalInterest,
    new SavingsDecimal(input.taxRatePercent),
  );
}
