/**
 * Sort transactions by the given config.
 * Returns a new sorted array (does not mutate input).
 */
export interface SortConfig {
  field: 'date' | 'amount' | 'description';
  direction: 'asc' | 'desc';
}

export function sortTransactions<T extends { amount?: number; date?: string; description?: string }>(
  transactions: T[],
  config: SortConfig
): T[] {
  const { field, direction } = config;

  return [...transactions].sort((a, b) => {
    let comparison = 0;

    if (field === 'amount') {
      comparison = (a.amount ?? 0) - (b.amount ?? 0);
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