import '@testing-library/jest-dom/vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { CalculatorForm, type CalculatorField } from '@/components/calculator/CalculatorForm';
import { parseMoney } from '@/lib/calculators/validation';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const fields = [{ name: 'distanceKm', label: '주행거리', unit: 'km', required: true }] as const;

it('submits date and text fields locally and exposes their own validation', async () => {
  const user = userEvent.setup();
  const onCalculate = vi.fn();
  render(<CalculatorForm fields={[
    { name: 'date', label: '기준일', type: 'date', required: true, defaultValue: '2026-09-17' },
    { name: 'choices', label: '후보 목록', type: 'text', required: true, validate: (raw) => raw.includes(',') ? undefined : '두 항목 이상 입력해 주세요.' },
  ]} onCalculate={onCalculate} />);
  await user.type(screen.getByLabelText('후보 목록', { exact: false }), '사과');
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(screen.getByText('두 항목 이상 입력해 주세요.')).toBeVisible();
  expect(onCalculate).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('후보 목록', { exact: false }), ', 배');
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(onCalculate).toHaveBeenCalledWith({ date: '2026-09-17', choices: '사과, 배' });
});

it('disables native submission in server HTML until client event handlers are ready', () => {
  const html = renderToStaticMarkup(<CalculatorForm fields={fields} onCalculate={() => {}} />);
  render(<div dangerouslySetInnerHTML={{ __html: html }} />);
  expect(screen.getByRole('textbox')).toBeDisabled();
  expect(screen.getByRole('button', { name: '계산하기' })).toBeDisabled();
});

it('connects local required errors to the labelled field and focuses it', async () => {
  const user = userEvent.setup();
  const onCalculate = vi.fn();
  render(<CalculatorForm fields={fields} onCalculate={onCalculate} />);
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  const field = screen.getByRole('textbox', { name: '주행거리' });
  expect(field).toHaveAttribute('inputmode', 'decimal');
  expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(field).toHaveAccessibleDescription('km 주행거리를 입력해 주세요.');
  expect(field).toHaveFocus();
  expect(onCalculate).not.toHaveBeenCalled();
});

it('shows concise helper text without changing the labelled field description', () => {
  render(<CalculatorForm fields={[{ name: 'amount', label: '금액', unit: '원', hint: '원 단위 정수로 입력 · 예: 100,000' }]} onCalculate={() => {}} />);
  expect(screen.getByText('원 단위 정수로 입력 · 예: 100,000')).toBeVisible();
  expect(screen.getByRole('textbox', { name: '금액' })).toHaveAccessibleDescription('원 원 단위 정수로 입력 · 예: 100,000');
});

it('hydrates safely and keeps Enter submission local without navigation or storage', async () => {
  const user = userEvent.setup();
  const onCalculate = vi.fn();
  const network = vi.spyOn(globalThis, 'fetch');
  const storage = vi.spyOn(Storage.prototype, 'setItem');
  const push = vi.spyOn(history, 'pushState');
  const replace = vi.spyOn(history, 'replaceState');
  const initialUrl = location.href;
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(<CalculatorForm fields={fields} onCalculate={onCalculate} />);
  document.body.append(container);
  render(<CalculatorForm fields={fields} onCalculate={onCalculate} />, { container, hydrate: true });
  await user.type(screen.getByRole('textbox', { name: '주행거리' }), '1,200.5{Enter}');
  expect(onCalculate).toHaveBeenCalledWith({ distanceKm: '1,200.5' });
  expect(location.href).toBe(initialUrl);
  expect(network).not.toHaveBeenCalled();
  expect(storage).not.toHaveBeenCalled();
  expect(push).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
});

it('rejects nonnumeric input, supports select fields, and resets values and errors', async () => {
  const user = userEvent.setup();
  const onCalculate = vi.fn();
  const onReset = vi.fn();
  render(<CalculatorForm fields={[...fields, { name: 'method', label: '상환 방식', type: 'select', options: [{ value: 'equal', label: '원리금균등' }, { value: 'principal', label: '원금균등' }], defaultValue: 'equal' }]} onCalculate={onCalculate} onReset={onReset} />);
  await user.type(screen.getByRole('textbox'), 'abc');
  await user.selectOptions(screen.getByRole('combobox'), 'principal');
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  expect(onCalculate).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '초기화' }));
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  expect(screen.getByRole('combobox')).toHaveValue('equal');
  expect(onReset).toHaveBeenCalledOnce();
});

it('shows calculation failures as local form errors without exposing raw exception text', async () => {
  const user = userEvent.setup();
  render(<CalculatorForm fields={fields} onCalculate={() => { throw new Error('private raw value'); }} />);
  await user.type(screen.getByRole('textbox'), '50');
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(screen.getByRole('alert')).toHaveTextContent('입력값을 확인해 주세요.');
  expect(screen.queryByText('private raw value')).not.toBeInTheDocument();
});

it('describes large money amounts without reformatting while typing or invalidating a result on blur', async () => {
  const user = userEvent.setup();
  const onCalculate = vi.fn();
  const onValuesChange = vi.fn();
  render(<CalculatorForm fields={[{ name: 'amount', label: '대출 원금', unit: '원', defaultValue: '12000000' }]} onCalculate={onCalculate} onValuesChange={onValuesChange} />);
  const input = screen.getByRole('textbox', { name: '대출 원금' });
  expect(input).toHaveValue('12000000');
  expect(input).toHaveAccessibleDescription('원 1,200만 원');
  fireEvent.change(input, { target: { value: '123456789012345' } });
  expect(input).toHaveValue('123456789012345');
  expect(input).toHaveAccessibleDescription('원 123조 4,567억 8,901만 2,345원');
  fireEvent.blur(input);
  expect(input).toHaveValue('123,456,789,012,345');
  expect(onValuesChange).toHaveBeenCalledOnce();
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(onCalculate).toHaveBeenCalledWith({ amount: '123,456,789,012,345' });
});

it('adds money to an empty field, invalidates the previous result, and restores its default on reset', async () => {
  const user = userEvent.setup();
  const onCalculate = vi.fn();
  const onValuesChange = vi.fn();
  const onReset = vi.fn();
  render(<CalculatorForm fields={[{ name: 'amount', label: '저축액', unit: '원' }]} onCalculate={onCalculate} onValuesChange={onValuesChange} onReset={onReset} />);
  await user.click(screen.getByRole('button', { name: '저축액 1만원 더하기' }));
  expect(screen.getByRole('textbox')).toHaveValue('10,000');
  expect(screen.getByRole('textbox')).toHaveAccessibleDescription('원 1만 원');
  expect(onValuesChange).toHaveBeenCalledOnce();
  expect(onCalculate).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '초기화' }));
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.getByRole('textbox')).toHaveAccessibleDescription('원');
  expect(onReset).toHaveBeenCalledOnce();
});

it.each(['abc', '-100', '1.5', 'Infinity', '1e1000000000'])('preserves invalid money %s and disables additive shortcuts', async (raw) => {
  const user = userEvent.setup();
  const onValuesChange = vi.fn();
  render(<CalculatorForm fields={[{ name: 'amount', label: '금액', unit: '원' }]} onCalculate={() => {}} onValuesChange={onValuesChange} />);
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: raw } });
  fireEvent.blur(input);
  expect(input).toHaveValue(raw);
  expect(input).toHaveAccessibleDescription('원');
  const add = screen.getByRole('button', { name: '금액 1만원 더하기' });
  expect(add).toBeDisabled();
  await user.click(add);
  expect(input).toHaveValue(raw);
  expect(onValuesChange).toHaveBeenCalledOnce();
});

it('disables additions that exceed field validation without replacing the entered value', async () => {
  const user = userEvent.setup();
  const onValuesChange = vi.fn();
  render(<CalculatorForm fields={[{ name: 'amount', label: '예산', unit: '원', defaultValue: '995000', validate: (raw) => parseMoney(raw).gt(1000000) ? '최대 1,000,000원' : undefined }]} onCalculate={() => {}} onValuesChange={onValuesChange} />);
  const add = screen.getByRole('button', { name: '예산 1만원 더하기' });
  expect(add).toBeDisabled();
  await user.click(add);
  expect(screen.getByRole('textbox')).toHaveValue('995000');
  expect(onValuesChange).not.toHaveBeenCalled();
});

it('uses declared quick values to replace a field while preserving hidden defaults and reset behavior', async () => {
  const user = userEvent.setup();
  const onCalculate = vi.fn();
  const onValuesChange = vi.fn();
  const quickFields: CalculatorField[] = [
    { name: 'months', label: '저축 기간', unit: '개월', defaultValue: '12', quickValues: [{ label: '24개월', value: '24' }] },
    { name: 'hidden', label: '추가 금액', unit: '원', defaultValue: '500', visibleWhen: { field: 'months', value: '36' } },
  ];
  render(<CalculatorForm fields={quickFields} onCalculate={onCalculate} onValuesChange={onValuesChange} />);
  await user.click(screen.getByRole('button', { name: '저축 기간 24개월 입력' }));
  expect(screen.getByRole('textbox', { name: '저축 기간' })).toHaveValue('24');
  expect(onValuesChange).toHaveBeenCalledOnce();
  expect(onCalculate).not.toHaveBeenCalled();
  expect(screen.queryByRole('textbox', { name: '추가 금액' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '계산하기' }));
  expect(onCalculate).toHaveBeenCalledWith({ months: '24', hidden: '500' });
  await user.click(screen.getByRole('button', { name: '초기화' }));
  expect(screen.getByRole('textbox', { name: '저축 기간' })).toHaveValue('12');
});

it('keeps quick inputs disabled in server-rendered HTML until event handlers are ready', () => {
  const html = renderToStaticMarkup(<CalculatorForm fields={[{ name: 'amount', label: '금액', unit: '원' }]} onCalculate={() => {}} />);
  render(<div dangerouslySetInnerHTML={{ __html: html }} />);
  expect(screen.getByRole('button', { name: '금액 1만원 더하기' })).toBeDisabled();
});

it('offers stable larger increments for fields with defaults of at least one hundred million won', async () => {
  const user = userEvent.setup();
  render(<CalculatorForm fields={[{ name: 'amount', label: '주택 가격', unit: '원', defaultValue: '100000000' }]} onCalculate={() => {}} />);
  await user.click(screen.getByRole('button', { name: '주택 가격 1억원 더하기' }));
  expect(screen.getByRole('textbox')).toHaveValue('200,000,000');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '0' } });
  expect(screen.getByRole('button', { name: '주택 가격 1억원 더하기' })).toBeEnabled();
});
