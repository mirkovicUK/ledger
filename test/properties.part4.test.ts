import { computeBudgetSpending } from '../src/lib/budget.js';
import { periodStart, periodEnd, isWithinRange } from '../src/lib/date.js';
import { applyFilters } from '../src/lib/filter.js';
import { exportToJSON, importFromJSON } from '../src/lib/storage.js';
import { sortTransactions } from '../src/lib/sort.js';
import { expandRule } from '../src/lib/recurring.js';
import { describe, test, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Property 3: Budget spending equals sum of matching transactions in period
// Validates: Requirements 4.4, 4.5
// ---------------------------------------------------------------------------

describe('Property 9: Sort results are correctly ordered', () => {
  /**
   * For any sorted array, every adjacent pair (result[i], result[i+1])
   * satisfies the ordering constraint for the given field and direction.
   *
   * **Validates: Requirements 6.2**
   */

  const FIELDS = ['date', 'amount', 'description'];
  const DIRECTIONS = ['asc', 'desc'];

  function p9RandInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function p9RandFloat(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  function p9Pad(n) {
    return String(n).padStart(2, '0');
  }

  /** Random YYYY-MM-DD in 2024 */
  function p9RandomDate2024() {
    const month = p9RandInt(1, 12);
    const day = p9RandInt(1, 28);
    return `2024-${p9Pad(month)}-${p9Pad(day)}`;
  }

  /** Random alphanumeric string of length 4-12 */
  function p9RandomDescription() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const len = p9RandInt(4, 12);
    let s = '';
    for (let i = 0; i < len; i++) {
      s += chars[p9RandInt(0, chars.length - 1)];
    }
    return s;
  }

  /** Generate 2–15 random transactions */
  function p9GenerateTransactions() {
    const count = p9RandInt(2, 15);
    return Array.from({ length: count }, (_, i) => ({
      id: `tx-p9-${i}`,
      accountId: 'acc-1',
      amount: p9RandFloat(-500, 1000),
      date: p9RandomDate2024(),
      description: p9RandomDescription(),
      categoryId: null,
      createdAt: new Date().toISOString(),
    }));
  }

  /**
   * Compare two values for the given field and return a number following
   * the same sign convention as Array.prototype.sort comparators:
   *   < 0 → a before b
   *   = 0 → equal
   *   > 0 → b before a
   */
  function compareValues(a, b, field) {
    if (field === 'amount') {
      return a.amount - b.amount;
    }
    // date and description: lexicographic
    const aVal = a[field] ?? '';
    const bVal = b[field] ?? '';
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  }

  test('every adjacent pair satisfies the ordering constraint across 100 random inputs', () => {
    const ITERATIONS = 100;

    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      const transactions = p9GenerateTransactions();
      const field = FIELDS[p9RandInt(0, FIELDS.length - 1)];
      const direction = DIRECTIONS[p9RandInt(0, DIRECTIONS.length - 1)];

      const result = sortTransactions(transactions, { field, direction });

      // Verify pairwise ordering invariant for all adjacent pairs
      for (let i = 0; i < result.length - 1; i++) {
        const cmp = compareValues(result[i], result[i + 1], field);

        if (direction === 'asc') {
          // result[i] should be <= result[i+1]
          expect(cmp).toBeLessThanOrEqual(0);
        } else {
          // direction === 'desc': result[i] should be >= result[i+1]
          expect(cmp).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('input array is not mutated after sorting', () => {
    const ITERATIONS = 100;

    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      const transactions = p9GenerateTransactions();
      const original = transactions.map(t => ({ ...t }));
      const field = FIELDS[p9RandInt(0, FIELDS.length - 1)];
      const direction = DIRECTIONS[p9RandInt(0, DIRECTIONS.length - 1)];

      sortTransactions(transactions, { field, direction });

      // Original array must be unchanged
      expect(transactions).toHaveLength(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(transactions[i].id).toBe(original[i].id);
        expect(transactions[i].amount).toBe(original[i].amount);
        expect(transactions[i].date).toBe(original[i].date);
        expect(transactions[i].description).toBe(original[i].description);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Property 10: Export/import roundtrip preserves all data
// Validates: Requirements 8.6
// ---------------------------------------------------------------------------


```