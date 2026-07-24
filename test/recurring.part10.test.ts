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

describe('expandRule – idempotence (double expansion produces no duplicates)', () => {
  it('second call with same referenceDate generates no additional transactions', () => {
    const rule = makeRule({ frequency: 'monthly', startDate: '2024-01-01' });

    // First expansion
    const { transactions: first, updatedRule: ruleAfterFirst } = expandRule(
      rule,
      '2024-03-01',
      makeIdGen()
    );
    expect(first).toHaveLength(3);

    // Second expansion using the already-updated rule
    const { transactions: second } = expandRule(ruleAfterFirst, '2024-03-01', makeIdGen());
    expect(second).toHaveLength(0);
  });

  it('second call with advanced referenceDate generates only new transactions', () => {
    const rule = makeRule({ frequency: 'monthly', startDate: '2024-01-01' });

    const { updatedRule: ruleAfterFirst } = expandRule(rule, '2024-03-01', makeIdGen());
    const { transactions: second } = expandRule(ruleAfterFirst, '2024-05-01', makeIdGen());

    expect(second).toHaveLength(2);
    expect(second.map((t) => t.date)).toEqual(['2024-04-01', '2024-05-01']);
  });
});

// ─── expandAllRules ─────────────────────────────────────────────────────────

export {};