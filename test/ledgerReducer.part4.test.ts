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

describe('DELETE_ACCOUNT', () => {
  test('removes the account from the accounts array', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'DELETE_ACCOUNT',
      payload: { id: account.id },
    });
    expect(updated.accounts).toHaveLength(0);
  });

  test('cascade — removes all transactions belonging to the deleted account', () => {
    const { state, account } = stateAndAccount();

    // Add two transactions for this account
    let s = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id, { description: 'Tx 1' }),
    });
    s = ledgerReducer(s, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id, { description: 'Tx 2' }),
    });
    expect(s.transactions).toHaveLength(2);

    const updated = ledgerReducer(s, {
      type: 'DELETE_ACCOUNT',
      payload: { id: account.id },
    });

    expect(updated.accounts).toHaveLength(0);
    expect(updated.transactions).toHaveLength(0);
  });

  test('cascade — only removes transactions for the deleted account, not others', () => {
    // Create two accounts
    let state = ledgerReducer(INITIAL_STATE, {
      type: 'CREATE_ACCOUNT',
      payload: { name: 'Account A', type: 'checking' },
    });
    state = ledgerReducer(state, {
      type: 'CREATE_ACCOUNT',
      payload: { name: 'Account B', type: 'savings' },
    });
    const [accountA, accountB] = state.accounts;

    // Add a transaction for each
    state = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(accountA.id, { description: 'Tx A' }),
    });
    state = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(accountB.id, { description: 'Tx B' }),
    });

    // Delete account A
    const updated = ledgerReducer(state, {
      type: 'DELETE_ACCOUNT',
      payload: { id: accountA.id },
    });

    expect(updated.accounts).toHaveLength(1);
    expect(updated.accounts[0].id).toBe(accountB.id);
    expect(updated.transactions).toHaveLength(1);
    expect(updated.transactions[0].accountId).toBe(accountB.id);
  });

  test('is a no-op when the account id does not exist', () => {
    const { state } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'DELETE_ACCOUNT',
      payload: { id: 'nonexistent-id' },
    });
    expect(updated.accounts).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// CREATE_TRANSACTION
// ---------------------------------------------------------------------------