# Task 4 report: life, date, education, and unit modules

Status: complete. Task 4 only; no catalogue, definition, route, storage, or network changes.

Worktree: `/Users/bagjibong/Documents/ChatGPT/돈 벌자/.worktrees/calculator-catalog-vehicle-health`

Branch: `codex/calculator-catalog-vehicle-health`

Base: `e924abc`

Commit subject: `feat: add everyday date and education modules`

## Public contracts and formulas

All date functions require canonical, real `YYYY-MM-DD` dates. Date-only values are converted to UTC midnight solely as a time-zone-independent calendar representation; host locale and daylight-saving transitions do not affect results. Date offsets are whole safe-integer days and must remain within four-digit ISO years.

| Module | Function | Output and formula |
| --- | --- | --- |
| `lib/life/date.ts` | `calculateDaysBetween({ start, end })` | `{ days }` = end calendar day minus start calendar day; the sign is preserved. |
| | `calculateDateOffset({ date, days })` | `{ date }` after adding signed whole calendar days. |
| | `calculateDday({ targetDate, referenceDate })` | `{ days }` = target minus the explicitly supplied reference; reference day is D-0 and there is no implicit clock/today dependency. |
| | `calculateWeekday({ date })` | `{ weekdayIndex, weekday }` with Sunday index 0 and a Korean weekday label. |
| | `calculateInternationalAge({ birthDate, referenceDate })` | `{ age }` in completed years; future birth dates are rejected. |
| | `calculateKoreanAge({ birthDate, referenceDate })` | `{ age }` = reference year - birth year + 1; future birth dates are rejected. |
| | `calculateZodiac({ birthDate })` | `{ zodiac }` using the fixed 12-animal cycle anchored so 2020 is the rat year. |
| `lib/life/everyday.ts` | `calculatePercentage({ part, whole })` | `{ percentage }` = part / whole x 100; a zero whole returns zero. |
| | `calculateSplitExpense({ totalWon, people })` | `{ perPersonWon, remainderWon }`; per-person won is integer division and the undistributed whole-won remainder is retained. |
| | `calculateElectricityEstimate({ kwh, wonPerKwh, baseWon })` | `{ totalWon }` = kWh x entered unit price + entered base fee. |
| | `calculatePhonePlanCost({ monthlyWon, months, deviceWon, discountWon })` | `{ totalWon }` = monthly price x months + device price - discount. |
| | `calculateTipSplit({ billWon, tipPercent, people })` | `{ tipWon, totalWon, perPersonWon }`; tip = bill x entered percent / 100. |
| `lib/education/study.ts` | `calculateGpa({ courses })` | `{ gpa, totalCredits }`; GPA = sum(credits x grade points) / total credits, or zero when total credits are zero. |
| | `calculateGradeConversion({ gradePoint, fromScale, toScale })` | `{ gradePoint }` = input grade / source scale x target scale. |
| | `calculateStudyPlan({ totalMinutes, days })` | `{ dailyMinutes }` = total minutes / positive whole days. |
| | `convertUnit({ value, from, to })` | `{ value }`; length converts through metres, mass through kilograms, and temperatures through Celsius. Cross-category conversions and temperatures below absolute zero are rejected. |
| | `convertFuelEfficiency({ value, from, to })` | `{ value }`; supports km/L, L/100 km, and US mpg through km/L. Zero and negative efficiency are rejected. |
| | `compareTimeZones({ localMinutes, fromOffsetMinutes, toOffsetMinutes })` | `{ localMinutes, dayOffset }`; destination minutes = local - source UTC offset + destination UTC offset. All offsets are user inputs. |
| | `pickRandom({ choices, count, random? })` | `{ picks }`; partial Fisher-Yates selection without replacement. |
| | `generateLotteryNumbers({ count?, maximum?, random? })` | `{ numbers }`; sorted unique numbers, defaulting to 6 from 1 through 45. |

Currency, rates, grades, and unit values use a local 40-digit `decimal.js` clone. Random functions have no module-load side effect. Their optional `random` dependency makes tests deterministic; the default is created only when the function is called and requires browser `crypto.getRandomValues`. No choice or result is persisted or transmitted.

## TDD evidence

1. RED: created all three requested test files before production modules. `pnpm test tests/unit/life/date.test.ts tests/unit/life/everyday.test.ts tests/unit/education/study.test.ts` exited 1 with three expected unresolved imports for `date`, `everyday`, and `study`.
2. Initial GREEN iteration: 26 of 27 tests passed; the one failure exposed a test expectation calculated with the default 20-digit `Decimal` precision. Replaced it with the independently verified 40-digit literal for 1000 / 7.
3. GREEN: the focused command passed 3 files and 27 tests.
4. Boundary RED: added regressions for an offset outside the JavaScript/four-digit date range and Celsius below absolute zero converted to Fahrenheit. Both failed against the first implementation.
5. Boundary GREEN: date formatting now rejects invalid/out-of-range instants and temperature validation checks the shared Celsius base. The final focused run passed 3 files and 29 tests.

## Final verification

- `pnpm test`: 37 files, 298 tests passed.
- `pnpm exec tsc --noEmit --incremental false`: passed.
- Changed-file ESLint for all six production/test files: passed.
- `pnpm check:privacy`: passed; 64 application modules checked.
- `git diff --check`: passed.

No dependency, catalogue entry, calculator definition, route, network API, or storage API was added.
