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

describe('EDIT_TRANSACTION — referential integrity', () => {
  test('returns state unchanged when edited accountId does not exist', () => {
    const { state, account } = stateAndAccount();

    // First create a valid transaction
    const s = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id),
    });
    const tx = s.transactions[0];

    // Try to move the transaction to a non-existent account
    const updated = ledgerReducer(s, {
      type: 'EDIT_TRANSACTION',
      payload: { ...tx, accountId: 'ghost-account' },
    });

    expect(updated).toBe(s);
    expect(updated.transactions[0].accountId).toBe(account.id);
  });

  test('successfully edits transaction with valid accountId', () => {
    const { state, account } = stateAndAccount();
    const s = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id),
    });
    const tx = s.transactions[0];

    const updated = ledgerReducer(s, {
      type: 'EDIT_TRANSACTION',
      payload: { ...tx, amount: 999, description: 'Updated description' },
    });

    expect(updated.transactions[0].amount).toBe(999);
    expect(updated.transactions[0].description).toBe('Updated description');
  });
});

// ---------------------------------------------------------------------------
// IMPORT_STATE
// ---------------------------------------------------------------------------

export {
  makeAccountPayload,
  stateWithAccount,
  stateAndAccount,
  makeTxPayload,
};