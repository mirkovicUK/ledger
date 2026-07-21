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
// isWithinRange
// ---------------------------------------------------------------------------
describe('isWithinRange', () => {
  const start = '2024-01-01';
  const end   = '2024-01-31';

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