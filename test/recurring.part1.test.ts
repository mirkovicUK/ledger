import { describe, test, expect } from 'vitest';
import { expandRule } from '../src/lib/recurring.js';

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

describe('expandRule – daily frequency', () => {
  test('generates one transaction per day up to referenceDate', () => {
    const rule = makeRule({ frequency: 'daily', startDate: '2024-01-01' });
    const { transactions } = expandRule(rule, '2024-01-03', makeIdGen());
    expect(transactions).toHaveLength(3);
    expect(transactions.map((t) => t.date)).toEqual([
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
    ]);
  });

  test('generates exactly one transaction when referenceDate equals startDate', () => {
    const rule = makeRule({ frequency: 'daily', startDate: '2024-03-15' });
    const { transactions } = expandRule(rule, '2024-03-15', makeIdGen());
    expect(transactions).toHaveLength(1);
    expect(transactions[0].date).toBe('2024-03-15');
  });
});