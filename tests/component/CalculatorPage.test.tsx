import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it } from 'vitest';
import { CalculatorPage } from '@/components/calculator/CalculatorPage';
import { CalculatorForm } from '@/components/calculator/CalculatorForm';
import { ResultPanel, type CalculatorResult } from '@/components/calculator/ResultPanel';
import { RepaymentTable } from '@/components/calculator/RepaymentTable';
import { RelatedCalculators } from '@/components/content/RelatedCalculators';
import { calculatorCatalog } from '@/lib/calculators/registry';
import type { CalculatorDefinition } from '@/lib/calculators/types';

afterEach(cleanup);
const definition: CalculatorDefinition<number, number> = {
  ...calculatorCatalog[1],
  guide: { ...calculatorCatalog[1].guide, examples: [{ title: '300km 운행', text: '연비 10km/L, 단가 1,700원이면 51,000원입니다.' }, { title: '100km 운행', text: '연비 10km/L, 단가 1,700원이면 17,000원입니다.' }] },
  parse: (raw) => Number(raw.distanceKm),
  calculate: (distance) => distance * 170,
};

function Calculation() {
  const [result, setResult] = useState<CalculatorResult | null>(null);
  return <><CalculatorForm fields={[{ name: 'distanceKm', label: '주행거리', required: true }]} onCalculate={(raw) => setResult({ summary: { label: '예상 비용', value: `${definition.calculate(definition.parse(raw))}원` } })} onReset={() => setResult(null)} onValuesChange={() => setResult(null)} /><ResultPanel result={result} /></>;
}

it('renders the guide and valid related routes around an independently resettable client calculation', async () => {
  const user = userEvent.setup();
  render(<CalculatorPage definition={definition}><Calculation /></CalculatorPage>);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('유류비·연비 계산기');
  expect(screen.getByText(definition.guide.formula)).toBeVisible();
  expect(screen.getByRole('heading', { name: '300km 운행' })).toBeVisible();
  expect(screen.getByRole('heading', { name: '100km 운행' })).toBeVisible();
  expect(screen.getByRole('link', { name: '한국석유공사 오피넷' })).toHaveAttribute('href', 'https://www.opinet.co.kr/');
  expect(screen.getByText('2026-09-16')).toHaveAttribute('datetime', '2026-09-16');
  expect(screen.getByRole('navigation', { name: '현재 위치' })).toHaveTextContent('자동차');
  await user.type(screen.getByRole('textbox'), '300{Enter}');
  expect(screen.getByText('51000원')).toBeVisible();
  await user.type(screen.getByRole('textbox'), '0');
  expect(screen.queryByText('51000원')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  await user.click(screen.getByRole('button', { name: '초기화' }));
  expect(screen.queryByRole('heading', { name: '계산 결과' })).not.toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveValue('');
});

it('deduplicates and caps related links at four known registry routes', () => {
  render(<RelatedCalculators slugs={['unknown', 'fuel-cost', 'fuel-cost', 'maintenance-cost', 'ev-charging-cost', 'purchase-cost', 'installment']} />);
  const links = within(screen.getByRole('navigation', { name: '관련 계산기' })).getAllByRole('link');
  expect(links).toHaveLength(4);
  expect(links[0]).toHaveAttribute('href', '/car/fuel-cost/');
  expect(screen.queryByText('unknown')).not.toBeInTheDocument();
});

it('labels the focusable internal repayment table scroll region and column headers', () => {
  render(<RepaymentTable rows={[{ month: 1, payment: '100000', principal: '90000', interest: '10000', balance: '910000' }]} />);
  const region = screen.getByRole('region', { name: '월별 상환 일정' });
  expect(region).toHaveAttribute('tabindex', '0');
  expect(region).toHaveAccessibleDescription('표가 화면보다 넓으면 좌우로 스크롤해 확인하세요.');
  expect(within(region).getByRole('table')).toHaveAccessibleName('월별 상환 일정');
  expect(within(region).getAllByRole('columnheader')).toHaveLength(5);
  expect(within(region).getByRole('rowheader')).toHaveTextContent('1');
});
