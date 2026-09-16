import Decimal from 'decimal.js';
import {
  calculateEqualPaymentLoan,
  type RepaymentRow,
} from '@/lib/finance/loan';

export interface PurchaseCostInput {
  vehiclePriceWon: Decimal;
  optionalCostWon: Decimal;
  cashWon: Decimal;
  financedPrincipalWon: Decimal;
  annualRatePercent: Decimal;
  months: number;
}

export interface PurchaseCostResult {
  purchaseTotalWon: Decimal;
  cashWon: Decimal;
  financedPrincipalWon: Decimal;
  fundingGapWon: Decimal;
  monthlyPaymentWon: Decimal;
  installmentInterestWon: Decimal;
  installmentTotalPaidWon: Decimal;
  items: PurchaseCostItem[];
  schedule: RepaymentRow[];
}

export interface PurchaseCostItem {
  key:
    | 'vehiclePrice'
    | 'optionalCost'
    | 'cash'
    | 'financedPrincipal'
    | 'installmentTotalPaid'
    | 'fundingGap';
  label: string;
  amountWon: Decimal;
}

export function calculatePurchaseCost(input: PurchaseCostInput): PurchaseCostResult {
  const purchaseTotalWon = input.vehiclePriceWon.add(input.optionalCostWon);
  const fundingGapWon = purchaseTotalWon.sub(input.cashWon).sub(input.financedPrincipalWon);
  const installment = calculateEqualPaymentLoan({
    principal: input.financedPrincipalWon,
    annualRatePercent: input.annualRatePercent,
    months: input.months,
  });

  return {
    purchaseTotalWon,
    cashWon: input.cashWon,
    financedPrincipalWon: input.financedPrincipalWon,
    fundingGapWon,
    monthlyPaymentWon: installment.monthlyPayment,
    installmentInterestWon: installment.totalInterest,
    installmentTotalPaidWon: installment.totalPaid,
    items: [
      { key: 'vehiclePrice', label: '차량 가격', amountWon: input.vehiclePriceWon },
      { key: 'optionalCost', label: '선택 비용', amountWon: input.optionalCostWon },
      { key: 'cash', label: '초기 현금', amountWon: input.cashWon },
      { key: 'financedPrincipal', label: '할부 원금', amountWon: input.financedPrincipalWon },
      { key: 'installmentTotalPaid', label: '할부 총납입액', amountWon: installment.totalPaid },
      { key: 'fundingGap', label: '자금 조달 차이', amountWon: fundingGapWon },
    ],
    schedule: installment.rows,
  };
}
