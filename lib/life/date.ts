const MILLISECONDS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'] as const;
const ZODIAC_ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'] as const;

interface CalendarDate {
  year: number;
  month: number;
  day: number;
  epochMilliseconds: number;
}

export interface DaysBetweenInput {
  start: string;
  end: string;
}

export interface DateOffsetInput {
  date: string;
  days: number;
}

export interface AgeInput {
  birthDate: string;
  referenceDate: string;
}

function parseIsoDate(value: string): CalendarDate {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) throw new Error('날짜는 올바른 YYYY-MM-DD 형식이어야 합니다.');

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error('날짜는 실제로 존재하는 YYYY-MM-DD 형식이어야 합니다.');
  }

  return { year, month, day, epochMilliseconds: date.getTime() };
}

function formatIsoDate(epochMilliseconds: number): string {
  const date = new Date(epochMilliseconds);
  const year = date.getUTCFullYear();
  if (!Number.isFinite(year) || year < 0 || year > 9999) {
    throw new Error('결과 날짜는 0000-01-01부터 9999-12-31 사이여야 합니다.');
  }

  return `${String(year).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`;
}

function assertBirthNotAfterReference(birth: CalendarDate, reference: CalendarDate): void {
  if (birth.epochMilliseconds > reference.epochMilliseconds) {
    throw new Error('출생일은 기준일보다 늦을 수 없습니다.');
  }
}

// Date-only calculations intentionally ignore host time zones and daylight-saving transitions.
export function calculateDaysBetween(input: DaysBetweenInput): { days: number } {
  const start = parseIsoDate(input.start);
  const end = parseIsoDate(input.end);
  return { days: (end.epochMilliseconds - start.epochMilliseconds) / MILLISECONDS_PER_DAY };
}

export function calculateDateOffset(input: DateOffsetInput): { date: string } {
  if (!Number.isSafeInteger(input.days)) throw new Error('더할 날짜 수는 안전한 정수여야 합니다.');
  const date = parseIsoDate(input.date);
  return { date: formatIsoDate(date.epochMilliseconds + input.days * MILLISECONDS_PER_DAY) };
}

// D-day is deterministic: target minus an explicit reference date, where the reference day is zero.
export function calculateDday(input: { targetDate: string; referenceDate: string }): { days: number } {
  return calculateDaysBetween({ start: input.referenceDate, end: input.targetDate });
}

export function calculateWeekday(input: { date: string }): { weekdayIndex: number; weekday: (typeof WEEKDAYS)[number] } {
  const date = parseIsoDate(input.date);
  const weekdayIndex = new Date(date.epochMilliseconds).getUTCDay();
  return { weekdayIndex, weekday: WEEKDAYS[weekdayIndex] };
}

export function calculateInternationalAge(input: AgeInput): { age: number } {
  const birth = parseIsoDate(input.birthDate);
  const reference = parseIsoDate(input.referenceDate);
  assertBirthNotAfterReference(birth, reference);

  const birthdayHasPassed = reference.month > birth.month || (reference.month === birth.month && reference.day >= birth.day);
  return { age: reference.year - birth.year - (birthdayHasPassed ? 0 : 1) };
}

export function calculateKoreanAge(input: AgeInput): { age: number } {
  const birth = parseIsoDate(input.birthDate);
  const reference = parseIsoDate(input.referenceDate);
  assertBirthNotAfterReference(birth, reference);
  return { age: reference.year - birth.year + 1 };
}

export function calculateZodiac(input: { birthDate: string }): { zodiac: (typeof ZODIAC_ANIMALS)[number] } {
  const birth = parseIsoDate(input.birthDate);
  const index = ((birth.year - 4) % ZODIAC_ANIMALS.length + ZODIAC_ANIMALS.length) % ZODIAC_ANIMALS.length;
  return { zodiac: ZODIAC_ANIMALS[index] };
}
