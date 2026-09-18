import { useId } from 'react';
import type Decimal from 'decimal.js';
import { formatWon } from '@/lib/calculators/format';
import type { RepaymentRow } from '@/lib/finance/loan';

type DisplayRepaymentRow = { [Key in keyof RepaymentRow]: Key extends 'month' ? number : Decimal.Value };

export function RepaymentTable({ rows, caption = '월별 상환 일정' }: { rows: ReadonlyArray<DisplayRepaymentRow>; caption?: string }) {
  const id = useId();
  return (
    <div className="repayment-table">
      <p className="field-hint" id={`${id}-hint`}>표를 좌우로 밀어 나머지 열을 확인하세요.</p>
      <div className="table-scroll" role="region" aria-label={caption} aria-describedby={`${id}-hint`} tabIndex={0}>
        <table>
          <caption>{caption}</caption>
          <thead><tr><th scope="col">회차</th><th scope="col">납입액</th><th scope="col">원금</th><th scope="col">이자</th><th scope="col">남은 원금</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.month}><th scope="row">{row.month}</th><td>{formatWon(row.payment)}</td><td>{formatWon(row.principal)}</td><td>{formatWon(row.interest)}</td><td>{formatWon(row.balance)}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
