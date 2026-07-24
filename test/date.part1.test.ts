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
describe('isWithinRange', () => {
  it('returns true for date equal to start', () => {
    expect(isWithinRange(new Date(2024, 0, 1), new Date(2024, 0, 1), new Date(2024, 0, 31))).toBe(true);
  });

  it('returns true for date equal to end', () => {
    expect(isWithinRange(new Date(2024, 0, 31), new Date(2024, 0, 1), new Date(2024, 0, 31))).toBe(true);
  });

  it('returns true for date within range', () => {
    expect(isWithinRange(new Date(2024, 0, 15), new Date(2024, 0, 1), new Date(2024, 0, 31))).toBe(true);
  });

  it('returns false for date before range', () => {
    expect(isWithinRange(new Date(2023, 11, 31), new Date(2024, 0, 1), new Date(2024, 0, 31))).toBe(false);
  });

  it('returns false for date after range', () => {
    expect(isWithinRange(new Date(2024, 1, 1), new Date(2024, 0, 1), new Date(2024, 0, 31))).toBe(false);
  });

  it('handles single-day range correctly', () => {
    const singleDate = new Date(2024, 5, 15);
    expect(isWithinRange(singleDate, singleDate, singleDate)).toBe(true);
    expect(isWithinRange(new Date(2024, 5, 14), singleDate, singleDate)).toBe(false);
    expect(isWithinRange(new Date(2024, 5, 16), singleDate, singleDate)).toBe(false);
  });

  it('accepts string inputs', () => {
    expect(isWithinRange('2024-01-15', '2024-01-01', '2024-01-31')).toBe(true);
    expect(isWithinRange('2024-01-01', '2024-01-01', '2024-01-31')).toBe(true);
    expect(isWithinRange('2024-01-31', '2024-01-01', '2024-01-31')).toBe(true);
    expect(isWithinRange('2023-12-31', '2024-01-01', '2024-01-31')).toBe(false);
    expect(isWithinRange('2024-02-01', '2024-01-01', '2024-01-31')).toBe(false);
  });
});