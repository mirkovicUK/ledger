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

// ─── expandRule – correct dates per frequency ──────────────────────────────────

describe('expandRule – updatedRule.lastExpandedDate', () => {
  test('is set to the last generated date after expansion', () => {
    const rule = makeRule({ frequency: 'monthly', startDate: '2024-01-01' });
    const { updatedRule } = expandRule(rule, '2024-03-01', makeIdGen());
    expect(updatedRule.lastExpandedDate).toBe('2024-03-01');
  });

  test('is set to referenceDate when startDate <= referenceDate but no transactions generated', () => {
    // This only happens when lastExpandedDate === referenceDate (next date would exceed it)
    // Set lastExpandedDate so that next advance goes past referenceDate
    const rule = makeRule({
      frequency: 'monthly',
      startDate: '2024-01-01',
      lastExpandedDate: '2024-03-01',
    });
    const { transactions, updatedRule } = expandRule(rule, '2024-03-15', makeIdGen());
    // Next date would be 2024-04-01, which is after 2024-03-15 → no transactions
    expect(transactions).toHaveLength(0);
    // startDate (Jan) <= referenceDate (Mar 15), so bookmark advances
    expect(updatedRule.lastExpandedDate).toBe('2024-03-15');
  });

  test('is unchanged when startDate > referenceDate', () => {
    const rule = makeRule({
      frequency: 'monthly',
      startDate: '2025-06-01',
      lastExpandedDate: null,
    });
    const { updatedRule } = expandRule(rule, '2024-01-01', makeIdGen());
    expect(updatedRule.lastExpandedDate).toBeNull();
  });
});

// ─── expandRule – expansion from lastExpandedDate vs startDate ──────────────