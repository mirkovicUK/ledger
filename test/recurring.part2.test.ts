import { describe, test, expect } from 'vitest';
import { expandRule, expandAllRules } from '../src/lib/recurring.js';
import type { RecurringRule } from '../src/lib/types.js';

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

// ─── expandRule – correct dates per frequency ──────────────────────────────

describe('expandRule – weekly frequency', () => {
  test('generates one transaction per week', () => {
    const rule = makeRule({ frequency: 'weekly', startDate: '2024-01-01' });
    const { transactions } = expandRule(rule, '2024-01-29', makeIdGen());
    // Jan 1, 8, 15, 22, 29 → 5 transactions
    expect(transactions).toHaveLength(5);
    expect(transactions.map((t) => t.date)).toEqual([
      '2024-01-01',
      '2024-01-08',
      '2024-01-15',
      '2024-01-22',
      '2024-01-29',
    ]);
  });
});