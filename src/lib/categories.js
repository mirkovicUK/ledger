/**
 * Group transactions by categoryId.
 * Transactions with null/undefined categoryId go into the 'uncategorized' group.
 * Returns Map<string | 'uncategorized', Transaction[]>
 */
export function groupByCategory(transactions) {
  const map = new Map();
  for (const tx of transactions) {
    const key = tx.categoryId ?? 'uncategorized';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(tx);
  }
  return map;
}
