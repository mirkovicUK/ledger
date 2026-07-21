/**
 * @typedef {Object} FilterCriteria
 * @property {string|null} [accountId]
 * @property {string|null} [categoryId]
 * @property {{ from: string, to: string }|null} [dateRange]
 * @property {{ min: number, max: number }|null} [amountRange]
 */

/**
 * Apply all non-null filter criteria using AND logic.
 * Returns filtered array of transactions.
 * @param {Array} transactions
 * @param {FilterCriteria} criteria
 * @returns {Array}
 */
export function applyFilters(transactions, criteria) {
  if (!criteria) return transactions;

  const { accountId, categoryId, dateRange, amountRange } = criteria;

  return transactions.filter((t) => {
    // accountId: exact match
    if (accountId != null && t.accountId !== accountId) {
      return false;
    }

    // categoryId: exact match; treat null/undefined t.categoryId as 'uncategorized'
    if (categoryId != null) {
      const tCategory = t.categoryId ?? 'uncategorized';
      if (tCategory !== categoryId) {
        return false;
      }
    }

    // dateRange: string comparison works for YYYY-MM-DD
    if (dateRange != null) {
      if (t.date < dateRange.from || t.date > dateRange.to) {
        return false;
      }
    }

    // amountRange: numeric comparison
    if (amountRange != null) {
      if (t.amount < amountRange.min || t.amount > amountRange.max) {
        return false;
      }
    }

    return true;
  });
}
