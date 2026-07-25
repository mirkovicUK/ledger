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

  function p9RandInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function p9RandFloat(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  function p9Pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  /** Random YYYY-MM-DD in 2024 */
  function p9RandomDate2024(): string {
    const month = p9RandInt(1, 12);
    const day = p9RandInt(1, 28);
    return `2024-${p9Pad(month)}-${p9Pad(day)}`;
  }

  /** Random alphanumeric string of length 4-12 */
  function p9RandomDescription(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const len = p9RandInt(4, 12);
    let s = '';
    for (let i = 0; i < len; i++) {
      s += chars[p9RandInt(0, chars.length - 1)];
    }
    return s;
  }

  /** Generate 2–15 random transactions */
  function p9GenerateTransactions(): Array<{
    id: string;
    accountId: string;
    amount: number;
    date: string;
    description: string;
    categoryId: null;
    createdAt: string;
  }> {
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
  function compareValues(a: any, b: any, field: string): number {
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
      const original = transactions.map((t) => ({ ...t }));
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


describe('Property 10: Export/import roundtrip preserves all data', () => {
  test('roundtrip preserves all data fields', () => {
    // Generate a complex state with various data types and structures
    const testState = {
      accounts: [
        {
          id: 'acc-1',
          name: 'Checking Account',
          type: 'checking',
          createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
        },
        {
          id: 'acc-2',
          name: 'Savings Account',
          type: 'savings',
          createdAt: new Date('2024-01-02T00:00:00Z').toISOString(),
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          accountId: 'acc-1',
          amount: 100.50,
          date: '2024-01-01',
          description: 'Grocery Shopping',
          categoryId: 'cat-1',
          createdAt: new Date('2024-01-01T12:00:00Z').toISOString(),
        },
        {
          id: 'tx-2',
          accountId: 'acc-2',
          amount: -25.75,
          date: '2024-01-02',
          description: 'ATM Withdrawal',
          categoryId: null,
          createdAt: new Date('2024-01-02T14:30:00Z').toISOString(),
        },
      ],
      categories: [
        {
          id: 'cat-1',
          name: 'Groceries',
        },
        {
          id: 'cat-2',
          name: 'Entertainment',
        },
      ],
      budgets: [
        {
          id: 'bud-1',
          categoryId: 'cat-1',
          limit: 500,
          period: 'monthly',
          startDate: '2024-01-01',
        },
      ],
      recurringRules: [
        {
          id: 'rule-1',
          accountId: 'acc-1',
          amount: 50,
          description: 'Coffee Subscription',
          categoryId: 'cat-1',
          frequency: 'monthly',
          startDate: '2024-01-01',
          lastExpandedDate: null,
        },
      ],
    };

    // Perform roundtrip: export → import
    const jsonString = exportToJSON(testState);
    const result = importFromJSON(jsonString);

    // Verify success
    expect(result.success).toBe(true);

    // Verify imported data matches original
    const importedState = result.data;

    // Compare top-level properties
    expect(importedState.accounts).toEqual(testState.accounts);
    expect(importedState.transactions).toEqual(testState.transactions);
    expect(importedState.categories).toEqual(testState.categories);
    expect(importedState.budgets).toEqual(testState.budgets);
    expect(importedState.recurringRules).toEqual(testState.recurringRules);

    // Verify specific field equality with detailed checks
    testState.accounts.forEach((acc, index) => {
      const importedAcc = importedState.accounts[index];
      expect(importedAcc.id).toBe(acc.id);
      expect(importedAcc.name).toBe(acc.name);
      expect(importedAcc.type).toBe(acc.type);
      expect(new Date(importedAcc.createdAt)).toEqual(new Date(acc.createdAt));
    });

    testState.transactions.forEach((tx, index) => {
      const importedTx = importedState.transactions[index];
      expect(importedTx.id).toBe(tx.id);
      expect(importedTx.accountId).toBe(tx.accountId);
      expect(importedTx.amount).toBeCloseTo(tx.amount);
      expect(importedTx.date).toBe(tx.date);
      expect(importedTx.description).toBe(tx.description);
      expect(importedTx.categoryId).toBe(tx.categoryId);
      expect(new Date(importedTx.createdAt)).toEqual(new Date(tx.createdAt));
    });

    testState.categories.forEach((cat, index) => {
      const importedCat = importedState.categories[index];
      expect(importedCat.id).toBe(cat.id);
      expect(importedCat.name).toBe(cat.name);
    });

    testState.budgets.forEach((bud, index) => {
      const importedBud = importedState.budgets[index];
      expect(importedBud.id).toBe(bud.id);
      expect(importedBud.categoryId).toBe(bud.categoryId);
      expect(importedBud.limit).toBe(bud.limit);
      expect(importedBud.period).toBe(bud.period);
      expect(importedBud.startDate).toBe(bud.startDate);
    });

    testState.recurringRules.forEach((rule, index) => {
      const importedRule = importedState.recurringRules[index];
      expect(importedRule.id).toBe(rule.id);
      expect(importedRule.accountId).toBe(rule.accountId);
      expect(importedRule.amount).toBe(rule.amount);
      expect(importedRule.description).toBe(rule.description);
      expect(importedRule.categoryId).toBe(rule.categoryId);
      expect(importedRule.frequency).toBe(rule.frequency);
      expect(importedRule.startDate).toBe(rule.startDate);
      expect(importedRule.lastExpandedDate).toBe(rule.lastExpandedDate);
    });
  });

  test('handles invalid JSON gracefully', () => {
    const invalidJson = '{ invalid json }';
    const result = importFromJSON(invalidJson);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('handles corrupted state data gracefully', () => {
    const corruptedJson = '{ "accounts": ["not an object"] }';
    const result = importFromJSON(corruptedJson);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});