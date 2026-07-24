import { describe, test, expect } from 'vitest';
import { ledgerReducer, INITIAL_STATE } from '../src/lib/ledgerReducer.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid account payload (no id/createdAt needed — reducer generates them) */
function makeAccountPayload(overrides = {}) {
  return { name: 'Checking', type: 'checking', ...overrides };
}

/** Build a state that already contains one account */
function stateWithAccount(accountPayload = {}) {
  return ledgerReducer(INITIAL_STATE, {
    type: 'CREATE_ACCOUNT',
    payload: makeAccountPayload(accountPayload),
  });
}

/** Build a state with one account, return both state and the generated account */
function stateAndAccount(accountPayload = {}) {
  const state = stateWithAccount(accountPayload);
  const account = state.accounts[0];
  return { state, account };
}

/** Build a minimal valid transaction payload for a known accountId */
function makeTxPayload(accountId, overrides = {}) {
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


export { makeAccountPayload, stateWithAccount, stateAndAccount, makeTxPayload };