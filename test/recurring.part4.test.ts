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

describe('expandRule – monthly frequency', () => {
  test('generates one transaction per month', () => {
    const rule = makeRule({ frequency: 'monthly', startDate: '2024-01-15' });
    const { transactions } = expandRule(rule, '2024-04-15', makeIdGen());
    expect(transactions).toHaveLength(4);
    expect(transactions.map((t) => t.date)).toEqual([
      '2024-01-15',
      '2024-02-15',
      '2024-03-15',
      '2024-04-15',
    ]);
  });

  test('stops before referenceDate if next date would exceed it', () => {
    const rule = makeRule({ frequency: 'monthly', startDate: '2024-01-31' });
    // Feb 31 doesn't exist → date-fns rolls to Feb 29 (2024 is a leap year)
    const { transactions } = expandRule(rule, '2024-03-01', makeIdGen());
    expect(transactions).toHaveLength(2);
    expect(transactions[0].date).toBe('2024-01-31');
    expect(transactions[1].date).toBe('2024-02-29'); // leap year
  });
});