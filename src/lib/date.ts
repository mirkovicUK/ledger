import {
  parseISO,
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isAfter,
  isBefore,
  isEqual,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';

/**
 * Parse an ISO date string (YYYY-MM-DD) to a Date object.
 * @param {string} isoString
 * @returns {Date}
 */
export function parseDate(isoString: string): Date {
  return parseISO(isoString);
}

/**
 * Format a Date object to an ISO 8601 date string (YYYY-MM-DD).
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Normalise an input that may be a Date object or a YYYY-MM-DD string to a Date.
 * @param {Date|string} value
 * @returns {Date}
 */
function toDate(value: Date | string): Date {
  return value instanceof Date ? value : parseISO(value);
}

/**
 * Check if a date falls within the range [start, end] (inclusive on both ends).
 * All arguments may be Date objects or YYYY-MM-DD strings.
 * @param {Date|string} date
 * @param {Date|string} start
 * @param {Date|string} end
 * @returns {boolean}
 */
export function isWithinRange(date: Date | string, start: Date | string, end: Date | string): boolean {
  const d = toDate(date);
  const s = toDate(start);
  const e = toDate(end);
  return (isEqual(d, s) || isAfter(d, s)) && (isEqual(d, e) || isBefore(d, e));
}

/**
 * Advance a date by one step of the given frequency.
 * Frequencies: daily (+1 day), weekly (+1 week), biweekly (+2 weeks),
 *              monthly (+1 month), yearly (+1 year).
 * @param {Date} date
 * @param {'daily'|'weekly'|'biweekly'|'monthly'|'yearly'} frequency
 * @returns {Date}
 */
export function advanceByFrequency(date: Date, frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'): Date {
  switch (frequency) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'biweekly':
      return addWeeks(date, 2);
    case 'monthly':
      return addMonths(date, 1);
    case 'yearly':
      return addYears(date, 1);
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

/**
 * Get the start of the period that contains referenceDate.
 * Periods: weekly → startOfWeek, monthly → startOfMonth, yearly → startOfYear.
 * @param {Date|string} referenceDate
 * @param {'weekly'|'monthly'|'yearly'} period
 * @returns {Date}
 */
export function periodStart(referenceDate: Date | string, period: 'weekly' | 'monthly' | 'yearly'): Date {
  const d = toDate(referenceDate);
  switch (period) {
    case 'weekly':
      return startOfWeek(d);
    case 'monthly':
      return startOfMonth(d);
    case 'yearly':
      return startOfYear(d);
    default:
      throw new Error(`Unknown period: ${period}`);
  }
}

/**
 * Get the end of the period that contains referenceDate.
 * Periods: weekly → endOfWeek, monthly → endOfMonth, yearly → endOfYear.
 * @param {Date|string} referenceDate
 * @param {'weekly'|'monthly'|'yearly'} period
 * @returns {Date}
 */
export function periodEnd(referenceDate: Date | string, period: 'weekly' | 'monthly' | 'yearly'): Date {
  const d = toDate(referenceDate);
  switch (period) {
    case 'weekly':
      return endOfWeek(d);
    case 'monthly':
      return endOfMonth(d);
    case 'yearly':
      return endOfYear(d);
    default:
      throw new Error(`Unknown period: ${period}`);
  }
}