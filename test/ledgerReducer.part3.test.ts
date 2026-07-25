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

describe('EDIT_ACCOUNT', () => {
  test('updates account name', () => {
    const { state, account } = stateAndAccount({ name: 'Old Name' });
    const updated = ledgerReducer(state, {
      type: 'EDIT_ACCOUNT',
      payload: { ...account, name: 'New Name' },
    });
    expect(updated.accounts[0].name).toBe('New Name');
  });

  test('updates account type', () => {
    const { state, account } = stateAndAccount({ type: 'checking' });
    const updated = ledgerReducer(state, {
      type: 'EDIT_ACCOUNT',
      payload: { ...account, type: 'savings' },
    });
    expect(updated.accounts[0].type).toBe('savings');
  });

  test('does not affect other accounts', () => {
    let state = ledgerReducer(INITIAL_STATE, {
      type: 'CREATE_ACCOUNT',
      payload: { name: 'Account A', type: 'checking' },
    });
    state = ledgerReducer(state, {
      type: 'CREATE_ACCOUNT',
      payload: { name: 'Account B', type: 'savings' },
    });
    const [accountA] = state.accounts;

    const updated = ledgerReducer(state, {
      type: 'EDIT_ACCOUNT',
      payload: { ...accountA, name: 'Account A — Edited' },
    });

    expect(updated.accounts).toHaveLength(2);
    expect(updated.accounts[1].name).toBe('Account B');
  });

  test('rejects edit with invalid type — returns state unchanged', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'EDIT_ACCOUNT',
      payload: { ...account, type: 'not-a-type' },
    });
    expect(updated).toBe(state);
  });

  test('rejects edit with empty name — returns state unchanged', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'EDIT_ACCOUNT',
      payload: { ...account, name: '' },
    });
    expect(updated).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// DELETE_ACCOUNT
// ---------------------------------------------------------------------------


export { makeAccountPayload, stateWithAccount, stateAndAccount, makeTxPayload };