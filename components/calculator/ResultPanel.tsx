'use client';

import { useId, useState, type ReactNode } from 'react';

export interface ResultValue { label: string; value: string }
export interface CalculatorResult {
  summary: ResultValue;
  rows?: ReadonlyArray<ResultValue>;
}

const referenceWarning = '참고용 계산이며 실제 계약·청구 금액과 다를 수 있습니다.';

export function ResultPanel({ result, children }: { result: CalculatorResult | null; children?: ReactNode }) {
  const id = useId();
  const [copyStatus, setCopyStatus] = useState<{ result: CalculatorResult; message: string } | null>(null);

  async function copyResult() {
    if (!result) return;
    const text = [result.summary, ...(result.rows ?? [])].map((row) => `${row.label}: ${row.value}`).join('\n');
    try {
      await navigator.clipboard.writeText(`${text}\n${referenceWarning}`);
      setCopyStatus({ result, message: '결과를 복사했습니다.' });
    } catch {
      setCopyStatus({ result, message: '복사하지 못했습니다. 결과를 직접 선택해 복사해 주세요.' });
    }
  }

  return (
    <section className={result ? 'result-panel' : undefined} aria-labelledby={result ? `${id}-title` : undefined}>
      {result && <h2 id={`${id}-title`}>계산 결과</h2>}
      <div className="result-summary" aria-live="polite" aria-atomic="true">
        {result && <><p>{result.summary.label}</p><p className="result-value">{result.summary.value}</p></>}
      </div>
      {result && <>
        {Boolean(result.rows?.length) && <dl className="result-details">{result.rows?.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>}
        {children}
        <button className="button-secondary" type="button" onClick={copyResult}>결과 복사</button>
        <p className="copy-status" role="status">{copyStatus?.result === result ? copyStatus.message : ''}</p>
        <p className="result-disclaimer">계산 결과는 참고용입니다. 실제 계약·청구 금액은 조건과 반올림 방식에 따라 달라질 수 있습니다.</p>
      </>}
    </section>
  );
}
