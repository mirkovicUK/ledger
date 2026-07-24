import { describe, it, expect } from 'vitest';
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

describe('expandRule – biweekly frequency', () => {
  it('generates one transaction every two weeks', () => {
    const rule = makeRule({ frequency: 'biweekly', startDate: '2024-01-01' });
    const { transactions } = expandRule(rule, '2024-02-12', makeIdGen());
    // Jan 1, 15, 29; Feb 12 → 4 transactions
    expect(transactions).toHaveLength(4);
    expect(transactions.map((t) => t.date)).toEqual([
      '2024-01-01',
      '2024-01-15',
      '2024-01-29',
      '2024-02-12',
    ]);
  });
});