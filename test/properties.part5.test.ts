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

describe('Property 10: Export/import roundtrip preserves all data', () => {
  /**
   * For any valid AppState, exportToJSON followed by importFromJSON must
   * return { success: true, data } where data deeply equals the original state.
   *
   * **Validates: Requirements 8.6**
   */

  const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'cash', 'investment'];
  const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];
  const PERIODS = ['weekly', 'monthly', 'yearly'];

  /** Deterministic pseudo-random number generator (mulberry32). */
  function makePrng(seed: number) {
    let s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick<T>(rng: () => number, arr: T[]) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function randInt(rng: () => number, min: number, max: number) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function pad(n: number) {
    return String(n).padStart(2, '0');
  }

  /** Generate a YYYY-MM-DD string within 2020-2024. */
  function randomDate(rng: () => number) {
    const year = 2020 + randInt(rng, 0, 4);
    const month = randInt(rng, 1, 12);
    const day = randInt(rng, 1, 28);
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  /** Generate a valid ISO datetime string. */
  function randomDatetime(rng: () => number) {
    return `${randomDate(rng)}T${pad(randInt(rng, 0, 23))}:${pad(randInt(rng, 0, 59))}:${pad(randInt(rng, 0, 59))}.000Z`;
  }

  /** Generate a finite non-NaN amount in [-9999, 9999], 2 decimal places. */
  function randomAmount(rng: () => number) {
    return Math.round((rng() * 19998 - 9999) * 100) / 100;
  }

  /** Generate a random alphanumeric string of given length. */
  function randomString(rng: () => number, len: number, prefix: string = '') {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = prefix;
    for (let i = 0; i < len; i++) {
      s += chars[Math.floor(rng() * chars.length)];
    }
    return s;
  }

  /**
   * Build a valid AppState with:
   *  - 1–3 accounts
   *  - 0–5 transactions (with valid accountIds)
   *  - 0–3 categories
   *  - 0–2 budgets (referencing generated categories)
   *  - 0–2 recurring rules (referencing generated accounts)
   */
  function generateAppState(rng: () => number, iteration: number) {
    // --- accounts ---
    const accountCount = randInt(rng, 1, 3);
    const accounts = [];
    for (let i = 0; i < accountCount; i++) {
      accounts.push({
        id: `acc-p10-${iteration}-${i}`,
        name: `Account ${randomString(rng, 4)}`,
        type: pick(rng, ACCOUNT_TYPES),
        createdAt: randomDatetime(rng),
      });
    }

    // --- categories ---
    const categoryCount = randInt(rng, 0, 3);
    const categories = [];
    for (let i = 0; i < categoryCount; i++) {
      categories.push({
        id: `cat-p10-${iteration}-${i}`,
        name: `Cat ${randomString(rng, 4)}`,
      });
    }

    // --- transactions ---
    const txCount = randInt(rng, 0, 5);
    const transactions = [];
    for (let i = 0; i < txCount; i++) {
      const account = pick(rng, accounts);
      const categoryId =
        categories.length > 0 && rng() < 0.6
          ? pick(rng, categories).id
          : null;
      transactions.push({
        id: `tx-p10-${iteration}-${i}`,
        accountId: account.id,
        amount: randomAmount(rng),
        date: randomDate(rng),
        description: `Desc ${randomString(rng, 6)}`,
        categoryId,
        recurringRuleId: null,
        createdAt: randomDatetime(rng),
      });
    }

    // --- budgets ---
    const budgetCount = randInt(rng, 0, 2);
    const budgets = [];
    for (let i = 0; i < budgetCount; i++) {
      // budgets need a valid (positive finite) limit and a categoryId
      const categoryId =
        categories.length > 0
          ? pick(rng, categories).id
          : `cat-p10-fallback-${i}`;
      budgets.push({
        id: `bgt-p10-${iteration}-${i}`,
        categoryId,
        limit: Math.round(rng() * 99900 + 100) / 100, // 1.00–1000.00
        period: pick(rng, PERIODS),
        startDate: randomDate(rng),
      });
    }

    // --- recurring rules ---
    const ruleCount = randInt(rng, 0, 2);
    const recurringRules = [];
    for (let i = 0; i < ruleCount; i++) {
      const account = pick(rng, accounts);
      const categoryId =
        categories.length > 0 && rng() < 0.5
          ? pick(rng, categories).id
          : null;
      recurringRules.push({
        id: `rule-p10-${iteration}-${i}`,
        accountId: account.id,
        amount: randomAmount(rng),
        description: `Rule ${randomString(rng, 5)}`,
        categoryId,
        frequency: pick(rng, FREQUENCIES),
        startDate: randomDate(rng),
        lastExpandedDate: rng() < 0.5 ? randomDate(rng) : null,
      });
    }

    return { accounts, transactions, categories, budgets, recurringRules };
  }

  test('importFromJSON(exportToJSON(state)) returns success:true and deeply equals original state for 100 random states', () => {
    const ITERATIONS = 100;

    for (let i = 0; i < ITERATIONS; i++) {
      const rng = makePrng(i * 6271 + 31);
      const state = generateAppState(rng, i);

      const json = exportToJSON(state);
      const result = importFromJSON(json);

      // Must succeed
      expect(result.success).toBe(true);

      // Roundtripped data must deeply equal the original state
      expect(result.data).toEqual(state);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 12: Referential integrity for account references
// Validates: Requirements 10.5
// ---------------------------------------------------------------------------


```