import { describe, test, expect } from 'vitest';
import { sortTransactions } from '../src/lib/sort.js';

// Sample transaction fixtures
const transactions = [
  { id: '1', date: '2024-03-15', amount: 200,  description: 'Groceries' },
  { id: '2', date: '2024-01-05', amount: -50,  description: 'Amazon' },
  { id: '3', date: '2024-02-20', amount: 1200, description: 'Rent' },
  { id: '4', date: '2024-01-05', amount: 75,   description: 'Coffee' },
  { id: '5', date: '2024-04-01', amount: -300,  description: 'Utilities' },
];

// ─── Immutability ────────────────────────────────────────────────────────────

describe('sortTransactions — immutability', () => {
  test('does not mutate the input array', () => {
    const input = [...transactions];
    const snapshot = input.map((t) => ({ ...t }));
    sortTransactions(input, { field: 'date', direction: 'asc' });
    expect(input).toEqual(snapshot);
  });

  test('returns a new array reference', () => {
    const input = [...transactions];
    const result = sortTransactions(input, { field: 'amount', direction: 'asc' });
    expect(result).not.toBe(input);
  });
});

// ─── Sort by date ─────────────────────────────────────────────────────────────

describe('sortTransactions — by date ascending', () => {
  test('orders transactions from earliest to latest', () => {
    const result = sortTransactions(transactions, { field: 'date', direction: 'asc' });
    const dates = result.map((t) => t.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] >= dates[i - 1]).toBe(true);
    }
  });

  test('first item is the earliest date', () => {
    const result = sortTransactions(transactions, { field: 'date', direction: 'asc' });
    expect(result[0].date).toBe('2024-01-05');
  });

  test('last item is the latest date', () => {
    const result = sortTransactions(transactions, { field: 'date', direction: 'asc' });
    expect(result[result.length - 1].date).toBe('2024-04-01');
  });
});

describe('sortTransactions — by date descending', () => {
  test('orders transactions from latest to earliest', () => {
    const result = sortTransactions(transactions, { field: 'date', direction: 'desc' });
    const dates = result.map((t) => t.date);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] <= dates[i - 1]).toBe(true);
    }
  });

  test('first item is the latest date', () => {
    const result = sortTransactions(transactions, { field: 'date', direction: 'desc' });
    expect(result[0].date).toBe('2024-04-01');
  });

  test('last item is the earliest date', () => {
    const result = sortTransactions(transactions, { field: 'date', direction: 'desc' });
    expect(result[result.length - 1].date).toBe('2024-01-05');
  });
});

// ─── Sort by amount ───────────────────────────────────────────────────────────

describe('sortTransactions — by amount ascending', () => {
  test('orders transactions from lowest to highest amount', () => {
    const result = sortTransactions(transactions, { field: 'amount', direction: 'asc' });
    const amounts = result.map((t) => t.amount);
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeGreaterThanOrEqual(amounts[i - 1]);
    }
  });

  test('first item has the smallest amount (most negative)', () => {
    const result = sortTransactions(transactions, { field: 'amount', direction: 'asc' });
    expect(result[0].amount).toBe(-300);
  });

  test('last item has the largest amount', () => {
    const result = sortTransactions(transactions, { field: 'amount', direction: 'asc' });
    expect(result[result.length - 1].amount).toBe(1200);
  });
});

describe('sortTransactions — by amount descending', () => {
  test('orders transactions from highest to lowest amount', () => {
    const result = sortTransactions(transactions, { field: 'amount', direction: 'desc' });
    const amounts = result.map((t) => t.amount);
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeLessThanOrEqual(amounts[i - 1]);
    }
  });

  test('first item has the largest amount', () => {
    const result = sortTransactions(transactions, { field: 'amount', direction: 'desc' });
    expect(result[0].amount).toBe(1200);
  });

  test('last item has the smallest amount (most negative)', () => {
    const result = sortTransactions(transactions, { field: 'amount', direction: 'desc' });
    expect(result[result.length - 1].amount).toBe(-300);
  });
});

// ─── Sort by description ──────────────────────────────────────────────────────

describe('sortTransactions — by description ascending', () => {
  test('orders transactions alphabetically A → Z', () => {
    const result = sortTransactions(transactions, { field: 'description', direction: 'asc' });
    const descs = result.map((t) => t.description);
    for (let i = 1; i < descs.length; i++) {
      expect(descs[i] >= descs[i - 1]).toBe(true);
    }
  });

  test('first item is alphabetically earliest', () => {
    const result = sortTransactions(transactions, { field: 'description', direction: 'asc' });
    expect(result[0].description).toBe('Amazon');
  });

  test('last item is alphabetically latest', () => {
    const result = sortTransactions(transactions, { field: 'description', direction: 'asc' });
    expect(result[result.length - 1].description).toBe('Utilities');
  });
});

describe('sortTransactions — by description descending', () => {
  test('orders transactions alphabetically Z → A', () => {
    const result = sortTransactions(transactions, { field: 'description', direction: 'desc' });
    const descs = result.map((t) => t.description);
    for (let i = 1; i < descs.length; i++) {
      expect(descs[i] <= descs[i - 1]).toBe(true);
    }
  });

  test('first item is alphabetically latest', () => {
    const result = sortTransactions(transactions, { field: 'description', direction: 'desc' });
    expect(result[0].description).toBe('Utilities');
  });

  test('last item is alphabetically earliest', () => {
    const result = sortTransactions(transactions, { field: 'description', direction: 'desc' });
    expect(result[result.length - 1].description).toBe('Amazon');
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('sortTransactions — edge cases', () => {
  test('returns an empty array when given an empty array', () => {
    expect(sortTransactions([], { field: 'date', direction: 'asc' })).toEqual([]);
  });

  test('returns a single-element array unchanged (by date)', () => {
    const single = [transactions[0]];
    const result = sortTransactions(single, { field: 'date', direction: 'asc' });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(transactions[0]);
  });

  test('handles missing description field gracefully (treated as empty string)', () => {
    const withMissing: Array<{ id: string; date: string; amount: number; description: string }> = [
      { id: 'a', date: '2024-01-01', amount: 10, description: 'Zebra' },
      { id: 'b', date: '2024-01-02', amount: 20, description: '' },
    ];
    const result = sortTransactions(withMissing, { field: 'description', direction: 'asc' });
    // empty string ('') sorts before 'Zebra'
    expect(result[0].id).toBe('b');
    expect(result[1].id).toBe('a');
  });

  test('stable result length matches input length', () => {
    const result = sortTransactions(transactions, { field: 'amount', direction: 'desc' });
    expect(result).toHaveLength(transactions.length);
  });

  test('all original ids are present in the sorted result', () => {
    const result = sortTransactions(transactions, { field: 'date', direction: 'asc' });
    const originalIds = transactions.map((t) => t.id).sort();
    const resultIds = result.map((t) => t.id).sort();
    expect(resultIds).toEqual(originalIds);
  });
});