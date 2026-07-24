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

describe('expandRule – yearly frequency', () => {
  test('generates one transaction per year', () => {
    const rule = makeRule({ frequency: 'yearly', startDate: '2021-06-01' });
    const { transactions } = expandRule(rule, '2024-06-01', makeIdGen());
    expect(transactions).toHaveLength(4);
    expect(transactions.map((t) => t.date)).toEqual([
      '2021-06-01',
      '2022-06-01',
      '2023-06-01',
      '2024-06-01',
    ]);
  });
});

// ─── expandRule – transaction shape ────────────────────────────────────────