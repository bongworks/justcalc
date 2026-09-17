import type Decimal from 'decimal.js';
import { amount, percent, SalaryDecimal } from './decimal';

export function calculateSalaryNegotiation(input: { currentAnnualWon: Decimal; desiredAnnualWon: Decimal }) {
  const current = amount(input.currentAnnualWon, '현재 연봉');
  const desired = amount(input.desiredAnnualWon, '목표 연봉');
  const annualIncreaseWon = desired.minus(current);
  return {
    annualIncreaseWon,
    monthlyIncreaseWon: annualIncreaseWon.div(12),
    increasePercent: current.isZero() ? new SalaryDecimal(0) : annualIncreaseWon.div(current).mul(100),
  };
}

/**
 * User-defined expense-adjusted scenario; not a determination of statutory withholding.
 * Ordinary business-income withholding often applies to gross receipts: enter zero expenses
 * for that scenario. Net receipt subtracts withholding only, not the entered expenses.
 */
export function calculateFreelancerWithholding(input: { grossWon: Decimal; withholdingRatePercent: Decimal; deductibleExpenseWon: Decimal }) {
  const gross = amount(input.grossWon, '총 수입');
  const expense = amount(input.deductibleExpenseWon, '차감 경비');
  const rate = percent(input.withholdingRatePercent, '원천징수율');
  const taxableBaseWon = SalaryDecimal.max(gross.minus(expense), 0);
  const withholdingWon = taxableBaseWon.mul(rate).div(100);
  return { taxableBaseWon, withholdingWon, netReceiptWon: gross.minus(withholdingWon) };
}
