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

describe('CREATE_ACCOUNT', () => {
  test('adds an account to an empty state', () => {
    const state = ledgerReducer(INITIAL_STATE, {
      type: 'CREATE_ACCOUNT',
      payload: makeAccountPayload(),
    });
    expect(state.accounts).toHaveLength(1);
  });

  test('generated account has a non-empty id string', () => {
    const { account } = stateAndAccount();
    expect(typeof account.id).toBe('string');
    expect(account.id.length).toBeGreaterThan(0);
  });

  test('generated account has a valid ISO createdAt timestamp', () => {
    const { account } = stateAndAccount();
    expect(() => new Date(account.createdAt).toISOString()).not.toThrow();
  });

  test('account stores the provided name and type', () => {
    const { account } = stateAndAccount({ name: 'Savings', type: 'savings' });
    expect(account.name).toBe('Savings');
    expect(account.type).toBe('savings');
  });

  test('does not mutate existing accounts array', () => {
    const original = INITIAL_STATE.accounts;
    const state = ledgerReducer(INITIAL_STATE, {
      type: 'CREATE_ACCOUNT',
      payload: makeAccountPayload(),
    });
    expect(state.accounts).not.toBe(original);
  });

  test('rejects missing name — returns state unchanged', () => {
    const state = ledgerReducer(INITIAL_STATE, {
      type: 'CREATE_ACCOUNT',
      payload: { type: 'checking' }, // name missing
    });
    expect(state).toBe(INITIAL_STATE);
    expect(state.accounts).toHaveLength(0);
  });

  test('rejects empty name — returns state unchanged', () => {
    const state = ledgerReducer(INITIAL_STATE, {
      type: 'CREATE_ACCOUNT',
      payload: { name: '', type: 'checking' },
    });
    expect(state.accounts).toHaveLength(0);
  });

  test('rejects invalid account type — returns state unchanged', () => {
    const state = ledgerReducer(INITIAL_STATE, {
      type: 'CREATE_ACCOUNT',
      payload: { name: 'My Account', type: 'invalid-type' },
    });
    expect(state).toBe(INITIAL_STATE);
    expect(state.accounts).toHaveLength(0);
  });

  test('accepts all valid account types', () => {
    for (const type of ['checking', 'savings', 'credit', 'cash', 'investment']) {
      const state = ledgerReducer(INITIAL_STATE, {
        type: 'CREATE_ACCOUNT',
        payload: { name: 'My Account', type },
      });
      expect(state.accounts).toHaveLength(1);
    }
  });
});

// ---------------------------------------------------------------------------
// EDIT_ACCOUNT
// ---------------------------------------------------------------------------