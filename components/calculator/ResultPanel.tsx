'use client';

import { useId, useState, type ReactNode } from 'react';

export interface ResultValue { label: string; value: string }
export interface CalculatorResult {
  summary: ResultValue;
  rows?: ReadonlyArray<ResultValue>;
}

const referenceWarning = '참고용 계산이며 실제 계약·청구 금액과 다를 수 있습니다.';

export function ResultPanel({ result, conditions, children, onCopy, onCompare }: { result: CalculatorResult | null; conditions?: ReadonlyArray<ResultValue>; children?: ReactNode; onCopy?: () => void; onCompare?: () => void }) {
  const id = useId();
  const [copyStatus, setCopyStatus] = useState<{ result: CalculatorResult; message: string } | null>(null);

  async function copyResult() {
    if (!result) return;
    const output = [result.summary, ...(result.rows ?? [])].map((row) => `${row.label}: ${row.value}`).join('\n');
    const text = conditions?.length ? `${output}\n\n계산에 사용한 조건\n${conditions.map((row) => `${row.label}: ${row.value}`).join('\n')}` : output;
    try {
      await navigator.clipboard.writeText(`${text}\n${referenceWarning}`);
      onCopy?.();
      setCopyStatus({ result, message: '결과를 복사했습니다.' });
    } catch {
      setCopyStatus({ result, message: '복사하지 못했습니다. 결과를 직접 선택해 복사해 주세요.' });
    }
  }

  return (
    <section className="result-panel" aria-labelledby={result ? `${id}-title` : undefined}>
      {result && <h2 id={`${id}-title`}>계산 결과</h2>}
      {!result && <p className="result-empty">입력한 조건으로 계산 결과를 확인하세요.</p>}
      <div className="result-summary" aria-live="polite" aria-atomic="true">
        {result && <><p>{result.summary.label}</p><p className="result-value">{result.summary.value}</p></>}
      </div>
      {result && <>
        {Boolean(result.rows?.length) && <dl className="result-details">{result.rows?.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>}
        {conditions && <details className="result-conditions"><summary>계산에 사용한 조건</summary><dl>{conditions.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></details>}
        <div className="result-actions"><button className="button-secondary" type="button" onClick={copyResult}>결과 복사</button>
        {onCompare && <button className="button-secondary" type="button" onClick={onCompare}>비교 기준으로 저장</button>}</div>
        <p className="copy-status" role="status">{copyStatus?.result === result ? copyStatus.message : ''}</p>
        {children}
        <p className="result-disclaimer">계산 결과는 참고용입니다. 실제 계약·청구 금액은 조건과 반올림 방식에 따라 달라질 수 있습니다.</p>
      </>}
    </section>
  );
}
