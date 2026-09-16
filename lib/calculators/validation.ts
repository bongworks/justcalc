import Decimal from 'decimal.js';

function parseDecimal(raw: string): Decimal {
  const normalized = raw.replace(/[\s,]/g, '');

  if (!normalized) {
    throw new Error('값을 입력해 주세요.');
  }

  try {
    const value = new Decimal(normalized);

    if (!value.isFinite()) {
      throw new Error('유한한 숫자를 입력해 주세요.');
    }

    return value;
  } catch (error) {
    if (error instanceof Error && error.message === '유한한 숫자를 입력해 주세요.') {
      throw error;
    }

    throw new Error('숫자 형식으로 입력해 주세요.');
  }
}

export function parsePositiveDecimal(raw: string): Decimal {
  const value = parseDecimal(raw);

  if (value.lte(0)) {
    throw new Error('0보다 큰 값을 입력해 주세요.');
  }

  return value;
}

export function parseNonNegativeDecimal(raw: string): Decimal {
  const value = parseDecimal(raw);

  if (value.lt(0)) {
    throw new Error('0 이상 값을 입력해 주세요.');
  }

  return value;
}

export function parseMoney(raw: string): Decimal {
  const value = parseNonNegativeDecimal(raw);

  if (!value.isInteger()) {
    throw new Error('원화 금액은 정수로 입력해 주세요.');
  }

  return value;
}
