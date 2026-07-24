import { describe, it, expect } from 'vitest';
import { expandRule, expandAllRules } from '../src/lib/recurring.js';

// Simple deterministic ID generator for tests
let idCounter = 0;
function makeIdGen() {
  idCounter = 0;
  return () => `tx-${++idCounter}`;
}

// Baseline rule factory
function makeRule(overrides: any = {}) {
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

describe('expandRule – startDate after referenceDate', () => {
  it('generates no transactions when startDate is after referenceDate', () => {
    const rule = makeRule({ frequency: 'monthly', startDate: '2025-01-01' });
    const { transactions, updatedRule } = expandRule(rule, '2024-12-31', makeIdGen());
    expect(transactions).toHaveLength(0);
    // lastExpandedDate should remain null (no change)
    expect(updatedRule.lastExpandedDate).toBeNull();
  });
});

// ─── expandRule – updatedRule.lastExpandedDate tracking ────────────────────