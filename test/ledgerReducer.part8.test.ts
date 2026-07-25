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
// RESET_STATE
// ---------------------------------------------------------------------------

describe('RESET_STATE', () => {
  test('returns INITIAL_STATE from a populated state', () => {
    const { state } = stateAndAccount();
    const updated = ledgerReducer(state, { type: 'RESET_STATE' });
    expect(updated).toBe(INITIAL_STATE);
  });

  test('returns INITIAL_STATE from an already-empty state', () => {
    const updated = ledgerReducer(INITIAL_STATE, { type: 'RESET_STATE' });
    expect(updated).toBe(INITIAL_STATE);
  });

  test('all collections are empty after reset', () => {
    let state = stateWithAccount();
    state = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(state.accounts[0].id),
    });
    const reset = ledgerReducer(state, { type: 'RESET_STATE' });
    expect(reset.accounts).toHaveLength(0);
    expect(reset.transactions).toHaveLength(0);
    expect(reset.categories).toHaveLength(0);
    expect(reset.budgets).toHaveLength(0);
    expect(reset.recurringRules).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Schema validation rejection
// ---------------------------------------------------------------------------