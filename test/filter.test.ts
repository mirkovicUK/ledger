import { describe, it, expect } from 'vitest';
import { applyFilters } from '../src/lib/filter.js';

// Sample transaction fixture
const transactions = [
  { id: '1', accountId: 'acct-a', categoryId: 'cat-food', date: '2024-01-10', amount: 50 },
  { id: '2', accountId: 'acct-a', categoryId: 'cat-rent', date: '2024-01-15', amount: 1200 },
  { id: '3', accountId: 'acct-b', categoryId: 'cat-food', date: '2024-02-05', amount: 30 },
  { id: '4', accountId: 'acct-b', categoryId: null, date: '2024-02-20', amount: -100 },
  { id: '5', accountId: 'acct-a', categoryId: undefined, date: '2024-03-01', amount: 200 },
];

describe('applyFilters — null / empty criteria', () => {
  it('returns all transactions when criteria is null', () => {
    expect(applyFilters(transactions, null)).toEqual(transactions);
  });

  it('returns all transactions when all criteria fields are undefined', () => {
    expect(applyFilters(transactions, {})).toEqual(transactions);
  });

  it('returns all transactions when all criteria fields are explicitly null', () => {
    expect(applyFilters(transactions, {
      accountId: null,
      categoryId: null,
      dateRange: null,
      amountRange: null,
    })).toEqual(transactions);
  });
});

describe('applyFilters — accountId filter', () => {
  it('filters to transactions for a specific account', () => {
    const result = applyFilters(transactions, { accountId: 'acct-a' });
    expect(result).toHaveLength(3);
    result.forEach((t) => expect(t.accountId).toBe('acct-a'));
  });

  it('filters to transactions for a different account', () => {
    const result = applyFilters(transactions, { accountId: 'acct-b' });
    expect(result).toHaveLength(2);
    result.forEach((t) => expect(t.accountId).toBe('acct-b'));
  });

  it('returns empty array when no transactions match the account', () => {
    expect(applyFilters(transactions, { accountId: 'acct-z' })).toHaveLength(0);
  });
});

describe('applyFilters — categoryId filter', () => {
  it('filters to transactions with a specific category', () => {
    const result = applyFilters(transactions, { categoryId: 'cat-food' });
    expect(result).toHaveLength(2);
    result.forEach((t) => expect(t.categoryId).toBe('cat-food'));
  });

  it('filters to the "uncategorized" virtual category for null/undefined categoryId', () => {
    const result = applyFilters(transactions, { categoryId: 'uncategorized' });
    expect(result).toHaveLength(2);
    result.forEach((t) => expect(t.categoryId == null).toBe(true));
  });

  it('returns empty array when no transactions match the category', () => {
    expect(applyFilters(transactions, { categoryId: 'cat-nonexistent' })).toHaveLength(0);
  });
});

describe('applyFilters — dateRange filter', () => {
  it('filters transactions within an inclusive date range', () => {
    const result = applyFilters(transactions, { dateRange: { from: '2024-01-10', to: '2024-01-31' } });
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(['1', '2']);
  });

  it('includes transactions exactly on the from boundary', () => {
    const result = applyFilters(transactions, { dateRange: { from: '2024-01-10', to: '2024-01-10' } });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('includes transactions exactly on the to boundary', () => {
    const result = applyFilters(transactions, { dateRange: { from: '2024-03-01', to: '2024-03-01' } });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('5');
  });

  it('returns empty array when no transactions fall in the date range', () => {
    expect(applyFilters(transactions, { dateRange: { from: '2023-01-01', to: '2023-12-31' } })).toHaveLength(0);
  });
});

describe('applyFilters — amountRange filter', () => {
  it('filters transactions within an inclusive amount range', () => {
    const result = applyFilters(transactions, { amountRange: { min: 30, max: 200 } });
    expect(result).toHaveLength(3);
    result.forEach((t) => {
      expect(t.amount).toBeGreaterThanOrEqual(30);
      expect(t.amount).toBeLessThanOrEqual(200);
    });
  });

  it('includes transactions exactly on the min boundary', () => {
    const result = applyFilters(transactions, { amountRange: { min: 1200, max: 1200 } });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('filters to negative amounts', () => {
    const result = applyFilters(transactions, { amountRange: { min: -200, max: 0 } });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  it('returns empty array when no transactions fall in the amount range', () => {
    expect(applyFilters(transactions, { amountRange: { min: 9000, max: 9999 } })).toHaveLength(0);
  });
});

describe('applyFilters — combined AND logic', () => {
  it('accountId + categoryId narrows result', () => {
    const result = applyFilters(transactions, { accountId: 'acct-a', categoryId: 'cat-food' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('accountId + dateRange narrows result', () => {
    const result = applyFilters(transactions, {
      accountId: 'acct-a',
      dateRange: { from: '2024-01-01', to: '2024-01-31' },
    });
    expect(result).toHaveLength(2);
    result.forEach((t) => expect(t.accountId).toBe('acct-a'));
  });

  it('categoryId + amountRange narrows result', () => {
    const result = applyFilters(transactions, {
      categoryId: 'cat-food',
      amountRange: { min: 40, max: 100 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('all four criteria combined', () => {
    const result = applyFilters(transactions, {
      accountId: 'acct-a',
      categoryId: 'cat-food',
      dateRange: { from: '2024-01-01', to: '2024-01-31' },
      amountRange: { min: 0, max: 100 },
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('conflicting criteria produce an empty result', () => {
    // acct-a has no transactions on 2024-02-05
    const result = applyFilters(transactions, {
      accountId: 'acct-a',
      dateRange: { from: '2024-02-05', to: '2024-02-05' },
    });
    expect(result).toHaveLength(0);
  });
});

describe('applyFilters — empty transaction list', () => {
  it('returns empty array when given an empty array regardless of criteria', () => {
    expect(applyFilters([], { accountId: 'acct-a' })).toEqual([]);
    expect(applyFilters([], { categoryId: 'cat-food' })).toEqual([]);
    expect(applyFilters([], { dateRange: { from: '2024-01-01', to: '2024-12-31' } })).toEqual([]);
    expect(applyFilters([], { amountRange: { min: 0, max: 999 } })).toEqual([]);
    expect(applyFilters([], null)).toEqual([]);
  });
});