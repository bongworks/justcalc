import Decimal from 'decimal.js';
import type { ContributionTiming } from './savings';

export interface CompoundSavingsInput {
  initialPrincipal: Decimal;
  monthlyContribution: Decimal;
  annualRatePercent: Decimal;
  months: number;
  taxRatePercent?: Decimal;
  contributionTiming?: ContributionTiming;
}

export interface CompoundSavingsRow {
  month: number;
  contribution: Decimal;
  interest: Decimal;
  balance: Decimal;
}

export interface CompoundSavingsResult {
  contributionTiming: ContributionTiming;
  totalPaid: Decimal;
  totalInterest: Decimal;
  maturityAmount: Decimal;
  rows: CompoundSavingsRow[];
  afterTaxInterest?: Decimal;
  afterTaxMaturityAmount?: Decimal;
  tax?: Decimal;
}

export function calculateCompoundSavings(input: CompoundSavingsInput): CompoundSavingsResult {
  if (input.months <= 0 || !new Decimal(input.months).isInteger()) {
    throw new Error('저축 기간은 0보다 큰 정수여야 합니다.');
  }

  const monthlyRate = input.annualRatePercent.div(100).div(12);
  const contributionTiming = input.contributionTiming ?? 'end';
  const rows: CompoundSavingsRow[] = [];
  let balance = input.initialPrincipal;

  for (let month = 1; month <= input.months; month += 1) {
    if (contributionTiming === 'beginning') balance = balance.add(input.monthlyContribution);
    const interest = balance.mul(monthlyRate);
    balance = balance.add(interest);
    if (contributionTiming === 'end') balance = balance.add(input.monthlyContribution);
    rows.push({ month, contribution: input.monthlyContribution, interest, balance });
  }

  const totalPaid = input.initialPrincipal.add(input.monthlyContribution.mul(input.months));
  const totalInterest = balance.minus(totalPaid);
  const result: CompoundSavingsResult = { totalPaid, totalInterest, maturityAmount: balance, rows, contributionTiming };

  if (input.taxRatePercent !== undefined) {
    result.tax = totalInterest.mul(input.taxRatePercent).div(100);
    result.afterTaxInterest = totalInterest.minus(result.tax);
    result.afterTaxMaturityAmount = totalPaid.add(result.afterTaxInterest);
  }

  return result;
}
