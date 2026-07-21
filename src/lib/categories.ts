/**
 * Group transactions by categoryId.
 * Transactions with null/undefined categoryId go into the 'uncategorized' group.
 * Returns Map<string | 'uncategorized', Transaction[]>
 */
import type { Transaction } from './types.js';

export function groupByCategory(transactions: Transaction[]): Map<string | 'uncategorized', Transaction[]> {
  const map = new Map<string | 'uncategorized', Transaction[]>();
  for (const tx of transactions) {
    const key = tx.categoryId ?? 'uncategorized';
    if (!map.has(key)) map.set(key, []);
    map.get(key)?.push(tx);
  }
  return map;
}