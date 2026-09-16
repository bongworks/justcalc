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
