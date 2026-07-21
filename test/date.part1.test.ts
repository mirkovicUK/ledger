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
describe('parseDate and formatDate roundtrip', () => {
  test('parseDate returns a Date object', () => {
    const d = parseDate('2024-03-15');
    expect(d).toBeInstanceOf(Date);
  });

  test('formatDate returns an ISO date string', () => {
    const d = new Date(2024, 2, 15); // month is 0-indexed
    expect(formatDate(d)).toBe('2024-03-15');
  });

  test('roundtrip: formatDate(parseDate(str)) === str', () => {
    const dates = ['2024-01-01', '2024-06-30', '2023-12-31', '2020-02-29'];
    for (const str of dates) {
      expect(formatDate(parseDate(str))).toBe(str);
    }
  });

  test('roundtrip: parseDate(formatDate(date)) produces same date', () => {
    const original = new Date(2024, 5, 17); // 2024-06-17
    const str = formatDate(original);
    const reparsed = parseDate(str);
    expect(formatDate(reparsed)).toBe(str);
  });
});

// ---------------------------------------------------------------------------
// isWithinRange — boundary conditions
// ---------------------------------------------------------------------------
describe('isWithinRange boundary conditions', () => {
  test('date equal to start is within range', () => {
    const start = parseDate('2024-03-15');
    const end = parseDate('2024-03-20');
    expect(isWithinRange(start, start, end)).toBe(true);
  });

  test('date equal to end is within range', () => {
    const start = parseDate('2024-03-15');
    const end = parseDate('2024-03-20');
    expect(isWithinRange(end, start, end)).toBe(true);
  });

  test('date before start is NOT within range', () => {
    const start = parseDate('2024-03-15');
    const end = parseDate('2024-03-20');
    const before = parseDate('2024-03-14');
    expect(isWithinRange(before, start, end)).toBe(false);
  });

  test('date after end is NOT within range', () => {
    const start = parseDate('2024-03-15');
    const end = parseDate('2024-03-20');
    const after = parseDate('2024-03-21');
    expect(isWithinRange(after, start, end)).toBe(false);
  });

  test('start equals end — only that exact date is in range', () => {
    const same = parseDate('2024-03-15');
    expect(isWithinRange(same, same, same)).toBe(true);
    
    const before = parseDate('2024-03-14');
    expect(isWithinRange(before, same, same)).toBe(false);
    
    const after = parseDate('2024-03-16');
    expect(isWithinRange(after, same, same)).toBe(false);
  });

  test('works with string inputs', () => {
    expect(isWithinRange('2024-03-17', '2024-03-15', '2024-03-20')).toBe(true);
    expect(isWithinRange('2024-03-14', '2024-03-15', '2024-03-20')).toBe(false);
    expect(isWithinRange('2024-03-21', '2024-03-15', '2024-03-20')).toBe(false);
  });
});