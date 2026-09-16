import Decimal from 'decimal.js';

export interface EqualPaymentLoanInput {
  principal: Decimal;
  annualRatePercent: Decimal;
  months: number;
}

export interface RepaymentRow {
  month: number;
  payment: Decimal;
  principal: Decimal;
  interest: Decimal;
  balance: Decimal;
}

export interface EqualPaymentLoanResult {
  principal: Decimal;
  monthlyPayment: Decimal;
  totalInterest: Decimal;
  totalPaid: Decimal;
  rows: RepaymentRow[];
}

export type SimpleInterestInput = {
  principal: Decimal;
  annualRatePercent: Decimal;
  period: Decimal;
} & (
  | { periodUnit: 'days'; daysInYear: 365 | 366 }
  | { periodUnit: 'months' | 'years' }
);

export interface SimpleInterestResult {
  interest: Decimal;
  maturityAmount: Decimal;
}

export function calculateSimpleInterest(input: SimpleInterestInput): SimpleInterestResult {
  const denominator = input.periodUnit === 'days' ? input.daysInYear : input.periodUnit === 'months' ? 12 : 1;
  const interest = input.principal.mul(input.annualRatePercent).div(100).mul(input.period).div(denominator);

  return { interest, maturityAmount: input.principal.add(interest) };
}

export interface EqualPrincipalLoanResult {
  rows: RepaymentRow[];
  totalInterest: Decimal;
  totalPaid: Decimal;
  firstPayment: Decimal;
  lastPayment: Decimal;
}

export interface BulletLoanResult {
  rows: RepaymentRow[];
  totalInterest: Decimal;
  totalPaid: Decimal;
  monthlyInterestPayment: Decimal;
  finalPayment: Decimal;
}

export interface RepaymentPlansResult {
  equalPayment: EqualPaymentLoanResult;
  equalPrincipal: EqualPrincipalLoanResult;
  bullet: BulletLoanResult;
}

export function calculateRepaymentPlans(input: EqualPaymentLoanInput): RepaymentPlansResult {
  const equalPayment = calculateEqualPaymentLoan(input);
  const monthlyRate = input.annualRatePercent.div(100).div(12);
  const monthlyPrincipal = input.principal.div(input.months);
  const monthlyInterestPayment = input.principal.mul(monthlyRate);
  const equalPrincipalRows: RepaymentRow[] = [];
  const bulletRows: RepaymentRow[] = [];
  let repaidPrincipal = new Decimal(0);
  let balance = input.principal;

  for (let month = 1; month <= input.months; month += 1) {
    const isFinal = month === input.months;
    const interest = balance.mul(monthlyRate);
    const principal = isFinal ? input.principal.minus(repaidPrincipal) : monthlyPrincipal;
    repaidPrincipal = repaidPrincipal.add(principal);
    balance = isFinal ? new Decimal(0) : input.principal.minus(repaidPrincipal);
    equalPrincipalRows.push({ month, principal, interest, payment: principal.add(interest), balance });

    const bulletPrincipal = isFinal ? input.principal : new Decimal(0);
    bulletRows.push({
      month,
      principal: bulletPrincipal,
      interest: monthlyInterestPayment,
      payment: bulletPrincipal.add(monthlyInterestPayment),
      balance: isFinal ? new Decimal(0) : input.principal,
    });
  }

  const equalPrincipalTotalPaid = equalPrincipalRows.reduce((total, row) => total.add(row.payment), new Decimal(0));
  const bulletTotalPaid = bulletRows.reduce((total, row) => total.add(row.payment), new Decimal(0));

  return {
    equalPayment,
    equalPrincipal: {
      rows: equalPrincipalRows,
      totalPaid: equalPrincipalTotalPaid,
      totalInterest: equalPrincipalTotalPaid.minus(input.principal),
      firstPayment: equalPrincipalRows[0].payment,
      lastPayment: equalPrincipalRows[equalPrincipalRows.length - 1].payment,
    },
    bullet: {
      rows: bulletRows,
      totalPaid: bulletTotalPaid,
      totalInterest: bulletTotalPaid.minus(input.principal),
      monthlyInterestPayment,
      finalPayment: bulletRows[bulletRows.length - 1].payment,
    },
  };
}

export function calculateEqualPaymentLoan(input: EqualPaymentLoanInput): EqualPaymentLoanResult {
  if (input.months <= 0 || !new Decimal(input.months).isInteger()) {
    throw new Error('상환 기간은 0보다 큰 정수여야 합니다.');
  }

  const monthlyRate = input.annualRatePercent.div(100).div(12);
  let monthlyPayment: Decimal;

  if (monthlyRate.isZero()) {
    monthlyPayment = input.principal.div(input.months);
  } else {
    const growthFactor = new Decimal(1).add(monthlyRate).pow(input.months);
    const denominator = growthFactor.minus(1);

    if (denominator.lte(0)) {
      throw new Error('원리금균등 상환식의 분모는 0보다 커야 합니다.');
    }

    monthlyPayment = input.principal.mul(monthlyRate).mul(growthFactor).div(denominator);
  }

  const rows: RepaymentRow[] = [];
  let balance = input.principal;
  let repaidPrincipal = new Decimal(0);

  for (let month = 1; month <= input.months; month += 1) {
    const interest = balance.mul(monthlyRate);
    // Reconcile against the original principal so repeated Decimal operations cannot accumulate drift.
    const principal =
      month === input.months
        ? input.principal.minus(repaidPrincipal)
        : monthlyPayment.minus(interest);
    const payment = principal.add(interest);
    repaidPrincipal = repaidPrincipal.add(principal);
    balance =
      month === input.months ? new Decimal(0) : input.principal.minus(repaidPrincipal);
    rows.push({ month, payment, principal, interest, balance });
  }

  const totalPaid = rows.reduce(
    (total, row) => total.add(row.payment),
    new Decimal(0),
  );

  return {
    principal: input.principal,
    monthlyPayment,
    totalInterest: totalPaid.minus(input.principal),
    totalPaid,
    rows,
  };
}
