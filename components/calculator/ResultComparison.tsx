import type { CalculatorResult, ResultValue } from './ResultPanel';

export interface CalculationSnapshot {
  result: CalculatorResult;
  conditions: ReadonlyArray<ResultValue>;
}

function ComparisonTable({ caption, before, after }: { caption: string; before: ReadonlyArray<ResultValue>; after: ReadonlyArray<ResultValue> }) {
  const labels = [...new Set([...before, ...after].map(({ label }) => label))];
  return <div className="table-scroll comparison-scroll" tabIndex={0} role="region" aria-label={caption}>
    <table><caption>{caption}</caption><thead><tr><th scope="col">항목</th><th scope="col">저장한 조건</th><th scope="col">이번 계산</th></tr></thead>
      <tbody>{labels.map((label) => {
        const a = before.find((row) => row.label === label)?.value ?? '—';
        const b = after.find((row) => row.label === label)?.value ?? '—';
        return <tr key={label} className={a !== b ? 'comparison-changed' : undefined}><th scope="row">{label}</th><td>{a}</td><td>{b}{a !== b && <span className="comparison-badge">변경</span>}</td></tr>;
      })}</tbody>
    </table>
  </div>;
}

export function ResultComparison({ baseline, current, onClear }: { baseline: CalculationSnapshot; current: CalculationSnapshot | null; onClear: () => void }) {
  return <section className="result-comparison" aria-label="조건별 결과 비교">
    <div className="section-heading"><h2>조건별 결과 비교</h2><button type="button" className="button-secondary" onClick={onClear}>비교 기준 지우기</button></div>
    <p>저장한 조건은 이 페이지를 열어 둔 동안만 유지됩니다. 바뀐 항목에 ‘변경’을 표시합니다.</p>
    {!current ? <p role="status">조건을 바꾼 뒤 다시 계산하면 저장한 결과와 나란히 볼 수 있습니다.</p> : <>
      <ComparisonTable caption="결과 비교" before={[baseline.result.summary, ...(baseline.result.rows ?? [])]} after={[current.result.summary, ...(current.result.rows ?? [])]} />
      <ComparisonTable caption="입력 조건 비교" before={baseline.conditions} after={current.conditions} />
    </>}
  </section>;
}
