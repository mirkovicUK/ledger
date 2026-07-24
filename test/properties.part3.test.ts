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

describe('Property 8: Filter results satisfy all applied criteria', () => {
  /**
   * For any list of transactions and any combination of filter criteria,
   * every transaction in applyFilters(transactions, criteria) satisfies
   * ALL non-null criteria simultaneously (AND logic).
   *
   * **Validates: Requirements 6.1, 6.3**
   */

  const P8_ACCOUNT_IDS = ['acct-1', 'acct-2', 'acct-3'];
  const P8_CATEGORY_IDS = ['cat-1', 'cat-2', 'cat-3', null];

  function p8RandInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function p8RandFloat(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  function p8Pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  function p8RandomDate2024(): string {
    const month = p8RandInt(1, 12);
    const day = p8RandInt(1, 28);
    return `2024-${p8Pad(month)}-${p8Pad(day)}`;
  }

  function p8GenerateTransactions() {
    const count = p8RandInt(5, 25);
    return Array.from({ length: count }, (_, i) => ({
      id: `tx-p8-${i}`,
      accountId: P8_ACCOUNT_IDS[p8RandInt(0, P8_ACCOUNT_IDS.length - 1)],
      categoryId: P8_CATEGORY_IDS[p8RandInt(0, P8_CATEGORY_IDS.length - 1)],
      date: p8RandomDate2024(),
      amount: p8RandFloat(-500, 1000),
      description: `Transaction ${i}`,
    }));
  }

  function p8GenerateCriteria() {
    const criteria: {
      accountId: string | null;
      categoryId: string | null;
      dateRange: { from: string; to: string } | null;
      amountRange: { min: number; max: number } | null;
    } = {
      accountId: null,
      categoryId: null,
      dateRange: null,
      amountRange: null,
    };

    // accountId: null or one of the 3 account ids
    if (Math.random() < 0.5) {
      criteria.accountId = P8_ACCOUNT_IDS[p8RandInt(0, P8_ACCOUNT_IDS.length - 1)];
    }

    // categoryId: null, one of the 3 real category ids, or 'uncategorized'
    if (Math.random() < 0.5) {
      const roll = Math.random();
      if (roll < 0.6) {
        criteria.categoryId = ['cat-1', 'cat-2', 'cat-3'][p8RandInt(0, 2)];
      } else {
        criteria.categoryId = 'uncategorized';
      }
    }

    // dateRange: null or random from/to within 2024
    if (Math.random() < 0.5) {
      const fromMonth = p8RandInt(1, 6);
      const toMonth = p8RandInt(7, 12);
      const fromDay = p8RandInt(1, 28);
      const toDay = p8RandInt(1, 28);
      criteria.dateRange = {
        from: `2024-${p8Pad(fromMonth)}-${p8Pad(fromDay)}`,
        to: `2024-${p8Pad(toMonth)}-${p8Pad(toDay)}`,
      };
    }

    // amountRange: null or random min/max
    if (Math.random() < 0.5) {
      const min = p8RandFloat(-500, 250);
      const max = p8RandFloat(min, 1000);
      criteria.amountRange = { min, max };
    }

    return criteria;
  }

  test('every result satisfies ALL non-null criteria across 100 random cases', () => {
    for (let iteration = 0; iteration < 100; iteration++) {
      const transactions = p8GenerateTransactions();
      const criteria = p8GenerateCriteria();
      const results = applyFilters(transactions, criteria);

      for (const t of results) {
        // accountId criterion
        if (criteria.accountId != null) {
          expect(t.accountId).toBe(criteria.accountId);
        }

        // categoryId criterion
        if (criteria.categoryId != null) {
          const effectiveCategory = t.categoryId ?? 'uncategorized';
          expect(effectiveCategory).toBe(criteria.categoryId);
        }

        // dateRange criterion
        if (criteria.dateRange != null) {
          expect(t.date >= criteria.dateRange.from).toBe(true);
          expect(t.date <= criteria.dateRange.to).toBe(true);
        }

        // amountRange criterion
        if (criteria.amountRange != null) {
          expect(t.amount).toBeGreaterThanOrEqual(criteria.amountRange.min);
          expect(t.amount).toBeLessThanOrEqual(criteria.amountRange.max);
        }
      }
    }
  });

  test('null criteria returns all transactions unchanged across 100 random cases', () => {
    for (let iteration = 0; iteration < 100; iteration++) {
      const transactions = p8GenerateTransactions();
      const nullCriteria = {
        accountId: null,
        categoryId: null,
        dateRange: null,
        amountRange: null,
      };
      const results = applyFilters(transactions, nullCriteria);
      expect(results).toHaveLength(transactions.length);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 9: Sort results are correctly ordered
// Validates: Requirements 6.2
// ---------------------------------------------------------------------------