import { describe, test, expect } from 'vitest';
import { expandRule } from '../src/lib/recurring.js';
import type { RecurringRule } from '../src/lib/types.js';

// ---------------------------------------------------------------------------
// Property 6: Recurring rule expansion is idempotent
// Validates: Requirements 5.3
// ---------------------------------------------------------------------------

describe('Property 6: Recurring rule expansion is idempotent', () => {
  const FREQUENCIES: RecurringRule['frequency'][] = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

  function p6Pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  function makeIdGen(): () => string {
    let counter = 0;
    return () => `gen-id-${++counter}`;
  }

  function randomStartDate(rng: () => number): string {
    const base = new Date('2023-01-01T00:00:00Z');
    const offsetDays = Math.floor(rng() * 730);
    const d = new Date(base.getTime() + offsetDays * 86400000);
    return `${d.getUTCFullYear()}-${p6Pad(d.getUTCMonth() + 1)}-${p6Pad(d.getUTCDate())}`;
  }

  function randomRefDate(rng: () => number): string {
    const base = new Date('2024-01-01T00:00:00Z');
    const offsetDays = Math.floor(rng() * 366);
    const d = new Date(base.getTime() + offsetDays * 86400000);
    return `${d.getUTCFullYear()}-${p6Pad(d.getUTCMonth() + 1)}-${p6Pad(d.getUTCDate())}`;
  }

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

      const frequency = FREQUENCIES[Math.floor(rng() * FREQUENCIES.length)];
      const startDate = randomStartDate(rng);
      const refDate = randomRefDate(rng);

      const rule: RecurringRule = {
        id: `rule-p6-${i}`,
        accountId: 'acc-p6',
        amount: parseFloat((rng() * 200 - 50).toFixed(2)),
        description: `Recurring ${frequency}`,
        frequency,
        startDate,
        lastExpandedDate: null,
        categoryId: null,
      };

      const idGen = makeIdGen();

      const { updatedRule } = expandRule(rule, refDate, idGen);
      const { transactions: second } = expandRule(updatedRule, refDate, idGen);

      expect(second.length).toBe(0);
    }
  });
});