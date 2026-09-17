'use client';

import Decimal from 'decimal.js';
import { useId, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

interface BaseField {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  hint?: string;
  visibleWhen?: { field: string; value: string };
}

export type CalculatorField = BaseField & (
  | { type?: 'number' | 'date' | 'text'; unit?: string; validate?: (raw: string) => string | undefined }
  | { type: 'select'; options: ReadonlyArray<{ value: string; label: string }> }
);

export interface CalculatorFormProps {
  fields: ReadonlyArray<CalculatorField>;
  onCalculate: (raw: Record<string, string>) => void;
  onReset?: () => void;
  onValuesChange?: () => void;
}

function initialValues(fields: ReadonlyArray<CalculatorField>) {
  return Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? '']));
}

function fieldError(field: CalculatorField, raw: string): string | undefined {
  if (!raw.trim()) return field.required ? `${field.label}를 입력해 주세요.` : undefined;
  if (field.type === 'select') {
    return field.options.some((option) => option.value === raw) ? undefined : '목록에서 선택해 주세요.';
  }
  if (field.type === 'text' || field.type === 'date') return field.validate?.(raw);
  try {
    if (!new Decimal(raw.replace(/[\s,]/g, '')).isFinite()) return '유한한 숫자를 입력해 주세요.';
  } catch {
    return '숫자 형식으로 입력해 주세요.';
  }
  return field.validate?.(raw);
}

export function CalculatorForm({ fields, onCalculate, onReset, onValuesChange }: CalculatorFormProps) {
  const id = useId();
  // Native form submission must stay disabled until preventDefault is attached.
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(() => initialValues(fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const visibleFields = fields.filter((field) => !field.visibleWhen || values[field.visibleWhen.field] === field.visibleWhen.value);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const nextErrors: Record<string, string> = {};
    for (const field of visibleFields) {
      const error = fieldError(field, values[field.name] ?? '');
      if (error) nextErrors[field.name] = error;
    }
    setErrors(nextErrors);
    const firstInvalid = visibleFields.find((field) => nextErrors[field.name]);
    if (firstInvalid) {
      const input = formRef.current?.elements.namedItem(firstInvalid.name);
      if (input instanceof HTMLElement) input.focus();
      return;
    }
    try {
      onCalculate({ ...values });
    } catch {
      setFormError('입력값을 확인해 주세요. 계산 가능한 범위와 입력 안내를 확인한 뒤 다시 계산해 주세요.');
    }
  }

  function change(name: string, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => { const next = { ...previous }; delete next[name]; return next; });
    setFormError('');
    onValuesChange?.();
  }

  return (
    <form ref={formRef} className="calculator-form" noValidate autoComplete="off" onSubmit={submit} onReset={(event) => {
      event.preventDefault();
      setValues(initialValues(fields));
      setErrors({});
      setFormError('');
      onReset?.();
    }}>
      <div className="calculator-form-heading"><h2>계산 조건</h2><p>필요한 항목만 입력한 뒤 계산하기를 눌러 주세요.</p></div>
      <fieldset className="calculator-fields" disabled={!ready} aria-label="계산값 입력">
      <div className="field-grid">
        {visibleFields.map((field) => {
          const fieldId = `${id}-${field.name}`;
          const unit = field.type !== 'select' ? field.unit : undefined;
          const describedBy = [unit && `${fieldId}-unit`, field.hint && `${fieldId}-hint`, errors[field.name] && `${fieldId}-error`].filter(Boolean).join(' ') || undefined;
          const attributes = { id: fieldId, name: field.name, required: field.required, value: values[field.name] ?? '', 'aria-invalid': errors[field.name] ? true as const : undefined, 'aria-describedby': describedBy };
          return (
            <div className="calculator-field" key={field.name}>
              <label htmlFor={fieldId}>{field.label}{field.required && <span className="required-label" aria-hidden="true">필수</span>}</label>
              <div className="field-control">
                {field.type === 'select' ? (
                  <select {...attributes} onChange={(event) => change(field.name, event.target.value)}>
                    <option value="">선택해 주세요</option>
                    {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : <input {...attributes} type={field.type === 'date' ? 'date' : 'text'} inputMode={field.type === 'text' || field.type === 'date' ? undefined : 'decimal'} spellCheck={false} onChange={(event) => change(field.name, event.target.value)} />}
                {unit && <span className="field-unit" id={`${fieldId}-unit`}>{unit}</span>}
              </div>
              {field.hint && <p className="field-hint" id={`${fieldId}-hint`}>{field.hint}</p>}
              {errors[field.name] && <p className="field-error" id={`${fieldId}-error`}>{errors[field.name]}</p>}
            </div>
          );
        })}
      </div>
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <div className="form-actions">
        <button className="button-primary" type="submit">계산하기</button>
        <button className="button-secondary" type="reset">초기화</button>
      </div>
      </fieldset>
      <noscript><p>계산하려면 브라우저에서 자바스크립트를 허용해 주세요. 입력값은 서버로 전송되지 않습니다.</p></noscript>
    </form>
  );
}
