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
    expect(() => advanceByFrequency(base, 'hourly' as any)).toThrow(/unknown frequency/i);
  });
});

// ---------------------------------------------------------------------------
// periodStart — each period type
// ---------------------------------------------------------------------------