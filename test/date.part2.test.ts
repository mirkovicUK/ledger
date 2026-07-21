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
describe('isWithinRange', () => {
  const start = '2024-01-01';
  const end = '2024-01-31';

  test('returns true when date equals start (inclusive)', () => {
    expect(isWithinRange('2024-01-01', start, end)).toBe(true);
  });

  test('returns true when date equals end (inclusive)', () => {
    expect(isWithinRange('2024-01-31', start, end)).toBe(true);
  });

  test('returns true for a date in the middle of the range', () => {
    expect(isWithinRange('2024-01-15', start, end)).toBe(true);
  });

  test('returns false for a date before start', () => {
    expect(isWithinRange('2023-12-31', start, end)).toBe(false);
  });

  test('returns false for a date after end', () => {
    expect(isWithinRange('2024-02-01', start, end)).toBe(false);
  });

  test('works with a single-day range (start === end)', () => {
    expect(isWithinRange('2024-06-15', '2024-06-15', '2024-06-15')).toBe(true);
    expect(isWithinRange('2024-06-14', '2024-06-15', '2024-06-15')).toBe(false);
    expect(isWithinRange('2024-06-16', '2024-06-15', '2024-06-15')).toBe(false);
  });

  test('accepts Date objects as arguments', () => {
    const d = new Date(2024, 0, 15);
    const s = new Date(2024, 0, 1);
    const e = new Date(2024, 0, 31);
    expect(isWithinRange(d, s, e)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// advanceByFrequency — each frequency type
// ---------------------------------------------------------------------------
describe('advanceByFrequency', () => {
  const base = parseDate('2024-03-15');

  test('daily advances by 1 day', () => {
    expect(formatDate(advanceByFrequency(base, 'daily'))).toBe('2024-03-16');
  });

  test('weekly advances by 7 days', () => {
    expect(formatDate(advanceByFrequency(base, 'weekly'))).toBe('2024-03-22');
  });

  test('biweekly advances by 14 days', () => {
    expect(formatDate(advanceByFrequency(base, 'biweekly'))).toBe('2024-03-29');
  });

  test('monthly advances by 1 month', () => {
    expect(formatDate(advanceByFrequency(base, 'monthly'))).toBe('2024-04-15');
  });

  test('yearly advances by 1 year', () => {
    expect(formatDate(advanceByFrequency(base, 'yearly'))).toBe('2025-03-15');
  });

  test('monthly handles month-end clamping (Jan 31 → Feb 28/29)', () => {
    const jan31 = parseDate('2024-01-31');
    // 2024 is a leap year so February has 29 days
    expect(formatDate(advanceByFrequency(jan31, 'monthly'))).toBe('2024-02-29');
  });

  test('throws for unknown frequency', () => {
    expect(() => advanceByFrequency(base, 'hourly')).toThrow(/unknown frequency/i);
  });
});