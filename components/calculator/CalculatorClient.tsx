'use client';

import { useEffect, useRef, useState } from 'react';
import { getCalculatorBySlug } from '@/lib/calculators/registry';
import type { DisplayResult } from '@/lib/calculators/definitions';
import { trackCalculatorEvent } from '@/lib/analytics/events';
import { formatNumber, formatWon } from '@/lib/calculators/format';
import Decimal from 'decimal.js';
import { CalculatorForm } from './CalculatorForm';
import { ResultPanel } from './ResultPanel';
import { RepaymentTable } from './RepaymentTable';
import { ResultComparison, type CalculationSnapshot } from './ResultComparison';

export function CalculatorClient({ slug }: { slug: string }) {
  return <CalculatorWorkspace key={slug} slug={slug} />;
}

function CalculatorWorkspace({ slug }: { slug: string }) {
  const definition = getCalculatorBySlug(slug);
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [current, setCurrent] = useState<CalculationSnapshot | null>(null);
  const [baseline, setBaseline] = useState<CalculationSnapshot | null>(null);
  const [shareStatus, setShareStatus] = useState('');
  const started = useRef(false);
  const viewed = useRef<string | null>(null);
  useEffect(() => {
    if (viewed.current !== slug) {
      trackCalculatorEvent('calculator_view', slug);
      viewed.current = slug;
    }
  }, [slug]);
  if (!definition) return null;

  function start() {
    if (!started.current) { trackCalculatorEvent('calculator_start', slug); started.current = true; }
  }

  async function shareLink() {
    try {
      await navigator.clipboard.writeText(new URL(definition!.route, window.location.origin).href);
      trackCalculatorEvent('share', slug, { source: 'copy_link' });
      setShareStatus('입력값 없는 페이지 링크를 복사했습니다.');
    } catch {
      setShareStatus('링크를 복사하지 못했습니다. 주소 표시줄의 기본 주소를 복사해 주세요.');
    }
  }

  return <>
    <div className="calculator-workspace-grid">
      <CalculatorForm fields={definition.fields} onValuesChange={() => { start(); setResult(null); setCurrent(null); }} onReset={() => {
      setResult(null); setCurrent(null); setBaseline(null); setShareStatus(''); started.current = false; trackCalculatorEvent('calculator_reset', slug);
    }} onCalculate={(raw) => {
      start(); trackCalculatorEvent('calculator_submit', slug);
      try {
        const next = definition.evaluate(raw);
        const conditions = definition.fields.filter((field) => !field.visibleWhen || raw[field.visibleWhen.field] === field.visibleWhen.value).map((field) => {
          const value = raw[field.name]?.trim() ?? '';
          if (field.type === 'select') return { label: field.label, value: field.options.find((option) => option.value === value)?.label ?? value };
          let display = value || '미입력';
          if (value && field.type !== 'text' && field.type !== 'date') {
            const numeric = new Decimal(value.replace(/[\s,]/g, ''));
            const formatted = numeric.decimalPlaces() <= 6 ? formatNumber(numeric, numeric.decimalPlaces()) : numeric.toString();
            display = `${formatted}${field.unit ? ` ${field.unit}` : ''}`;
          }
          return { label: field.label, value: display };
        });
        setResult(next);
        setCurrent({ result: next, conditions });
        trackCalculatorEvent('calculator_result', slug, { result_type: 'success' });
      } catch (error) {
        setResult(null); setCurrent(null); trackCalculatorEvent('calculator_result', slug, { result_type: 'error' }); throw error;
      }
      }} />
      <ResultPanel result={result} conditions={current?.conditions} onCompare={current ? () => setBaseline(current) : undefined} onCopy={() => trackCalculatorEvent('share', slug, { source: 'copy_result' })}>
      {result?.schedules?.map((schedule) => <RepaymentTable key={schedule.title} caption={`${schedule.title} 월별 상환 일정`} rows={schedule.rows} />)}
      {result?.savingsRows && <div className="table-scroll schedule-scroll" role="region" aria-label="월별 누적 추이" tabIndex={0}><table><caption>{result.savingsCaption ?? '월별 누적 추이'}</caption><thead><tr><th scope="col">개월</th><th scope="col">납입액</th><th scope="col">이자</th><th scope="col">잔액</th></tr></thead><tbody>{result.savingsRows.map((row) => <tr key={row.month}><th scope="row">{row.month}</th><td>{formatWon(row.contribution)}</td><td>{formatWon(row.interest)}</td><td>{formatWon(row.balance)}</td></tr>)}</tbody></table></div>}
      </ResultPanel>
    </div>
    {baseline && <ResultComparison baseline={baseline} current={current} onClear={() => setBaseline(null)} />}
    <button type="button" className="button-secondary" onClick={shareLink}>페이지 링크 복사</button>
    <p role="status" className="copy-status">{shareStatus}</p>
    <p className="field-hint">입력값은 이 브라우저에서만 계산합니다. 금액은 원 단위 반올림, 수량은 소수점 둘째 자리까지 표시합니다.</p>
  </>;
}
