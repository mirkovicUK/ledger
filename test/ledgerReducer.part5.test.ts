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

describe('CREATE_TRANSACTION', () => {
  test('adds a transaction when accountId is valid', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id),
    });
    expect(updated.transactions).toHaveLength(1);
  });

  test('generated transaction has a non-empty id string', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id),
    });
    expect(typeof updated.transactions[0].id).toBe('string');
    expect(updated.transactions[0].id.length).toBeGreaterThan(0);
  });

  test('transaction stores the correct payload data', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id, { amount: 250, description: 'Grocery run', date: '2024-07-01' }),
    });
    const tx = updated.transactions[0];
    expect(tx.amount).toBe(250);
    expect(tx.description).toBe('Grocery run');
    expect(tx.date).toBe('2024-07-01');
    expect(tx.accountId).toBe(account.id);
  });

  test('returns state unchanged when accountId does not exist', () => {
    const updated = ledgerReducer(INITIAL_STATE, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload('nonexistent-account-id'),
    });
    expect(updated).toBe(INITIAL_STATE);
    expect(updated.transactions).toHaveLength(0);
  });

  test('returns state unchanged when accountId is empty string', () => {
    const { state } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(''),
    });
    expect(updated).toBe(state);
  });

  test('returns state unchanged for missing required fields (e.g. no description)', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: { accountId: account.id, amount: 100, date: '2024-06-15' },
    });
    expect(updated).toBe(state);
  });

  test('returns state unchanged for invalid date format', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id, { date: 'not-a-date' }),
    });
    expect(updated).toBe(state);
  });

  test('returns state unchanged for non-finite amount', () => {
    const { state, account } = stateAndAccount();
    const updated = ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id, { amount: Infinity }),
    });
    expect(updated).toBe(state);
  });
});

// ---------------------------------------------------------------------------
// EDIT_TRANSACTION — referential integrity
// ---------------------------------------------------------------------------