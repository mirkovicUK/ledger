/**
 * @typedef {Object} SortConfig
 * @property {'date'|'amount'|'description'} field
 * @property {'asc'|'desc'} direction
 */

/**
 * Sort transactions by the given config.
 * Returns a new sorted array (does not mutate input).
 * @param {Array} transactions
 * @param {SortConfig} config
 * @returns {Array}
 */
export function sortTransactions(transactions, config) {
  const { field, direction } = config;

  return [...transactions].sort((a, b) => {
    let comparison = 0;

    if (field === 'amount') {
      comparison = a.amount - b.amount;
    } else {
      // date and description are both strings — lexicographic comparison
      const aVal = a[field] ?? '';
      const bVal = b[field] ?? '';
      if (aVal < bVal) comparison = -1;
      else if (aVal > bVal) comparison = 1;
      else comparison = 0;
    }

    return direction === 'desc' ? -comparison : comparison;
  });
}
