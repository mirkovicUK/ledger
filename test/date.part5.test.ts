import { describe, test, expect } from 'vitest';
import {
  parseDate,
  formatDate,
  isWithinRange,
  advanceByFrequency,
  periodStart,
  periodEnd,
} from '../src/lib/date.js';

// ---------------------------------------------------------------------------
// parseDate / formatDate roundtrip
// ---------------------------------------------------------------------------
describe('periodEnd', () => {
  // 2024-03-15 is a Friday
  const refDate = '2024-03-15';

  test('weekly: end of the week containing the date (Saturday)', () => {
    // date-fns endOfWeek defaults to Saturday as last day
    const result = periodEnd(refDate, 'weekly');
    // The date portion should be 2024-03-16 (Saturday)
    expect(formatDate(result)).toBe('2024-03-16');
  });

  test('monthly: last day of the month', () => {
    expect(formatDate(periodEnd(refDate, 'monthly'))).toBe('2024-03-31');
  });

  test('monthly: last day of February in a leap year', () => {
    expect(formatDate(periodEnd('2024-02-10', 'monthly'))).toBe('2024-02-29');
  });

  test('monthly: last day of February in a non-leap year', () => {
    expect(formatDate(periodEnd('2023-02-10', 'monthly'))).toBe('2023-02-28');
  });

  test('yearly: last day of the year', () => {
    expect(formatDate(periodEnd(refDate, 'yearly'))).toBe('2024-12-31');
  });

  test('accepts Date objects', () => {
    const d = new Date(2024, 2, 15);
    expect(formatDate(periodEnd(d, 'monthly'))).toBe('2024-03-31');
  });

  test('returns end of period when date is already at end', () => {
    expect(formatDate(periodEnd('2024-03-31', 'monthly'))).toBe('2024-03-31');
    expect(formatDate(periodEnd('2024-12-31', 'yearly'))).toBe('2024-12-31');
  });

  test('throws for unknown period', () => {
    expect(() => periodEnd(refDate, 'quarterly')).toThrow(/unknown period/i);
  });
});

// ---------------------------------------------------------------------------
// periodStart / periodEnd consistency
// ---------------------------------------------------------------------------


```