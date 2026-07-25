import { describe, test, expect } from 'vitest';
import { ledgerReducer, INITIAL_STATE } from '../src/lib/ledgerReducer.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAccountPayload(overrides = {}) {
  return { name: 'Checking', type: 'checking', ...overrides };
}

function stateWithAccount(accountPayload = {}) {
  return ledgerReducer(INITIAL_STATE, {
    type: 'CREATE_ACCOUNT',
    payload: makeAccountPayload(accountPayload),
  });
}

function stateAndAccount(accountPayload = {}) {
  const state = stateWithAccount(accountPayload);
  const account = state.accounts[0];
  return { state, account };
}

function makeTxPayload(accountId: string, overrides = {}) {
  return {
    accountId,
    amount: 100,
    date: '2024-06-15',
    description: 'Test transaction',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// EDIT_TRANSACTION — referential integrity
// ---------------------------------------------------------------------------

describe('EDIT_TRANSACTION — referential integrity', () => {
  test('returns state unchanged when edited accountId does not exist', () => {
    const { state, account } = stateAndAccount();

    const s = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id),
    });
    const tx = s.transactions[0];

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