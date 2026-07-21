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

describe('expandRule – biweekly frequency', () => {
  test('generates one transaction every two weeks', () => {
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

describe('expandRule – transaction fields', () => {
  test('each transaction carries the correct fields from the rule', () => {
    const rule = makeRule({
      frequency: 'monthly',
      startDate: '2024-01-01',
      amount: 99.99,
      description: 'Rent',
      accountId: 'acct-rent',
      categoryId: 'cat-housing',
    });
    const { transactions } = expandRule(rule, '2024-01-01', makeIdGen());
    const [tx] = transactions;
    expect(tx.accountId).toBe('acct-rent');
    expect(tx.amount).toBe(99.99);
    expect(tx.description).toBe('Rent');
    expect(tx.categoryId).toBe('cat-housing');
    expect(tx.recurringRuleId).toBe('rule-1');
    expect(tx.id).toBeDefined();
    expect(tx.createdAt).toBeDefined();
  });

  test('each transaction gets a unique id from the generator', () => {
    const rule = makeRule({ frequency: 'daily', startDate: '2024-01-01' });
    const { transactions } = expandRule(rule, '2024-01-03', makeIdGen());
    const ids = transactions.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('categoryId defaults to null when not set on rule', () => {
    const rule = makeRule({ categoryId: undefined, frequency: 'monthly', startDate: '2024-01-01' });
    const { transactions } = expandRule(rule, '2024-01-01', makeIdGen());
    expect(transactions[0].categoryId).toBeNull();
  });
});

// ─── expandRule – no transactions when startDate > referenceDate ────────────

describe('expandRule – startDate after referenceDate', () => {
  test('generates no transactions when startDate is after referenceDate', () => {
    const rule = makeRule({ frequency: 'monthly', startDate: '2025-01-01' });
    const { transactions, updatedRule } = expandRule(rule, '2024-12-31', makeIdGen());
    expect(transactions).toHaveLength(0);
    // lastExpandedDate should remain null (no change)
    expect(updatedRule.lastExpandedDate).toBeNull();
  });
});

// ─── expandRule – updatedRule.lastExpandedDate tracking ────────────────────

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

describe('expandRule – idempotence (double expansion produces no duplicates)', () => {
  test('second call with same referenceDate generates no additional transactions', () => {
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

  test('second call with advanced referenceDate generates only new transactions', () => {
    const rule = makeRule({ frequency: 'monthly', startDate: '2024-01-01' });

    const { updatedRule: ruleAfterFirst } = expandRule(rule, '2024-03-01', makeIdGen());
    const { transactions: second } = expandRule(ruleAfterFirst, '2024-05-01', makeIdGen());

    expect(second).toHaveLength(2);
    expect(second.map((t) => t.date)).toEqual(['2024-04-01', '2024-05-01']);
  });
});

// ─── expandAllRules ─────────────────────────────────────────────────────────

describe('expandAllRules', () => {
  test('merges new transactions with existing ones', () => {
    const rules = [makeRule({ frequency: 'monthly', startDate: '2024-01-01' })];
    const existing = [{ id: 'old-1', accountId: 'acct-x', amount: 5, date: '2023-12-01' }];

    const { transactions } = expandAllRules(rules, existing, '2024-02-01', makeIdGen());

    // 1 existing + 2 new (Jan, Feb)
    expect(transactions).toHaveLength(3);
    expect(transactions[0]).toEqual(existing[0]);
  });

  test('returns updatedRules with fresh lastExpandedDate for each rule', () => {
    const rules = [
      makeRule({ id: 'r1', frequency: 'monthly', startDate: '2024-01-01' }),
      makeRule({ id: 'r2', frequency: 'weekly', startDate: '2024-01-01' }),
    ];

    const { updatedRules } = expandAllRules(rules, [], '2024-02-01', makeIdGen());

    expect(updatedRules).toHaveLength(2);
    expect(updatedRules[0].lastExpandedDate).toBe('2024-02-01');
    expect(updatedRules[1].lastExpandedDate).toBe('2024-01-29');
  });

  test('is idempotent across two full calls', () => {
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

  test('handles an empty rules array', () => {
    const existing = [{ id: 'e1', amount: 10, date: '2024-01-01' }];
    const { transactions, updatedRules } = expandAllRules([], existing, '2024-06-01', makeIdGen());
    expect(transactions).toHaveLength(1);
    expect(updatedRules).toHaveLength(0);
  });
});
