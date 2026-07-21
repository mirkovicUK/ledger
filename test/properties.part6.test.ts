import { describe, test, expect } from 'vitest';
import { computeBudgetSpending } from '../src/lib/budget.js';
import { periodStart, periodEnd, isWithinRange } from '../src/lib/date.js';
import { applyFilters } from '../src/lib/filter.js';
import { exportToJSON, importFromJSON } from '../src/lib/storage.js';
import { sortTransactions } from '../src/lib/sort.js';
import { expandRule } from '../src/lib/recurring.js';
import { INITIAL_STATE, ledgerReducer } from '../src/lib/ledgerReducer.js';
import type { AppState } from '../src/lib/types.js';

// ---------------------------------------------------------------------------
// Property 3: Budget spending equals sum of matching transactions in period
// Validates: Requirements 4.4, 4.5
// ---------------------------------------------------------------------------

describe('Property 12: Referential integrity — transactions with non-existent accountId leave state unchanged', () => {
  /**
   * When CREATE_TRANSACTION or EDIT_TRANSACTION is dispatched with an
   * accountId that does not exist in state.accounts, the reducer MUST return
   * the exact same state reference (state unchanged).
   *
   * **Validates: Requirements 10.5**
   */

  // Deterministic PRNG (mulberry32) so failures are reproducible
  function makePrng(seed: number) {
    let s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function p12Pad(n: number) {
    return String(n).padStart(2, '0');
  }

  /** Generate a YYYY-MM-DD string within 2024 */
  function p12RandomDate(rng: () => number) {
    const month = Math.floor(rng() * 12) + 1;
    const day = Math.floor(rng() * 28) + 1;
    return `2024-${p12Pad(month)}-${p12Pad(day)}`;
  }

  /** Generate a valid transaction payload but with a guaranteed non-existent accountId */
  function p12TransactionPayload(rng: () => number, nonExistentId: string, overrides: Record<string, any> = {}) {
    return {
      accountId: nonExistentId,
      amount: parseFloat((rng() * 2000 - 500).toFixed(2)),
      date: p12RandomDate(rng),
      description: `tx-p12-${Math.floor(rng() * 1e6)}`,
      categoryId: null,
      ...overrides,
    };
  }

  test('CREATE_TRANSACTION with non-existent accountId on empty state returns same reference (100 iterations)', () => {
    for (let i = 0; i < 100; i++) {
      const rng = makePrng(i * 6271 + 13);

      // INITIAL_STATE has no accounts — any accountId is non-existent
      const nonExistentId = `ghost-acc-${i}-${Math.floor(rng() * 1e9)}`;
      const state = INITIAL_STATE;

      const nextState = ledgerReducer(state, {
        type: 'CREATE_TRANSACTION',
        payload: p12TransactionPayload(rng, nonExistentId),
      });

      // Must be the exact same reference — state unchanged
      expect(nextState).toBe(state);
    }
  });

  test('EDIT_TRANSACTION with non-existent accountId in a state with accounts returns same reference (100 iterations)', () => {
    const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'cash', 'investment'];

    for (let i = 0; i < 100; i++) {
      const rng = makePrng(i * 9431 + 77);

      // Build a state with 1–3 real accounts
      const accountCount = Math.floor(rng() * 3) + 1;
      const accounts = Array.from({ length: accountCount }, (_, k) => ({
        id: `acc-p12-${i}-${k}`,
        name: `Account ${k}`,
        type: ACCOUNT_TYPES[Math.floor(rng() * ACCOUNT_TYPES.length)],
        createdAt: new Date().toISOString(),
      }));

      // Add a real transaction so EDIT_TRANSACTION has something to match id-wise
      const realAccountId = accounts[0].id;
      const existingTransaction = {
        id: `txn-p12-${i}`,
        accountId: realAccountId,
        amount: 100,
        date: '2024-03-01',
        description: 'existing tx',
        categoryId: null,
        recurringRuleId: null,
        createdAt: new Date().toISOString(),
      };

      const state: AppState = {
        ...INITIAL_STATE,
        accounts,
        transactions: [existingTransaction],
      };

      // accountId that definitely does NOT exist in state.accounts
      const nonExistentId = `ghost-acc-edit-${i}-${Math.floor(rng() * 1e9)}`;

      // Provide all required fields for TransactionSchema but with bad accountId
      const payload = {
        id: existingTransaction.id,
        accountId: nonExistentId,
        amount: parseFloat((rng() * 2000 - 500).toFixed(2)),
        date: p12RandomDate(rng),
        description: `edited-p12-${i}`,
        categoryId: null,
        recurringRuleId: null,
        createdAt: existingTransaction.createdAt,
      };

      const nextState = ledgerReducer(state, {
        type: 'EDIT_TRANSACTION',
        payload,
      });

      // Must be the exact same reference — state unchanged
      expect(nextState).toBe(state);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 6: Recurring rule expansion is idempotent
// Validates: Requirements 5.3
// ---------------------------------------------------------------------------