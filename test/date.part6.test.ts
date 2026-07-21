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
// periodStart and periodEnd consistency
// ---------------------------------------------------------------------------
describe('periodStart and periodEnd consistency', () => {
  const testCases: Array<{ date: string; period: 'weekly' | 'monthly' | 'yearly' }> = [
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