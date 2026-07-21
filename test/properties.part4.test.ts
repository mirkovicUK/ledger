import { describe, test, expect } from 'vitest';
import { sortTransactions } from '../src/lib/sort.js';
import type { SortConfig } from '../src/lib/sort.js';

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

  interface TestTransaction {
    id: string;
    accountId: string;
    amount: number;
    date: string;
    description: string;
    categoryId: null;
    createdAt: string;
  }

  function p9GenerateTransactions(): TestTransaction[] {
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

  function compareValues(a: TestTransaction, b: TestTransaction, field: 'date' | 'amount' | 'description'): number {
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
        const cmp = compareValues(result[i] as TestTransaction, result[i + 1] as TestTransaction, field);

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