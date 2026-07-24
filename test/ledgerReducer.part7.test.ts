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

describe('IMPORT_STATE', () => {
  const validState = {
    accounts: [
      {
        id: 'acc-1',
        name: 'Imported Account',
        type: 'savings',
        createdAt: new Date().toISOString(),
      },
    ],
    transactions: [
      {
        id: 'tx-1',
        accountId: 'acc-1',
        amount: 500,
        date: '2024-01-01',
        description: 'Imported transaction',
        categoryId: null,
        createdAt: new Date().toISOString(),
      },
    ],
    categories: [],
    budgets: [],
    recurringRules: [],
  };

  test('replaces current state with the imported state', () => {
    const updated = ledgerReducer(INITIAL_STATE, {
      type: 'IMPORT_STATE',
      payload: validState,
    });
    expect(updated.accounts).toHaveLength(1);
    expect(updated.accounts[0].name).toBe('Imported Account');
    expect(updated.transactions).toHaveLength(1);
    expect(updated.transactions[0].description).toBe('Imported transaction');
  });

  test('overwrites existing state', () => {
    const { state } = stateAndAccount({ name: 'Old Account' });
    const updated = ledgerReducer(state, {
      type: 'IMPORT_STATE',
      payload: validState,
    });
    expect(updated.accounts).toHaveLength(1);
    expect(updated.accounts[0].name).toBe('Imported Account');
  });

  test('returns state unchanged when payload is null', () => {
    const updated = ledgerReducer(INITIAL_STATE, {
      type: 'IMPORT_STATE',
      payload: null,
    });
    expect(updated).toBe(INITIAL_STATE);
  });

  test('returns state unchanged when payload is missing required keys', () => {
    const updated = ledgerReducer(INITIAL_STATE, {
      type: 'IMPORT_STATE',
      payload: { accounts: [], transactions: [] }, // missing categories, budgets, recurringRules
    });
    expect(updated).toBe(INITIAL_STATE);
  });

  test('returns state unchanged when accounts array contains invalid entry', () => {
    const updated = ledgerReducer(INITIAL_STATE, {
      type: 'IMPORT_STATE',
      payload: {
        accounts: [{ id: 'x', name: '', type: 'invalid', createdAt: 'not-a-date' }],
        transactions: [],
        categories: [],
        budgets: [],
        recurringRules: [],
      },
    });
    expect(updated).toBe(INITIAL_STATE);
  });

  test('returns state unchanged when payload is a plain string', () => {
    const updated = ledgerReducer(INITIAL_STATE, {
      type: 'IMPORT_STATE',
      payload: 'not-an-object',
    });
    expect(updated).toBe(INITIAL_STATE);
  });
});

// ---------------------------------------------------------------------------
// RESET_STATE
// ---------------------------------------------------------------------------