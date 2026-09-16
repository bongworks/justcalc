import '@testing-library/jest-dom/vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { CalculatorForm } from '@/components/calculator/CalculatorForm';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const fields = [{ name: 'distanceKm', label: '주행거리', unit: 'km', required: true }] as const;

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
