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

describe('Property 6: Recurring rule expansion is idempotent', () => {
  /**
   * Calling expandRule twice with the same referenceDate produces no additional
   * transactions on the second call, because the updatedRule returned by the
   * first call carries an updated lastExpandedDate that marks the period as
   * already covered.
   *
   * **Validates: Requirements 5.3**
   */

  const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

  function p6Pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  /**
   * Simple counter-based id generator.  Each call returns a unique string so
   * that duplicate detection never fires due to identical ids.
   */
  function makeIdGen(): () => string {
    let counter = 0;
    return () => `gen-id-${++counter}`;
  }

  /**
   * Return a YYYY-MM-DD string for a random day in 2023–2024.
   * offsetDays is in [0, 730) covering roughly two years.
   */
  function randomStartDate(rng: () => number): string {
    const base = new Date('2023-01-01T00:00:00Z');
    const offsetDays = Math.floor(rng() * 730);
    const d = new Date(base.getTime() + offsetDays * 86400000);
    return `${d.getUTCFullYear()}-${p6Pad(d.getUTCMonth() + 1)}-${p6Pad(d.getUTCDate())}`;
  }

  /**
   * Return a YYYY-MM-DD string for a random day in 2024 (366 days).
   */
  function randomRefDate(rng: () => number): string {
    const base = new Date('2024-01-01T00:00:00Z');
    const offsetDays = Math.floor(rng() * 366);
    const d = new Date(base.getTime() + offsetDays * 86400000);
    return `${d.getUTCFullYear()}-${p6Pad(d.getUTCMonth() + 1)}-${p6Pad(d.getUTCDate())}`;
  }

  /**
   * Deterministic pseudo-random number generator (mulberry32).
   */
  function makePrng(seed: number): () => number {
    let s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  test('second expandRule call with same referenceDate produces 0 transactions across 100 random rules', () => {
    const ITERATIONS = 100;

    for (let i = 0; i < ITERATIONS; i++) {
      const rng = makePrng(i * 6271 + 13);

      // Random frequency
      const frequency = FREQUENCIES[Math.floor(rng() * FREQUENCIES.length)];

      // Random start date in 2023–2024
      const startDate = randomStartDate(rng);

      // Random reference date in 2024
      const refDate = randomRefDate(rng);

      const rule = {
        id: `rule-p6-${i}`,
        accountId: 'acc-p6',
        amount: parseFloat((rng() * 200 - 50).toFixed(2)),
        description: `Recurring ${frequency}`,
        frequency,
        startDate,
        lastExpandedDate: null,
        categoryId: null,
      };

      // Use a shared id generator so ids are always unique across both calls
      const idGen = makeIdGen();

      // First expansion
      const { updatedRule } = expandRule(rule, refDate, idGen);

      // Second expansion using the updatedRule from the first call
      const { transactions: second } = expandRule(updatedRule, refDate, idGen);

      expect(second.length).toBe(0);
    }
  });
});