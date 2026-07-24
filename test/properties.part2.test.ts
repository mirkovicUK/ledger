import { computeBudgetSpending } from '../src/lib/budget.js';
import { periodStart, periodEnd, isWithinRange } from '../src/lib/date.js';
import { applyFilters } from '../src/lib/filter.js';
import { exportToJSON, importFromJSON } from '../src/lib/storage.js';
import { sortTransactions } from '../src/lib/sort.js';
import { expandRule } from '../src/lib/recurring.js';
import { describe, it, expect } from 'vitest';
import { ledgerReducer, INITIAL_STATE } from '../src/lib/ledgerReducer.js';

function p2RandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function p2RandItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ---------------------------------------------------------------------------
// Property 3: Budget spending equals sum of matching transactions in period
// Validates: Requirements 4.4, 4.5
// ---------------------------------------------------------------------------

describe('Property 2: Cascade delete removes account and all associated transactions', () => {
  it('dispatching DELETE_ACCOUNT removes the account and all its transactions across 100 random states', () => {
    for (let iteration = 0; iteration < 100; iteration++) {
      // Build state with 1-4 accounts
      const accountCount = p2RandInt(1, 4);
      const accounts = [];
      for (let i = 0; i < accountCount; i++) {
        const types = ['checking', 'savings', 'credit', 'cash', 'investment'];
        accounts.push({
          id: `acc-p2-${iteration}-${i}`,
          name: `Account ${i}`,
          type: p2RandItem(types),
          createdAt: new Date().toISOString(),
        });
      }

      // Build 5-15 transactions assigned to random accounts
      const txnCount = p2RandInt(5, 15);
      const transactions = [];
      for (let j = 0; j < txnCount; j++) {
        const account = p2RandItem(accounts);
        transactions.push({
          id: `txn-p2-${iteration}-${j}`,
          accountId: account.id,
          amount: parseFloat((Math.random() * 1000 - 500).toFixed(2)),
          date: '2024-01-15',
          description: `Transaction ${j}`,
          categoryId: null,
          recurringRuleId: null,
          createdAt: new Date().toISOString(),
        });
      }

      const state = {
        ...INITIAL_STATE,
        accounts,
        transactions,
      };

      // Pick a random account to delete
      const targetAccount = p2RandItem(accounts);
      const targetId = targetAccount.id;

      // Dispatch DELETE_ACCOUNT
      const nextState = ledgerReducer(state, {
        type: 'DELETE_ACCOUNT',
        payload: { id: targetId },
      });

      // Condition 1: the account is absent from state.accounts
      const accountStillPresent = nextState.accounts.some((a) => a.id === targetId);
      expect(accountStillPresent).toBe(false);

      // Condition 2: no transaction references the deleted accountId
      const orphanedTxn = nextState.transactions.find((t) => t.accountId === targetId);
      expect(orphanedTxn).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Property 8: Filter results satisfy all applied criteria
// Validates: Requirements 6.1, 6.3
// ---------------------------------------------------------------------------



```