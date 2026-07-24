import { expandRule, expandAllRules } from '../src/lib/recurring.js';
import type { Transaction, RecurringRule } from '../src/lib/types.js';
import { generateId } from '../src/lib/id.js';
import { describe, it, expect } from 'vitest';

// Simple deterministic ID generator for tests
let idCounter = 0;
function makeIdGen() {
  idCounter = 0;
  return () => `tx-${++idCounter}`;
}

// Baseline rule factory
function makeRule(overrides: Partial<RecurringRule> = {}): RecurringRule {
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

// ─── expandAllRules – correct dates per frequency ──────────────────────────────

describe('expandAllRules', () => {
  it('merges new transactions with existing ones', () => {
    const rules = [makeRule({ frequency: 'monthly', startDate: '2024-01-01' })];
    const existing: Transaction[] = [{ id: 'old-1', accountId: 'acct-x', amount: 5, date: '2023-12-01', description: 'Old tx', categoryId: null, recurringRuleId: null, createdAt: new Date().toISOString() }];

    const { transactions } = expandAllRules(rules, existing, '2024-02-01', makeIdGen());

    // 1 existing + 2 new (Jan, Feb)
    expect(transactions).toHaveLength(3);
    expect(transactions[0]).toEqual(existing[0]);
  });

  it('returns updatedRules with fresh lastExpandedDate for each rule', () => {
    const rules = [
      makeRule({ id: 'r1', frequency: 'monthly', startDate: '2024-01-01' }),
      makeRule({ id: 'r2', frequency: 'weekly', startDate: '2024-01-01' }),
    ];

    const { updatedRules } = expandAllRules(rules, [], '2024-02-01', makeIdGen());

    expect(updatedRules).toHaveLength(2);
    expect(updatedRules[0].lastExpandedDate).toBe('2024-02-01');
    expect(updatedRules[1].lastExpandedDate).toBe('2024-01-29');
  });

  it('is idempotent across two full calls', () => {
    const rules = [makeRule({ frequency: 'monthly', startDate: '2024-01-01' })];

    const { transactions: first, updatedRules: rules1 } = expandAllRules(
      rules,
      [],
      '2024-03-01',
      makeIdGen()
    );

    const { transactions: second } = expandAllRules(rules1, first, '2024-03-01', makeIdGen());

    // Counts should not grow; the 3 existing transactions come from 'first', nothing new added
    expect(second).toHaveLength(first.length);
  });

  it('handles an empty rules array', () => {
    const existing: Transaction[] = [{ id: 'e1', accountId: 'acct-1', amount: 10, date: '2024-01-01', description: 'Existing', categoryId: null, recurringRuleId: null, createdAt: new Date().toISOString() }];
    const { transactions, updatedRules } = expandAllRules([], existing, '2024-06-01', makeIdGen());
    expect(transactions).toHaveLength(1);
    expect(updatedRules).toHaveLength(0);
  });
});