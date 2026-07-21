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

describe('Schema validation rejection', () => {
  test('CREATE_ACCOUNT with invalid type returns state unchanged', () => {
    const state = ledgerReducer(INITIAL_STATE, {
      type: 'CREATE_ACCOUNT',
      payload: { name: 'Test', type: 'brokerage' }, // 'brokerage' is not valid
    });
    expect(state).toBe(INITIAL_STATE);
  });

  test('CREATE_ACCOUNT with missing name returns state unchanged', () => {
    const state = ledgerReducer(INITIAL_STATE, {
      type: 'CREATE_ACCOUNT',
      payload: { type: 'savings' },
    });
    expect(state).toBe(INITIAL_STATE);
  });

  test('CREATE_TRANSACTION with missing date returns state unchanged', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: { accountId: account.id, amount: 10, description: 'no date' },
    });
    expect(updated).toBe(state);
  });

  test('CREATE_TRANSACTION with non-numeric amount returns state unchanged', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: { accountId: account.id, amount: 'fifty', date: '2024-01-01', description: 'test' },
    });
    expect(updated).toBe(state);
  });

  test('unknown action type returns state unchanged', () => {
    const updated = ledgerReducer(INITIAL_STATE, { type: 'UNKNOWN_ACTION' });
    expect(updated).toBe(INITIAL_STATE);
  });
});

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------