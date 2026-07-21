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

describe('expandRule – expansion from lastExpandedDate', () => {
  test('starts from the day AFTER lastExpandedDate, not from startDate', () => {
    const rule = makeRule({
      frequency: 'monthly',
      startDate: '2024-01-01',
      lastExpandedDate: '2024-02-01',
    });
    const { transactions } = expandRule(rule, '2024-04-01', makeIdGen());
    // Should generate Mar 1 and Apr 1, NOT Jan/Feb again
    expect(transactions).toHaveLength(2);
    expect(transactions.map((t) => t.date)).toEqual(['2024-03-01', '2024-04-01']);
  });

  test('with lastExpandedDate null, starts from startDate', () => {
    const rule = makeRule({
      frequency: 'monthly',
      startDate: '2024-06-01',
      lastExpandedDate: null,
    });
    const { transactions } = expandRule(rule, '2024-08-01', makeIdGen());
    expect(transactions).toHaveLength(3);
    expect(transactions[0].date).toBe('2024-06-01');
  });

  test('with daily rule, advances exactly one day past lastExpandedDate', () => {
    const rule = makeRule({
      frequency: 'daily',
      startDate: '2024-01-01',
      lastExpandedDate: '2024-01-10',
    });
    const { transactions } = expandRule(rule, '2024-01-13', makeIdGen());
    expect(transactions).toHaveLength(3);
    expect(transactions.map((t) => t.date)).toEqual([
      '2024-01-11',
      '2024-01-12',
      '2024-01-13',
    ]);
  });

  test('generates nothing when lastExpandedDate already equals referenceDate', () => {
    const rule = makeRule({
      frequency: 'monthly',
      startDate: '2024-01-01',
      lastExpandedDate: '2024-03-01',
    });
    // Next advance → 2024-04-01, which is after 2024-03-01 → no new transactions
    const { transactions } = expandRule(rule, '2024-03-01', makeIdGen());
    expect(transactions).toHaveLength(0);
  });
});

// ─── Idempotence ────────────────────────────────────────────────────────────

describe('Idempotence', () => {
  test('does not generate duplicate transactions when called twice with same referenceDate', () => {
    const rule = makeRule({
      frequency: 'monthly',
      startDate: '2024-01-01',
      lastExpandedDate: null,
    });
    const idGen = makeIdGen();

    const result1 = expandRule(rule, '2024-03-01', idGen);
    const result2 = expandRule({ ...rule, lastExpandedDate: result1.updatedRule.lastExpandedDate }, '2024-03-01', idGen);

    // Same reference date → no new transactions
    expect(result2.transactions).toHaveLength(0);
  });

  test('resets correctly when referenceDate advances', () => {
    const rule = makeRule({
      frequency: 'monthly',
      startDate: '2024-01-01',
      lastExpandedDate: null,
    });
    const idGen = makeIdGen();

    const result1 = expandRule(rule, '2024-03-01', idGen);
    const result2 = expandRule({ ...rule, lastExpandedDate: result1.updatedRule.lastExpandedDate }, '2024-04-01', idGen);

    expect(result2.transactions).toHaveLength(1);
    expect(result2.transactions[0].date).toBe('2024-04-01');
  });
});