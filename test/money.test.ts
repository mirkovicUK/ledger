import { describe, it, expect } from 'vitest';
import { sumAmounts, accountBalance, totalBalance, budgetRatio } from '../src/lib/money.js';

describe('sumAmounts', () => {
  it('returns 0 for an empty array', () => {
    expect(sumAmounts([])).toBe(0);
  });

  it('returns 0 for null/undefined input', () => {
    expect(sumAmounts(null)).toBe(0);
    expect(sumAmounts(undefined)).toBe(0);
  });

  it('returns the amount of a single transaction', () => {
    expect(sumAmounts([{ amount: 42.5 }])).toBe(42.5);
  });

  it('sums multiple transaction amounts', () => {
    const transactions = [
      { amount: 10 },
      { amount: 20.5 },
      { amount: -5 },
    ];
    expect(sumAmounts(transactions)).toBeCloseTo(25.5);
  });

  it('handles zero amounts', () => {
    const transactions = [{ amount: 0 }, { amount: 0 }];
    expect(sumAmounts(transactions)).toBe(0);
  });

  it('handles negative amounts', () => {
    const transactions = [{ amount: -100 }, { amount: -50 }];
    expect(sumAmounts(transactions)).toBe(-150);
  });
});

describe('accountBalance', () => {
  const transactions = [
    { id: '1', accountId: 'acct-a', amount: 100 },
    { id: '2', accountId: 'acct-b', amount: 200 },
    { id: '3', accountId: 'acct-a', amount: -30 },
    { id: '4', accountId: 'acct-b', amount: 50 },
  ];

  it('returns 0 for an empty array', () => {
    expect(accountBalance([], 'acct-a')).toBe(0);
  });

  it('returns 0 when no transactions match the accountId', () => {
    expect(accountBalance(transactions, 'acct-z')).toBe(0);
  });

  it('sums only transactions belonging to the specified account', () => {
    expect(accountBalance(transactions, 'acct-a')).toBe(70);
    expect(accountBalance(transactions, 'acct-b')).toBe(250);
  });

  it('handles a single matching transaction', () => {
    expect(accountBalance([{ accountId: 'x', amount: 99 }], 'x')).toBe(99);
  });
});

describe('totalBalance', () => {
  it('returns 0 for an empty array', () => {
    expect(totalBalance([])).toBe(0);
  });

  it('sums all transactions regardless of account', () => {
    const transactions = [
      { accountId: 'a', amount: 100 },
      { accountId: 'b', amount: 200 },
      { accountId: 'a', amount: -50 },
    ];
    expect(totalBalance(transactions)).toBe(250);
  });

  it('handles a single transaction', () => {
    expect(totalBalance([{ amount: 77 }])).toBe(77);
  });
});

describe('budgetRatio', () => {
  it('returns 0 when limit is 0', () => {
    expect(budgetRatio(100, 0)).toBe(0);
    expect(budgetRatio(0, 0)).toBe(0);
  });

  it('returns correct ratio when limit > 0', () => {
    expect(budgetRatio(50, 100)).toBe(0.5);
    expect(budgetRatio(100, 100)).toBe(1);
    expect(budgetRatio(0, 100)).toBe(0);
  });

  it('returns > 1 when overspent', () => {
    expect(budgetRatio(150, 100)).toBe(1.5);
  });

  it('handles decimal amounts', () => {
    expect(budgetRatio(1, 3)).toBeCloseTo(0.3333);
  });
});