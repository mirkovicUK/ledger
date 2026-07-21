import { describe, test, expect } from 'vitest';
import { ledgerReducer, INITIAL_STATE } from '../src/lib/ledgerReducer.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid account payload (no id/createdAt needed — reducer generates them) */
function makeAccountPayload(overrides: Record<string, unknown> = {}): {
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
} {
  return { name: 'Checking', type: 'checking', ...overrides };
}

/** Build a state that already contains one account */
function stateWithAccount(accountPayload: Record<string, unknown> = {}): {
  accounts: any[];
  transactions: any[];
  categories: any[];
  budgets: any[];
  recurringRules: any[];
} {
  return ledgerReducer(INITIAL_STATE, {
    type: 'CREATE_ACCOUNT',
    payload: makeAccountPayload(accountPayload),
  });
}

/** Build a state with one account, return both state and the generated account */
function stateAndAccount(accountPayload: Record<string, unknown> = {}): {
  state: {
    accounts: any[];
    transactions: any[];
    categories: any[];
    budgets: any[];
    recurringRules: any[];
  };
  account: any;
} {
  const state = stateWithAccount(accountPayload);
  const account = state.accounts[0];
  return { state, account };
}

/** Build a minimal valid transaction payload for a known accountId */
function makeTxPayload(accountId: string, overrides: Record<string, unknown> = {}): {
  accountId: string;
  amount: number;
  date: string;
  description: string;
} {
  return {
    accountId,
    amount: 100,
    date: '2024-06-15',
    description: 'Test transaction',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// INITIAL_STATE
// ---------------------------------------------------------------------------

describe('INITIAL_STATE', () => {
  test('has all required collection keys as empty arrays', () => {
    expect(INITIAL_STATE.accounts).toEqual([]);
    expect(INITIAL_STATE.transactions).toEqual([]);
    expect(INITIAL_STATE.categories).toEqual([]);
    expect(INITIAL_STATE.budgets).toEqual([]);
    expect(INITIAL_STATE.recurringRules).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// CREATE_ACCOUNT
// ---------------------------------------------------------------------------