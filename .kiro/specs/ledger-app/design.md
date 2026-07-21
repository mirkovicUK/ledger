# Design Document

## Overview

This document defines the architecture for the Ledger App — a local-first personal finance SPA built with React 18, Vite, and IndexedDB. The system is organized around pure domain logic in `src/lib/`, React state management via `useReducer` + context, and a persistence layer backed by `idb-keyval`. All business logic is isolated from rendering so it can be tested with Jest without DOM dependencies.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React UI Layer                     │
│  pages/ (Dashboard, Transactions, Budgets)          │
│  components/ (TransactionList, BudgetBar, etc.)     │
├─────────────────────────────────────────────────────┤
│              Hooks Layer (State Bridge)              │
│  useLedger.js    useBudgets.js                      │
│  useReducer + Context + memoized selectors          │
├─────────────────────────────────────────────────────┤
│            Pure Domain Logic (src/lib/)              │
│  ledgerReducer.js  money.js  budget.js              │
│  recurring.js  filter.js  sort.js  types.js         │
│  categories.js  date.js  id.js  storage.js          │
├─────────────────────────────────────────────────────┤
│            Persistence Layer (idb-keyval)            │
│  storage.js → IndexedDB                             │
└─────────────────────────────────────────────────────┘
```

Data flows downward: UI dispatches actions → reducer produces new state → hooks persist to IndexedDB → UI re-renders from new state.

## Data Models

All schemas are defined using `zod` in `src/lib/types.js`. IDs are generated via `nanoid` in `src/lib/id.js`.

### Account Schema

```javascript
import { z } from 'zod';

export const AccountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.enum(['checking', 'savings', 'credit', 'cash', 'investment']),
  createdAt: z.string().datetime(),
});
```

### Transaction Schema

```javascript
export const TransactionSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  amount: z.number().finite(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO 8601 date portion
  description: z.string().min(1).max(200),
  categoryId: z.string().nullable().optional(),
  recurringRuleId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});
```

### Category Schema

```javascript
export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
});
```

### Budget Schema

```javascript
export const BudgetSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  limit: z.number().positive().finite(),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
```

### RecurringRule Schema

```javascript
export const RecurringRuleSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  amount: z.number().finite(),
  description: z.string().min(1).max(200),
  categoryId: z.string().nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lastExpandedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
```

### Application State Shape

```javascript
export const AppStateSchema = z.object({
  accounts: z.array(AccountSchema),
  transactions: z.array(TransactionSchema),
  categories: z.array(CategorySchema),
  budgets: z.array(BudgetSchema),
  recurringRules: z.array(RecurringRuleSchema),
});
```

### Export Payload Schema

```javascript
export const ExportPayloadSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  data: AppStateSchema,
});
```

## Components and Interfaces

### src/lib/money.js — Money Value Object & Math

Handles arithmetic on numeric amounts. All amounts are stored as JavaScript numbers (cents are not used; the app is personal-finance scale).

```javascript
/** Sum an array of transaction amounts */
export function sumAmounts(transactions) { /* ... */ }

/** Compute balance for a specific account */
export function accountBalance(transactions, accountId) { /* ... */ }

/** Compute total balance across all accounts */
export function totalBalance(transactions) { /* ... */ }

/** Compute budget spending ratio */
export function budgetRatio(spent, limit) { /* ... */ }
```

### src/lib/id.js — ID Generation

```javascript
import { nanoid } from 'nanoid';

export function generateId() {
  return nanoid();
}
```

### src/lib/date.js — Date Utilities

Wraps `date-fns` for consistent date handling.

```javascript
import { parseISO, format, isValid, addDays, addWeeks, addMonths, addYears,
         isAfter, isBefore, isEqual, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

/** Parse ISO date string to Date object */
export function parseDate(isoString) { /* ... */ }

/** Format Date to ISO 8601 date string (YYYY-MM-DD) */
export function formatDate(date) { /* ... */ }

/** Check if a date falls within a range [start, end] inclusive */
export function isWithinRange(date, start, end) { /* ... */ }

/** Advance a date by a frequency step */
export function advanceByFrequency(date, frequency) { /* ... */ }

/** Get the start of a budget period containing a reference date */
export function periodStart(referenceDate, period) { /* ... */ }

/** Get the end of a budget period containing a reference date */
export function periodEnd(referenceDate, period) { /* ... */ }
```

### src/lib/categories.js — Category Grouping

```javascript
/**
 * Group transactions by categoryId.
 * Transactions with null/undefined categoryId go into the 'uncategorized' group.
 * Returns Map<string | 'uncategorized', Transaction[]>
 */
export function groupByCategory(transactions) { /* ... */ }
```

### src/lib/budget.js — Budget Math

```javascript
/**
 * Compute spending for a budget: sum of transaction amounts matching
 * the budget's categoryId within the budget's current period.
 */
export function computeBudgetSpending(budget, transactions, referenceDate) { /* ... */ }

/**
 * Determine if a budget is overspent.
 */
export function isOverspent(spent, limit) { /* ... */ }

/**
 * Compute the progress ratio (spent / limit), clamped to [0, Infinity).
 */
export function progressRatio(spent, limit) { /* ... */ }
```

### src/lib/recurring.js — Recurring Rule Expansion

```javascript
/**
 * Expand a recurring rule into transactions from its lastExpandedDate
 * (or startDate if never expanded) up to referenceDate.
 * Returns { transactions: Transaction[], updatedRule: RecurringRule }
 */
export function expandRule(rule, referenceDate, idGenerator) { /* ... */ }

/**
 * Expand all rules, skipping dates already covered.
 * Idempotent: calling twice with same referenceDate produces no new transactions.
 */
export function expandAllRules(rules, existingTransactions, referenceDate, idGenerator) { /* ... */ }
```

### src/lib/filter.js — Transaction Filtering

```javascript
/**
 * @typedef {Object} FilterCriteria
 * @property {string|null} accountId
 * @property {string|null} categoryId
 * @property {{ from: string, to: string }|null} dateRange
 * @property {{ min: number, max: number }|null} amountRange
 */

/**
 * Apply all non-null filter criteria using AND logic.
 * Returns filtered array of transactions.
 */
export function applyFilters(transactions, criteria) { /* ... */ }
```

### src/lib/sort.js — Transaction Sorting

```javascript
/**
 * @typedef {Object} SortConfig
 * @property {'date'|'amount'|'description'} field
 * @property {'asc'|'desc'} direction
 */

/**
 * Sort transactions by the given config.
 * Returns a new sorted array (does not mutate input).
 */
export function sortTransactions(transactions, config) { /* ... */ }
```

### src/lib/ledgerReducer.js — Pure State Reducer

The central state machine. All mutations pass through here.

```javascript
/**
 * Action types:
 * - CREATE_ACCOUNT, EDIT_ACCOUNT, DELETE_ACCOUNT
 * - CREATE_TRANSACTION, EDIT_TRANSACTION, DELETE_TRANSACTION
 * - CREATE_CATEGORY, DELETE_CATEGORY
 * - CREATE_BUDGET, EDIT_BUDGET, DELETE_BUDGET
 * - CREATE_RECURRING_RULE, EDIT_RECURRING_RULE, DELETE_RECURRING_RULE
 * - EXPAND_RECURRING_RULES
 * - IMPORT_STATE
 * - RESET_STATE
 */
export function ledgerReducer(state, action) {
  switch (action.type) {
    case 'CREATE_ACCOUNT': { /* validate, generate ID, append */ }
    case 'DELETE_ACCOUNT': { /* remove account + cascade delete transactions */ }
    case 'CREATE_TRANSACTION': { /* validate accountId exists, validate schema, append */ }
    case 'EXPAND_RECURRING_RULES': { /* call expandAllRules, merge new transactions, update rules */ }
    case 'IMPORT_STATE': { /* validate payload, replace state */ }
    case 'RESET_STATE': { /* return initial empty state */ }
    // ... other cases
    default:
      return state;
  }
}

export const INITIAL_STATE = {
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  recurringRules: [],
};
```

**Referential integrity:** `CREATE_TRANSACTION` and `EDIT_TRANSACTION` check that `action.payload.accountId` exists in `state.accounts`. If not, the action is rejected (state unchanged) and an error is surfaced.

**Cascade delete:** `DELETE_ACCOUNT` removes the account AND all transactions where `t.accountId === action.payload.id`.

### src/lib/storage.js — Persistence Layer

```javascript
import { get, set, del } from 'idb-keyval';

const STATE_KEY = 'ledger-app-state';

/** Persist full app state */
export async function saveState(state) {
  await set(STATE_KEY, JSON.parse(JSON.stringify(state)));
}

/** Load persisted state, returns null if missing/corrupted */
export async function loadState() {
  try {
    const raw = await get(STATE_KEY);
    if (!raw) return null;
    // validate with AppStateSchema
    return AppStateSchema.parse(raw);
  } catch {
    return null;
  }
}

/** Clear all persisted data */
export async function clearState() {
  await del(STATE_KEY);
}
```

### Export / Import (in storage.js)

```javascript
/**
 * Serialize state into ExportPayload JSON string.
 */
export function exportToJSON(state) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Parse and validate an import payload.
 * Returns { success: true, data: AppState } | { success: false, error: string }
 */
export function importFromJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = ExportPayloadSchema.parse(parsed);
    return { success: true, data: validated.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
```

## React State Management

### src/hooks/useLedger.js

Wraps `useReducer` with `ledgerReducer`, provides memoized selectors, and handles persistence side effects.

```javascript
import { useReducer, useEffect, useCallback, useMemo, createContext } from 'react';
import { ledgerReducer, INITIAL_STATE } from '../lib/ledgerReducer.js';
import { saveState, loadState } from '../lib/storage.js';
import { expandAllRules } from '../lib/recurring.js';
import { generateId } from '../lib/id.js';

export const LedgerContext = createContext(null);

export function useLedger() {
  const [state, dispatch] = useReducer(ledgerReducer, INITIAL_STATE);

  // Load persisted state on mount
  useEffect(() => { /* loadState → dispatch IMPORT_STATE */ }, []);

  // Persist on every state change
  useEffect(() => { saveState(state); }, [state]);

  // Expand recurring rules on mount and rule changes
  useEffect(() => {
    dispatch({
      type: 'EXPAND_RECURRING_RULES',
      payload: { referenceDate: new Date().toISOString().slice(0, 10), idGenerator: generateId },
    });
  }, [state.recurringRules]);

  // Memoized selectors
  const totalBalance = useMemo(() => /* ... */, [state.transactions]);
  const accountBalances = useMemo(() => /* ... */, [state.accounts, state.transactions]);

  return { state, dispatch, totalBalance, accountBalances };
}
```

### src/hooks/useBudgets.js

Computes budget progress data from state.

```javascript
import { useMemo } from 'react';
import { computeBudgetSpending, progressRatio, isOverspent } from '../lib/budget.js';

export function useBudgets(state) {
  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return state.budgets.map(budget => {
      const spent = computeBudgetSpending(budget, state.transactions, today);
      return {
        ...budget,
        spent,
        ratio: progressRatio(spent, budget.limit),
        overspent: isOverspent(spent, budget.limit),
      };
    });
  }, [state.budgets, state.transactions]);
}
```

## Component Architecture

### Page Components

| Component | Route | Description |
|-----------|-------|-------------|
| `Dashboard.jsx` | `/` | Overview with balances, recent transactions, budget bars |
| `Transactions.jsx` | `/transactions` | Full transaction list with filter/sort controls |
| `Budgets.jsx` | `/budgets` | Budget management (lazy-loaded via `React.lazy`) |

### UI Components

| Component | Props | Responsibility |
|-----------|-------|----------------|
| `TransactionList` | `transactions, onEdit, onDelete` | Renders list of `TransactionRow` |
| `TransactionRow` | `transaction, onEdit, onDelete` | Single transaction display |
| `AddTransaction` | `accounts, categories, onSubmit` | Form for creating/editing transactions |
| `CategoryPicker` | `categories, value, onChange` | Dropdown for category selection |
| `BudgetBar` | `budget, spent, ratio, overspent` | Visual progress bar |
| `FilterBar` | `accounts, categories, filters, onChange` | Filter/sort controls |
| `Summary` | `totalBalance, accountBalances` | Balance summary cards |

### Component Tree

```
App
├── LedgerContext.Provider (useLedger)
│   ├── Dashboard
│   │   ├── Summary
│   │   ├── TransactionList (recent, limit 5)
│   │   └── BudgetBar[] (active budgets)
│   ├── Transactions
│   │   ├── FilterBar
│   │   ├── AddTransaction
│   │   └── TransactionList (filtered + sorted)
│   └── Budgets (lazy)
│       ├── BudgetBar[]
│       └── Budget create/edit form
```

## Error Handling

1. **Validation errors**: `ledgerReducer` validates via zod schemas. On failure, the reducer returns state unchanged. The hook layer detects no state change and surfaces a validation error object to the UI.

2. **Storage errors**: `loadState` returns `null` on corruption/unavailability. The app starts with `INITIAL_STATE` and displays an error banner offering a reset action.

3. **Import errors**: `importFromJSON` returns `{ success: false, error }`. The UI displays the error message and does not modify state.

4. **Referential integrity**: The reducer checks that `accountId` references exist before creating/editing transactions. Missing references cause the action to be rejected.

## Testing Strategy

Testing targets the pure domain logic in `src/lib/` exclusively. No DOM rendering or React component tests.

**Unit tests** (example-based, in `test/`):
- `money.test.js` — specific balance calculations, edge cases (empty arrays, single transaction)
- `budget.test.js` — known budget scenarios, zero-transaction edge case
- `recurring.test.js` — specific expansion scenarios, rule deletion retains transactions
- `filter.test.js` — individual filter criteria, empty result case
- `ledgerReducer.test.js` — specific action dispatches, error cases, cascade delete

**Property tests** (randomized, minimum 100 iterations each):
- Round-trip serialization (export → import)
- Filter invariants (all results match criteria)
- Sort ordering invariants
- Budget math correctness
- Recurring expansion idempotence
- Referential integrity enforcement

**Test runner:** Jest with ES module support via `jest.config.js` transform. No DOM dependencies — all tested modules are pure functions.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Account balance equals sum of transaction amounts

*For any* account and *for any* set of transactions, the computed balance for that account equals the sum of amounts of all transactions whose `accountId` matches the account's `id`.

**Validates: Requirements 1.2, 7.1, 7.2**

### Property 2: Cascade delete removes account and all associated transactions

*For any* application state containing an account with associated transactions, dispatching a DELETE_ACCOUNT action for that account results in a state where the account is absent AND no transaction references the deleted account's ID.

**Validates: Requirements 1.4**

### Property 3: Budget spending equals sum of matching transactions in period

*For any* budget definition (with a categoryId, limit, and period) and *for any* set of transactions, the computed budget spending equals the sum of amounts of transactions whose `categoryId` matches the budget's `categoryId` AND whose `date` falls within the budget's current time period.

**Validates: Requirements 4.4, 4.5**

### Property 4: Overspend flag activates when spending exceeds limit

*For any* budget where the computed spending amount is strictly greater than the budget limit, the overspend indicator is `true`. *For any* budget where spending is less than or equal to the limit, the overspend indicator is `false`.

**Validates: Requirements 4.3**

### Property 5: Recurring rule expansion generates correct transaction dates

*For any* recurring rule with a start date and frequency, expansion up to a reference date produces transactions at each recurrence point between the start date (or last expanded date) and the reference date, inclusive of start, exclusive of dates beyond reference.

**Validates: Requirements 5.2**

### Property 6: Recurring rule expansion is idempotent

*For any* recurring rule and reference date, expanding the rule twice with the same reference date produces the same set of transactions as expanding it once — no duplicates are created.

**Validates: Requirements 5.3**

### Property 7: Editing a recurring rule preserves past expansions

*For any* recurring rule that has previously expanded transactions, editing the rule's template fields (amount, description, category) does not modify any transaction that was already generated before the edit.

**Validates: Requirements 5.4**

### Property 8: Filter results satisfy all applied criteria

*For any* list of transactions and *for any* combination of filter criteria (account, category, date range, amount range), every transaction in the filtered result satisfies ALL non-null criteria simultaneously (AND logic).

**Validates: Requirements 6.1, 6.3**

### Property 9: Sort results are correctly ordered

*For any* list of transactions and *for any* sort configuration (field + direction), every adjacent pair (t[i], t[i+1]) in the sorted result satisfies the ordering constraint: `t[i][field] <= t[i+1][field]` for ascending, or `t[i][field] >= t[i+1][field]` for descending.

**Validates: Requirements 6.2**

### Property 10: Export/import roundtrip preserves all data

*For any* valid application state, exporting to JSON and then importing that JSON produces a state that is deeply equal to the original state (all accounts, transactions, categories, budgets, and recurring rules are preserved without loss).

**Validates: Requirements 8.6**

### Property 11: Schema validation rejects invalid input

*For any* input object that violates the schema constraints (missing required fields, wrong types, out-of-range values), the validation function returns a failure result and the application state remains unchanged.

**Validates: Requirements 2.1, 10.1, 10.3, 10.4**

### Property 12: Referential integrity for account references

*For any* transaction creation or edit action where the provided `accountId` does not correspond to an existing account in the current state, the reducer rejects the action and returns the state unchanged.

**Validates: Requirements 10.5**

### Property 13: Category grouping includes uncategorized bucket

*For any* list of transactions containing at least one transaction with a null or undefined `categoryId`, the `groupByCategory` function produces a result that includes an "uncategorized" key whose value contains exactly those transactions.

**Validates: Requirements 3.4**
