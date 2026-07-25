import { describe, it, expect } from 'vitest';
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
describe('parseDate and formatDate roundtrip', () => {
  it('parseDate returns a Date object', () => {
    const d = parseDate('2024-03-15');
    expect(d).toBeInstanceOf(Date);
  });

  it('formatDate returns an ISO date string', () => {
    const d = new Date(2024, 2, 15); // month is 0-indexed
    expect(formatDate(d)).toBe('2024-03-15');
  });

  it('roundtrip: formatDate(parseDate(str)) === str', () => {
    const dates = ['2024-01-01', '2024-06-30', '2023-12-31', '2020-02-29'];
    for (const str of dates) {
      expect(formatDate(parseDate(str))).toBe(str);
    }
  });

  it('roundtrip: parseDate(formatDate(date)) produces same date', () => {
    const original = new Date(2024, 5, 17); // 2024-06-17
    const str = formatDate(original);
    const reparsed = parseDate(str);
    expect(formatDate(reparsed)).toBe(str);
  });
});

// ---------------------------------------------------------------------------
// isWithinRange — boundary conditions
// ---------------------------------------------------------------------------