import Decimal from 'decimal.js';

export interface VatInput {
  // This is the entered total when includesVat is true.
  supplyWon: Decimal;
  ratePercent: Decimal;
  includesVat: boolean;
}

export interface VatResult {
  supplyWon: Decimal;
  vatWon: Decimal;
  totalWon: Decimal;
}

export interface ProfitInput {
  salesWon: Decimal;
  costWon: Decimal;
}

export interface ProfitResult {
  profitWon: Decimal;
  percent: Decimal;
}

export interface BreakEvenInput {
  fixedCostWon: Decimal;
  unitPriceWon: Decimal;
  variableCostWon: Decimal;
}

export interface BreakEvenResult {
  contributionMarginWon: Decimal;
  units: Decimal;
  salesWon: Decimal;
}

export interface CommissionSettlementInput {
  grossSalesWon: Decimal;
  platformFeePercent: Decimal;
  paymentFeePercent: Decimal;
  shippingWon: Decimal;
}

export interface CommissionSettlementResult {
  platformFeeWon: Decimal;
  paymentFeeWon: Decimal;
  shippingWon: Decimal;
  totalDeductionsWon: Decimal;
  settlementWon: Decimal;
}

export interface OnlineMarketSettlementInput extends CommissionSettlementInput {
  returnsWon?: Decimal;
}

export interface OnlineMarketSettlementResult extends CommissionSettlementResult {
  returnsWon: Decimal;
}

export function calculateVat(input: VatInput): VatResult {
  const rate = input.ratePercent.div(100);
  const supplyWon = input.includesVat ? input.supplyWon.div(rate.add(1)) : input.supplyWon;
  const totalWon = input.includesVat ? input.supplyWon : supplyWon.mul(rate.add(1));
  return { supplyWon, vatWon: totalWon.sub(supplyWon), totalWon };
}

function calculateProfitPercent(input: ProfitInput, denominator: Decimal): ProfitResult {
  const profitWon = input.salesWon.sub(input.costWon);
  return { profitWon, percent: denominator.isZero() ? new Decimal(0) : profitWon.div(denominator).mul(100) };
}

export function calculateMargin(input: ProfitInput): ProfitResult {
  return calculateProfitPercent(input, input.salesWon);
}

export function calculateMarkup(input: ProfitInput): ProfitResult {
  return calculateProfitPercent(input, input.costWon);
}

export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult | null {
  const contributionMarginWon = input.unitPriceWon.sub(input.variableCostWon);
  if (contributionMarginWon.lte(0)) return null;

  const units = input.fixedCostWon.div(contributionMarginWon).ceil();
  return { contributionMarginWon, units, salesWon: units.mul(input.unitPriceWon) };
}

export function calculateCommissionSettlement(input: CommissionSettlementInput): CommissionSettlementResult {
  const platformFeeWon = input.grossSalesWon.mul(input.platformFeePercent).div(100);
  const paymentFeeWon = input.grossSalesWon.mul(input.paymentFeePercent).div(100);
  const totalDeductionsWon = platformFeeWon.add(paymentFeeWon).add(input.shippingWon);
  return {
    platformFeeWon,
    paymentFeeWon,
    shippingWon: input.shippingWon,
    totalDeductionsWon,
    settlementWon: input.grossSalesWon.sub(totalDeductionsWon),
  };
}

export function calculateOnlineMarketSettlement(input: OnlineMarketSettlementInput): OnlineMarketSettlementResult {
  const settlement = calculateCommissionSettlement(input);
  const returnsWon = input.returnsWon ?? new Decimal(0);
  return {
    ...settlement,
    returnsWon,
    totalDeductionsWon: settlement.totalDeductionsWon.add(returnsWon),
    settlementWon: settlement.settlementWon.sub(returnsWon),
  };
}

export interface MonthlyProfitLossInput {
  salesWon: Decimal;
  fixedCostWon: Decimal;
  variableCostWon: Decimal;
}

export function calculateMonthlyProfitLoss(input: MonthlyProfitLossInput) {
  const totalCostsWon = input.fixedCostWon.add(input.variableCostWon);
  return { totalCostsWon, profitWon: input.salesWon.sub(totalCostsWon) };
}

export function calculateBusinessFeasibility(input: MonthlyProfitLossInput & { initialInvestmentWon: Decimal }) {
  const result = calculateMonthlyProfitLoss(input);
  return { ...result, paybackMonths: result.profitWon.lte(0) ? null : input.initialInvestmentWon.div(result.profitWon) };
}

export function calculateFreelancerNetIncome(input: { grossWon: Decimal; expenseWon: Decimal; withholdingRatePercent: Decimal }) {
  const withholdingWon = input.grossWon.mul(input.withholdingRatePercent).div(100);
  return { withholdingWon, netWon: input.grossWon.sub(withholdingWon).sub(input.expenseWon) };
}

export function calculateDiscountRate(input: { originalWon: Decimal; discountedWon: Decimal }) {
  if (input.originalWon.lte(0)) throw new Error('정가는 0원보다 커야 합니다.');
  if (input.discountedWon.gt(input.originalWon)) throw new Error('할인가는 정가 이하여야 합니다.');
  const discountWon = input.originalWon.sub(input.discountedWon);
  return { discountWon, percent: discountWon.div(input.originalWon).mul(100) };
}
