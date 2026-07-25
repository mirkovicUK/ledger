import { describe, test, expect } from 'vitest';
import { computeBudgetSpending } from '../src/lib/budget.js';
import { periodStart, periodEnd, isWithinRange } from '../src/lib/date.js';
import { applyFilters } from '../src/lib/filter.js';
import { exportToJSON, importFromJSON } from '../src/lib/storage.js';
import { sortTransactions } from '../src/lib/sort.js';
import { expandRule } from '../src/lib/recurring.js';
import type { SortConfig } from '../src/lib/sort.js';
import type { AppState } from '../src/lib/types.js';

// ---------------------------------------------------------------------------
// Property 9: Sort results are correctly ordered
// Validates: Requirements 6.2
// ---------------------------------------------------------------------------

describe('Property 9: Sort results are correctly ordered', () => {
  const FIELDS: Array<'date' | 'amount' | 'description'> = ['date', 'amount', 'description'];
  const DIRECTIONS: Array<'asc' | 'desc'> = ['asc', 'desc'];

  function p9RandInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function p9RandFloat(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  function p9Pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  function p9RandomDate2024(): string {
    const month = p9RandInt(1, 12);
    const day = p9RandInt(1, 28);
    return `2024-${p9Pad(month)}-${p9Pad(day)}`;
  }

  function p9RandomDescription(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const len = p9RandInt(4, 12);
    let s = '';
    for (let i = 0; i < len; i++) {
      s += chars[p9RandInt(0, chars.length - 1)];
    }
    return s;
  }

  function p9GenerateTransactions() {
    const count = p9RandInt(2, 15);
    return Array.from({ length: count }, (_, i) => ({
      id: `tx-p9-${i}`,
      accountId: 'acc-1',
      amount: p9RandFloat(-500, 1000),
      date: p9RandomDate2024(),
      description: p9RandomDescription(),
      categoryId: null as string | null,
      createdAt: new Date().toISOString(),
    }));
  }

  function compareValues(
    a: { amount: number; date: string; description: string },
    b: { amount: number; date: string; description: string },
    field: 'date' | 'amount' | 'description'
  ): number {
    if (field === 'amount') {
      return a.amount - b.amount;
    }
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

      const config: SortConfig = { field, direction };
      const result = sortTransactions(transactions, config);

      for (let i = 0; i < result.length - 1; i++) {
        const cmp = compareValues(result[i], result[i + 1], field);

        if (direction === 'asc') {
          expect(cmp).toBeLessThanOrEqual(0);
        } else {
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

      const config: SortConfig = { field, direction };
      sortTransactions(transactions, config);

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
  function p10RandInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function p10RandFloat(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  function p10Pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  function p10RandomDate2024(): string {
    const month = p10RandInt(1, 12);
    const day = p10RandInt(1, 28);
    return `2024-${p10Pad(month)}-${p10Pad(day)}`;
  }

  function p10RandomString(len: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let s = '';
    for (let i = 0; i < len; i++) {
      s += chars[p10RandInt(0, chars.length - 1)];
    }
    return s;
  }

  function p10GenerateState(): AppState {
    const accountCount = p10RandInt(1, 3);
    const accountTypes: Array<'checking' | 'savings' | 'credit' | 'cash' | 'investment'> = [
      'checking', 'savings', 'credit', 'cash', 'investment'
    ];
    const accounts = Array.from({ length: accountCount }, (_, i) => ({
      id: `acc-${i}`,
      name: `Account ${i}`,
      type: accountTypes[p10RandInt(0, accountTypes.length - 1)],
      createdAt: new Date().toISOString(),
    }));

    const categoryCount = p10RandInt(1, 3);
    const categories = Array.from({ length: categoryCount }, (_, i) => ({
      id: `cat-${i}`,
      name: `Category ${i}`,
    }));

    const txCount = p10RandInt(2, 8);
    const transactions = Array.from({ length: txCount }, (_, i) => ({
      id: `tx-${i}`,
      accountId: accounts[p10RandInt(0, accounts.length - 1)].id,
      amount: p10RandFloat(-500, 1000),
      date: p10RandomDate2024(),
      description: p10RandomString(8),
      categoryId: Math.random() > 0.5 ? categories[p10RandInt(0, categories.length - 1)].id : null,
      createdAt: new Date().toISOString(),
    }));

    const periods: Array<'weekly' | 'monthly' | 'yearly'> = ['weekly', 'monthly', 'yearly'];
    const budgetCount = p10RandInt(1, 2);
    const budgets = Array.from({ length: budgetCount }, (_, i) => ({
      id: `bud-${i}`,
      categoryId: categories[p10RandInt(0, categories.length - 1)].id,
      limit: p10RandFloat(100, 1000),
      period: periods[p10RandInt(0, periods.length - 1)],
      startDate: p10RandomDate2024(),
    }));

    const frequencies: Array<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'> = [
      'daily', 'weekly', 'biweekly', 'monthly', 'yearly'
    ];
    const ruleCount = p10RandInt(0, 2);
    const recurringRules = Array.from({ length: ruleCount }, (_, i) => ({
      id: `rule-${i}`,
      accountId: accounts[p10RandInt(0, accounts.length - 1)].id,
      amount: p10RandFloat(-200, 500),
      description: p10RandomString(6),
      categoryId: Math.random() > 0.5 ? categories[p10RandInt(0, categories.length - 1)].id : null,
      frequency: frequencies[p10RandInt(0, frequencies.length - 1)],
      startDate: p10RandomDate2024(),
      lastExpandedDate: null as string | null,
    }));

    return { accounts, transactions, categories, budgets, recurringRules };
  }

  test('roundtrip preserves all data across 50 random states', () => {
    const ITERATIONS = 50;

    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      const state = p10GenerateState();
      const json = exportToJSON(state);
      const result = importFromJSON(json);

      expect(result.success).toBe(true);
      if (!result.success) continue;

      const imported = result.data;

      expect(imported.accounts).toHaveLength(state.accounts.length);
      expect(imported.transactions).toHaveLength(state.transactions.length);
      expect(imported.categories).toHaveLength(state.categories.length);
      expect(imported.budgets).toHaveLength(state.budgets.length);
      expect(imported.recurringRules).toHaveLength(state.recurringRules.length);

      for (let i = 0; i < state.accounts.length; i++) {
        expect(imported.accounts[i].id).toBe(state.accounts[i].id);
        expect(imported.accounts[i].name).toBe(state.accounts[i].name);
        expect(imported.accounts[i].type).toBe(state.accounts[i].type);
      }

      for (let i = 0; i < state.transactions.length; i++) {
        expect(imported.transactions[i].id).toBe(state.transactions[i].id);
        expect(imported.transactions[i].amount).toBe(state.transactions[i].amount);
        expect(imported.transactions[i].date).toBe(state.transactions[i].date);
        expect(imported.transactions[i].description).toBe(state.transactions[i].description);
        expect(imported.transactions[i].categoryId).toBe(state.transactions[i].categoryId);
      }

      for (let i = 0; i < state.budgets.length; i++) {
        expect(imported.budgets[i].id).toBe(state.budgets[i].id);
        expect(imported.budgets[i].limit).toBe(state.budgets[i].limit);
        expect(imported.budgets[i].period).toBe(state.budgets[i].period);
      }
    }
  });

  test('importFromJSON returns error for invalid JSON', () => {
    const result = importFromJSON('not valid json {{{');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  test('importFromJSON returns error for valid JSON but invalid schema', () => {
    const badPayload = JSON.stringify({ version: 1, exportedAt: 'bad', data: { accounts: 'wrong' } });
    const result = importFromJSON(badPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});