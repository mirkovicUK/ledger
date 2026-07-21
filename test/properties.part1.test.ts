import { computeBudgetSpending } from '../src/lib/budget.js';
import { periodStart, periodEnd, isWithinRange } from '../src/lib/date.js';
import { applyFilters } from '../src/lib/filter.js';
import { exportToJSON, importFromJSON } from '../src/lib/storage.js';
import { sortTransactions } from '../src/lib/sort.js';
import { expandRule } from '../src/lib/recurring.js';
import { ledgerReducer, INITIAL_STATE } from '../src/lib/ledgerReducer.js';
import { describe, test, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Property 3: Budget spending equals sum of matching transactions in period
// Validates: Requirements 4.4, 4.5
// ---------------------------------------------------------------------------

describe('Property 3: Budget spending equals sum of matching transactions in period', () => {
  // Fixed reference date used across all iterations
  const REF_DATE = '2024-06-15';
  const PERIODS = ['weekly', 'monthly', 'yearly'];
  const CATEGORIES = ['cat-food', 'cat-transport', 'cat-utilities'];

  /**
   * Deterministic pseudo-random number generator (mulberry32) seeded per
   * iteration, so failures are reproducible.
   */
  function makePrng(seed: number) {
    let s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Pick a random item from an array.
   */
  function pick(rng: () => number, arr: string[]) {
    return arr[Math.floor(rng() * arr.length)];
  }

  /**
   * Generate a YYYY-MM-DD string for a date that is `offsetDays` from
   * 2024-01-01 (±182 days around REF_DATE 2024-06-15, i.e. within 1 year).
   */
  function randomDateString(rng: () => number) {
    // 1-year window: 2024-01-01 to 2024-12-31 (366 days, 2024 is leap)
    const base = new Date('2024-01-01T00:00:00Z');
    const offsetDays = Math.floor(rng() * 366);
    const d = new Date(base.getTime() + offsetDays * 86400000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Generate between 0 and 20 random transactions.
   * Amounts are in [-500, 1000]; categoryId is from CATEGORIES ∪ {null}.
   */
  function generateTransactions(rng: () => number, count: number) {
    const txs = [];
    for (let i = 0; i < count; i++) {
      // Amount: rng() * 1500 − 500  →  [-500, 1000]
      const amount = rng() * 1500 - 500;
      // 1/4 chance of null category to exercise the zero-spend edge case
      const categoryId = rng() < 0.25 ? null : pick(rng, CATEGORIES);
      txs.push({
        id: `tx-${i}`,
        accountId: 'acc-1',
        amount,
        date: randomDateString(rng),
        description: `tx ${i}`,
        categoryId,
        createdAt: new Date().toISOString(),
      });
    }
    return txs;
  }

  /**
   * Manually compute expected spending: filter by categoryId AND date within
   * period, then sum amounts.
   */
  function manualSpending(budget: { categoryId: string | null; period: 'weekly' | 'monthly' | 'yearly' }, transactions: Array<{ categoryId: string | null; date: string; amount: number }>, refDate: string) {
    const start = periodStart(refDate, budget.period);
    const end = periodEnd(refDate, budget.period);
    return transactions
      .filter(
        t =>
          t.categoryId === budget.categoryId &&
          isWithinRange(t.date, start, end),
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  test('computeBudgetSpending matches manual filter+sum for 100 random inputs', () => {
    const ITERATIONS = 100;

    for (let i = 0; i < ITERATIONS; i++) {
      const rng = makePrng(i * 7919 + 1); // deterministic seed per iteration

      const period = pick(rng, PERIODS);
      const categoryId = pick(rng, CATEGORIES);

      const budget = {
        id: `budget-${i}`,
        categoryId,
        limit: 500,
        period,
        startDate: REF_DATE,
      };

      // 0–20 transactions
      const txCount = Math.floor(rng() * 21);
      const transactions = generateTransactions(rng, txCount);

      const actual = computeBudgetSpending(budget, transactions, REF_DATE);
      const expected = manualSpending(budget, transactions, REF_DATE);

      expect(actual).toBeCloseTo(expected, 8);
    }
  });

  test('computeBudgetSpending returns 0 when no transactions match budget category', () => {
    // Requirement 4.5: zero spending when no matching transactions
    const ITERATIONS = 100;

    for (let i = 0; i < ITERATIONS; i++) {
      const rng = makePrng(i * 3571 + 42);

      const period = pick(rng, PERIODS);
      // Budget uses a category that never appears in transactions
      const budget = {
        id: `budget-zero-${i}`,
        categoryId: 'cat-nonexistent',
        limit: 200,
        period,
        startDate: REF_DATE,
      };

      const txCount = Math.floor(rng() * 21);
      const transactions = generateTransactions(rng, txCount);

      const actual = computeBudgetSpending(budget, transactions, REF_DATE);
      expect(actual).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Helpers for Property 2
// ---------------------------------------------------------------------------

function p2RandInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function p2RandItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Property 2: Cascade delete removes account and all associated transactions
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------


export {}; // Prevent accidental hoisting issues