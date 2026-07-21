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

// ---------------------------------------------------------------------------
// periodStart — each period type
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
    expect(() => periodStart(refDate, 'quarterly')).toThrow(/unknown period/i);
  });
});

// ---------------------------------------------------------------------------
// periodEnd — each period type
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
