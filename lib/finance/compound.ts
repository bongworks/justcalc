import Decimal from 'decimal.js';

export interface CompoundSavingsInput {
  initialPrincipal: Decimal;
  monthlyContribution: Decimal;
  annualRatePercent: Decimal;
  months: number;
  taxRatePercent?: Decimal;
}

export interface CompoundSavingsRow {
  month: number;
  contribution: Decimal;
  interest: Decimal;
  balance: Decimal;
}

export interface CompoundSavingsResult {
  totalPaid: Decimal;
  totalInterest: Decimal;
  maturityAmount: Decimal;
  rows: CompoundSavingsRow[];
  afterTaxInterest?: Decimal;
  afterTaxMaturityAmount?: Decimal;
}

export function calculateCompoundSavings(input: CompoundSavingsInput): CompoundSavingsResult {
  if (input.months <= 0 || !new Decimal(input.months).isInteger()) {
    throw new Error('저축 기간은 0보다 큰 정수여야 합니다.');
  }

  const monthlyRate = input.annualRatePercent.div(100).div(12);
  const rows: CompoundSavingsRow[] = [];
  let balance = input.initialPrincipal;

  for (let month = 1; month <= input.months; month += 1) {
    // Monthly compounding: interest accrues on the opening balance, then the contribution is deposited.
    const interest = balance.mul(monthlyRate);
    balance = balance.add(interest).add(input.monthlyContribution);
    rows.push({ month, contribution: input.monthlyContribution, interest, balance });
  }

  const totalPaid = input.initialPrincipal.add(input.monthlyContribution.mul(input.months));
  const totalInterest = balance.minus(totalPaid);
  const result: CompoundSavingsResult = { totalPaid, totalInterest, maturityAmount: balance, rows };

  if (input.taxRatePercent !== undefined) {
    result.afterTaxInterest = totalInterest.mul(new Decimal(1).minus(input.taxRatePercent.div(100)));
    result.afterTaxMaturityAmount = totalPaid.add(result.afterTaxInterest);
  }

  return result;
}
