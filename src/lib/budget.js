import { periodStart, periodEnd, isWithinRange, parseDate } from './date.js';

/**
 * Compute the total spending for a budget within its current period.
 *
 * Filters transactions by matching categoryId and by whether the transaction's
 * date falls within [periodStart(referenceDate, budget.period), periodEnd(referenceDate, budget.period)].
 *
 * @param {{ categoryId: string, period: 'weekly'|'monthly'|'yearly' }} budget
 * @param {Array<{ categoryId: string|null|undefined, date: string, amount: number }>} transactions
 * @param {string} referenceDate - YYYY-MM-DD string
 * @returns {number} - sum of matching transaction amounts, or 0 if none match
 */
export function computeBudgetSpending(budget, transactions, referenceDate) {
  const start = periodStart(referenceDate, budget.period);
  const end = periodEnd(referenceDate, budget.period);

  return transactions
    .filter(t => t.categoryId === budget.categoryId && isWithinRange(parseDate(t.date), start, end))
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Determine if a budget is overspent.
 *
 * @param {number} spent
 * @param {number} limit
 * @returns {boolean} - true if spent > limit
 */
export function isOverspent(spent, limit) {
  return spent > limit;
}

/**
 * Compute the progress ratio of spending against a budget limit.
 * Returns 0 when limit is 0 to avoid division by zero.
 *
 * @param {number} spent
 * @param {number} limit
 * @returns {number} - spent / limit, or 0 if limit is 0
 */
export function progressRatio(spent, limit) {
  if (limit === 0) return 0;
  return spent / limit;
}
