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
describe('periodStart', () => {
  // 2024-03-15 is a Friday
  const refDate = '2024-03-15';

  test('weekly: start of the week containing the date (Sunday)', () => {
    // date-fns startOfWeek defaults to Sunday as first day
    const result = formatDate(periodStart(refDate, 'weekly'));
    expect(result).toBe('2024-03-10'); // Sunday 10 Mar
  });

  test('monthly: first day of the month', () => {
    expect(formatDate(periodStart(refDate, 'monthly'))).toBe('2024-03-01');
  });

  test('yearly: first day of the year', () => {
    expect(formatDate(periodStart(refDate, 'yearly'))).toBe('2024-01-01');
  });

  test('accepts Date objects', () => {
    const d = new Date(2024, 2, 15);
    expect(formatDate(periodStart(d, 'monthly'))).toBe('2024-03-01');
  });

  test('returns start of period when date is already at start', () => {
    expect(formatDate(periodStart('2024-03-01', 'monthly'))).toBe('2024-03-01');
    expect(formatDate(periodStart('2024-01-01', 'yearly'))).toBe('2024-01-01');
  });

  test('throws for unknown period', () => {
    expect(() => periodStart(refDate, 'quarterly' as any)).toThrow(/unknown period/i);
  });
});

// ---------------------------------------------------------------------------
// periodEnd — each period type
// ---------------------------------------------------------------------------