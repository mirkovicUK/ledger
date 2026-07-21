import { describe, test, expect } from 'vitest';
import { expandRule, expandAllRules } from '../src/lib/recurring.js';

// Simple deterministic ID generator for tests
let idCounter = 0;
function makeIdGen() {
  idCounter = 0;
  return () => `tx-${++idCounter}`;
}

// Baseline rule factory
function makeRule(overrides = {}) {
  return {
    id: 'rule-1',
    accountId: 'acct-1',
    amount: 50,
    description: 'Test charge',
    categoryId: null,
    frequency: 'monthly',
    startDate: '2024-01-01',
    lastExpandedDate: null,
    ...overrides,
  };
}

// ─── expandRule – correct dates per frequency ──────────────────────────────

describe('expandRule – transaction fields', () => {
  test('each transaction carries the correct fields from the rule', () => {
    const rule = makeRule({
      frequency: 'monthly',
      startDate: '2024-01-01',
      amount: 99.99,
      description: 'Rent',
      accountId: 'acct-rent',
      categoryId: 'cat-housing',
    });
    const { transactions } = expandRule(rule, '2024-01-01', makeIdGen());
    const [tx] = transactions;
    expect(tx.accountId).toBe('acct-rent');
    expect(tx.amount).toBe(99.99);
    expect(tx.description).toBe('Rent');
    expect(tx.categoryId).toBe('cat-housing');
    expect(tx.recurringRuleId).toBe('rule-1');
    expect(tx.id).toBeDefined();
    expect(tx.createdAt).toBeDefined();
  });

  test('each transaction gets a unique id from the generator', () => {
    const rule = makeRule({ frequency: 'daily', startDate: '2024-01-01' });
    const { transactions } = expandRule(rule, '2024-01-03', makeIdGen());
    const ids = transactions.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('categoryId defaults to null when not set on rule', () => {
    const rule = makeRule({ categoryId: undefined, frequency: 'monthly', startDate: '2024-01-01' });
    const { transactions } = expandRule(rule, '2024-01-01', makeIdGen());
    expect(transactions[0].categoryId).toBeNull();
  });
});

// ─── expandRule – no transactions when startDate > referenceDate ────────────