import Decimal from 'decimal.js';

// Long savings periods need guard digits without changing Decimal's global context.
const SavingsDecimal = Decimal.clone({ precision: 100 });

export type SavingsInterestType = 'simple' | 'monthly';
export type ContributionTiming = 'beginning' | 'end';

export interface SavingsMaturityInput {
  monthlyContribution: Decimal;
  annualRatePercent: Decimal;
  months: number;
  taxRatePercent: Decimal;
  interestType?: SavingsInterestType;
  contributionTiming?: ContributionTiming;
}

export interface DepositInterestInput {
  principal: Decimal;
  annualRatePercent: Decimal;
  months: number;
  taxRatePercent: Decimal;
  interestType?: SavingsInterestType;
}

export interface SavingsInterestResult {
  interestType: SavingsInterestType;
  contributionTiming?: ContributionTiming;
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
  interestType: SavingsInterestType,
  contributionTiming?: ContributionTiming,
): SavingsInterestResult {
  const tax = totalInterest.mul(taxRatePercent).div(100);
  const afterTaxInterest = totalInterest.minus(tax);
  const maturityAmount = totalPaid.add(totalInterest);
  const afterTaxMaturityAmount = totalPaid.add(afterTaxInterest);

  return {
    interestType,
    ...(contributionTiming === undefined ? {} : { contributionTiming }),
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
  const interestType = input.interestType ?? 'monthly';
  const contributionTiming = input.contributionTiming ?? 'end';
  const totalPaid = monthlyContribution.mul(input.months);
  let balance = new SavingsDecimal(0);
  let totalInterest = new SavingsDecimal(0);

  for (let month = 1; month <= input.months; month += 1) {
    if (interestType === 'simple') {
      const earningMonths = input.months - month + (contributionTiming === 'beginning' ? 1 : 0);
      totalInterest = totalInterest.add(monthlyContribution.mul(monthlyRate).mul(earningMonths));
    } else {
      if (contributionTiming === 'beginning') balance = balance.add(monthlyContribution);
      balance = balance.mul(new SavingsDecimal(1).add(monthlyRate));
      if (contributionTiming === 'end') balance = balance.add(monthlyContribution);
    }
  }

  if (interestType === 'monthly') totalInterest = balance.minus(totalPaid);

  return afterTaxResult(
    totalPaid,
    totalInterest,
    new SavingsDecimal(input.taxRatePercent),
    interestType,
    contributionTiming,
  );
}

export function calculateDepositInterest(input: DepositInterestInput): SavingsInterestResult {
  assertValidMonths(input.months);

  const principal = new SavingsDecimal(input.principal);
  const interestType = input.interestType ?? 'simple';
  const monthlyRate = new SavingsDecimal(input.annualRatePercent).div(1200);
  const totalInterest = interestType === 'monthly'
    ? principal.mul(new SavingsDecimal(1).add(monthlyRate).pow(input.months).minus(1))
    : principal.mul(monthlyRate).mul(input.months);

  return afterTaxResult(
    principal,
    totalInterest,
    new SavingsDecimal(input.taxRatePercent),
    interestType,
  );
}
