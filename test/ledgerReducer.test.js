import { describe, test, expect } from '@jest/globals';
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

describe('Immutability', () => {
  test('reducer never mutates the input state object', () => {
    const { state, account } = stateAndAccount();
    const originalAccounts = state.accounts;

    ledgerReducer(state, {
      type: 'CREATE_TRANSACTION',
      payload: makeTxPayload(account.id),
    });

    expect(state.accounts).toBe(originalAccounts);
    expect(state.transactions).toHaveLength(0);
  });
});
