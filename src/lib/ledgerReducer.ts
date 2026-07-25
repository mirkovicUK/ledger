import { AccountSchema, TransactionSchema, CategorySchema, BudgetSchema, RecurringRuleSchema, AppStateSchema } from './types.js';
import { generateId } from './id.js';
import { expandAllRules } from './recurring.js';
import type { AppState } from './types.js';

export const INITIAL_STATE: AppState = {
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  recurringRules: [],
};

export interface LedgerAction {
  type: string;
  payload?: unknown;
}

export function ledgerReducer(state: AppState, action: LedgerAction): AppState {
  switch (action.type) {
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
      const { id } = action.payload as { id: string };
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== id),
        transactions: state.transactions.filter((t) => t.accountId !== id),
      };
    }

    case 'CREATE_TRANSACTION': {
      try {
        if (!action.payload || typeof action.payload !== 'object' || !('accountId' in action.payload)) return state;
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
        if (!action.payload || typeof action.payload !== 'object' || !('accountId' in action.payload)) return state;
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
      const { id } = action.payload as { id: string };
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== id),
      };
    }

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
      const { id } = action.payload as { id: string };
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== id),
      };
    }

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
      const { id } = action.payload as { id: string };
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.id !== id),
      };
    }

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
      const { id } = action.payload as { id: string };
      return {
        ...state,
        recurringRules: state.recurringRules.filter((r) => r.id !== id),
      };
    }

    case 'EXPAND_RECURRING_RULES': {
      const { referenceDate, idGenerator = generateId } = action.payload as { referenceDate: string, idGenerator?: () => string };
      const { transactions, updatedRules } = expandAllRules(
        state.recurringRules,
        state.transactions,
        referenceDate,
        idGenerator
      );
      return { ...state, transactions, recurringRules: updatedRules };
    }

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

    default:
      return state;
  }
}