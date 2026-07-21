import {
  AccountSchema,
  TransactionSchema,
  CategorySchema,
  BudgetSchema,
  RecurringRuleSchema,
  AppStateSchema,
} from './types.js';
import { generateId } from './id.js';
import { expandAllRules } from './recurring.js';

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

export const INITIAL_STATE = {
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  recurringRules: [],
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

/**
 * Pure state reducer for the Ledger app.
 *
 * On any validation failure (zod throws), returns state unchanged.
 *
 * @param {import('./types.js').AppState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {import('./types.js').AppState}
 */
export function ledgerReducer(state, action) {
  switch (action.type) {
    // -----------------------------------------------------------------------
    // Account actions
    // -----------------------------------------------------------------------

    case 'CREATE_ACCOUNT': {
      try {
        const account = AccountSchema.parse({
          id: generateId(),
          createdAt: new Date().toISOString(),
          ...action.payload,
        });
        return { ...state, accounts: [...state.accounts, account] };
      } catch {
        return state;
      }
    }

    case 'EDIT_ACCOUNT': {
      try {
        const account = AccountSchema.parse(action.payload);
        return {
          ...state,
          accounts: state.accounts.map((a) => (a.id === account.id ? account : a)),
        };
      } catch {
        return state;
      }
    }

    case 'DELETE_ACCOUNT': {
      const { id } = action.payload;
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== id),
        // Cascade: remove all transactions belonging to this account
        transactions: state.transactions.filter((t) => t.accountId !== id),
      };
    }

    // -----------------------------------------------------------------------
    // Transaction actions
    // -----------------------------------------------------------------------

    case 'CREATE_TRANSACTION': {
      try {
        // Referential integrity: accountId must exist
        const accountExists = state.accounts.some((a) => a.id === action.payload.accountId);
        if (!accountExists) return state;

        const transaction = TransactionSchema.parse({
          id: generateId(),
          createdAt: new Date().toISOString(),
          ...action.payload,
        });
        return { ...state, transactions: [...state.transactions, transaction] };
      } catch {
        return state;
      }
    }

    case 'EDIT_TRANSACTION': {
      try {
        // Referential integrity: accountId must exist
        const accountExists = state.accounts.some((a) => a.id === action.payload.accountId);
        if (!accountExists) return state;

        const transaction = TransactionSchema.parse(action.payload);
        return {
          ...state,
          transactions: state.transactions.map((t) =>
            t.id === transaction.id ? transaction : t
          ),
        };
      } catch {
        return state;
      }
    }

    case 'DELETE_TRANSACTION': {
      const { id } = action.payload;
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== id),
      };
    }

    // -----------------------------------------------------------------------
    // Category actions
    // -----------------------------------------------------------------------

    case 'CREATE_CATEGORY': {
      try {
        const category = CategorySchema.parse({
          id: generateId(),
          ...action.payload,
        });
        return { ...state, categories: [...state.categories, category] };
      } catch {
        return state;
      }
    }

    case 'DELETE_CATEGORY': {
      const { id } = action.payload;
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== id),
      };
    }

    // -----------------------------------------------------------------------
    // Budget actions
    // -----------------------------------------------------------------------

    case 'CREATE_BUDGET': {
      try {
        const budget = BudgetSchema.parse({
          id: generateId(),
          ...action.payload,
        });
        return { ...state, budgets: [...state.budgets, budget] };
      } catch {
        return state;
      }
    }

    case 'EDIT_BUDGET': {
      try {
        const budget = BudgetSchema.parse(action.payload);
        return {
          ...state,
          budgets: state.budgets.map((b) => (b.id === budget.id ? budget : b)),
        };
      } catch {
        return state;
      }
    }

    case 'DELETE_BUDGET': {
      const { id } = action.payload;
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== id),
      };
    }

    // -----------------------------------------------------------------------
    // Recurring rule actions
    // -----------------------------------------------------------------------

    case 'CREATE_RECURRING_RULE': {
      try {
        const rule = RecurringRuleSchema.parse({
          id: generateId(),
          lastExpandedDate: null,
          ...action.payload,
        });
        return { ...state, recurringRules: [...state.recurringRules, rule] };
      } catch {
        return state;
      }
    }

    case 'EDIT_RECURRING_RULE': {
      try {
        const rule = RecurringRuleSchema.parse(action.payload);
        return {
          ...state,
          recurringRules: state.recurringRules.map((r) => (r.id === rule.id ? rule : r)),
        };
      } catch {
        return state;
      }
    }

    case 'DELETE_RECURRING_RULE': {
      // Per req 5.5: deleting a rule keeps existing generated transactions
      const { id } = action.payload;
      return {
        ...state,
        recurringRules: state.recurringRules.filter((r) => r.id !== id),
      };
    }

    // -----------------------------------------------------------------------
    // Recurring rule expansion
    // -----------------------------------------------------------------------

    case 'EXPAND_RECURRING_RULES': {
      const { referenceDate, idGenerator = generateId } = action.payload;
      const { transactions, updatedRules } = expandAllRules(
        state.recurringRules,
        state.transactions,
        referenceDate,
        idGenerator
      );
      return { ...state, transactions, recurringRules: updatedRules };
    }

    // -----------------------------------------------------------------------
    // Import / Reset
    // -----------------------------------------------------------------------

    case 'IMPORT_STATE': {
      try {
        const newState = AppStateSchema.parse(action.payload);
        return newState;
      } catch {
        return state;
      }
    }

    case 'RESET_STATE': {
      return INITIAL_STATE;
    }

    // -----------------------------------------------------------------------
    // Default
    // -----------------------------------------------------------------------

    default:
      return state;
  }
}
