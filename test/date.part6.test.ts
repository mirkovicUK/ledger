import { describe, test, expect } from 'vitest';
import {
  parseDate,
  formatDate,
  isWithinRange,
  periodStart,
  periodEnd,
} from '../src/lib/date.js';

// ---------------------------------------------------------------------------
// parseDate / formatDate roundtrip
// ---------------------------------------------------------------------------
describe('periodStart and periodEnd consistency', () => {
  const testCases = [
    { date: '2024-03-15', period: 'monthly' },
    { date: '2024-06-01', period: 'monthly' },
    { date: '2024-12-31', period: 'monthly' },
    { date: '2024-03-15', period: 'yearly' },
    { date: '2024-03-15', period: 'weekly' },
  ];

  test.each(testCases)(
    'start is not after end for period=$period date=$date',
    ({ date, period }) => {
      const start = periodStart(date, period);
      const end = periodEnd(date, period);
      expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
    }
  );

  test.each(testCases)(
    'reference date falls within its own period for period=$period date=$date',
    ({ date, period }) => {
      const start = periodStart(date, period);
      const end = periodEnd(date, period);
      expect(isWithinRange(date, start, end)).toBe(true);
    }
  );
});