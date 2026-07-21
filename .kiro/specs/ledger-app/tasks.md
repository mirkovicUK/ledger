# Implementation Plan: Ledger App

## Overview

A local-first personal finance SPA built with React 18 + Vite. Implementation builds from pure domain logic upward: scaffolding → types/utilities → reducer → tests → hooks → UI components → pages → app shell → final integration.

## Tasks

- [x] 1. Project scaffolding and configuration
  - [x] 1.1 Create package.json with dependencies and scripts
    - Initialize `package.json` with name `ledger-app`, type `module`
    - Add dependencies: `react`, `react-dom`, `nanoid`, `zod`, `date-fns`, `idb-keyval`
    - Add devDependencies: `vite`, `@vitejs/plugin-react`, `jest`, `@jest/globals`, `@babel/preset-env`, `@babel/preset-react`, `babel-jest`
    - Add scripts: `dev`, `build`, `preview`, `test`
    - _Requirements: 9.1_

  - [x] 1.2 Create Vite config, Babel config, Jest config, and index.html
    - Create `vite.config.js` with React plugin
    - Create `babel.config.cjs` for Jest ES module transform
    - Create `jest.config.js` with transform for `.js` files, `testMatch` pointing to `test/**/*.test.js`
    - Create `index.html` with root div and module script entry `src/main.jsx`
    - Create directory structure: `src/lib/`, `src/hooks/`, `src/components/`, `src/pages/`, `test/`
    - _Requirements: 9.1_

- [x] 2. Pure domain logic — types and utilities
  - [x] 2.1 Implement `src/lib/types.js` — Zod schemas and validation
    - Define `AccountSchema`, `TransactionSchema`, `CategorySchema`, `BudgetSchema`, `RecurringRuleSchema`
    - Define `AppStateSchema` and `ExportPayloadSchema`
    - Export validation helper functions (`validateAccount`, `validateTransaction`, etc.)
    - _Requirements: 10.1, 10.3, 10.4, 2.1_

  - [x] 2.2 Implement `src/lib/id.js` — ID generation
    - Export `generateId()` wrapping `nanoid()`
    - _Requirements: 1.5, 2.5_

  - [x] 2.3 Implement `src/lib/money.js` — Money math utilities
    - Implement `sumAmounts(transactions)`, `accountBalance(transactions, accountId)`, `totalBalance(transactions)`, `budgetRatio(spent, limit)`
    - Handle edge cases: empty arrays, zero amounts
    - _Requirements: 1.2, 7.1, 7.2_

  - [x] 2.4 Implement `src/lib/date.js` — Date utilities
    - Implement `parseDate`, `formatDate`, `isWithinRange`, `advanceByFrequency`, `periodStart`, `periodEnd`
    - Use `date-fns` for all date operations
    - Support frequencies: daily, weekly, biweekly, monthly, yearly
    - Support periods: weekly, monthly, yearly
    - _Requirements: 2.6, 4.4, 5.2_

  - [x] 2.5 Implement `src/lib/categories.js` — Category grouping
    - Implement `groupByCategory(transactions)` returning a Map with `'uncategorized'` key for null/undefined categoryIds
    - _Requirements: 3.4_

  - [x] 2.6 Implement `src/lib/budget.js` — Budget computation
    - Implement `computeBudgetSpending(budget, transactions, referenceDate)` filtering by categoryId and period
    - Implement `isOverspent(spent, limit)` and `progressRatio(spent, limit)`
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 2.7 Implement `src/lib/recurring.js` — Recurring rule expansion
    - Implement `expandRule(rule, referenceDate, idGenerator)` — generates transactions from lastExpandedDate/startDate up to referenceDate
    - Implement `expandAllRules(rules, existingTransactions, referenceDate, idGenerator)` — idempotent expansion
    - Ensure no duplicates by tracking `lastExpandedDate`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 2.8 Implement `src/lib/filter.js` — Transaction filtering
    - Implement `applyFilters(transactions, criteria)` with AND logic
    - Support filters: accountId, categoryId, dateRange (from/to), amountRange (min/max)
    - Return all transactions when all criteria are null
    - _Requirements: 6.1, 6.3_

  - [x] 2.9 Implement `src/lib/sort.js` — Transaction sorting
    - Implement `sortTransactions(transactions, config)` with field (date, amount, description) and direction (asc, desc)
    - Return new sorted array without mutating input
    - _Requirements: 6.2_

  - [x] 2.10 Implement `src/lib/ledgerReducer.js` — State reducer
    - Implement all action types: CREATE/EDIT/DELETE for Account, Transaction, Category, Budget, RecurringRule
    - Implement EXPAND_RECURRING_RULES, IMPORT_STATE, RESET_STATE
    - Enforce referential integrity: reject transactions with invalid accountId
    - Implement cascade delete: DELETE_ACCOUNT removes associated transactions
    - Validate via zod schemas on creation/edit actions
    - Export `INITIAL_STATE`
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 5.1, 5.4, 5.5, 8.5, 9.4, 10.1, 10.5_

  - [x] 2.11 Implement `src/lib/storage.js` — Persistence and export/import
    - Implement `saveState(state)`, `loadState()`, `clearState()` using idb-keyval
    - Implement `exportToJSON(state)` — serialize to ExportPayload JSON string
    - Implement `importFromJSON(jsonString)` — parse, validate, return result object
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4_

- [x] 3. Checkpoint — Verify pure logic compiles
  - Ensure all `src/lib/` modules can be imported without errors, ask the user if questions arise.

- [x] 4. Tests for pure domain logic
  - [x] 4.1 Write unit tests `test/money.test.js`
    - Test `sumAmounts` with empty array, single transaction, multiple transactions
    - Test `accountBalance` filtering by accountId
    - Test `totalBalance` across all accounts
    - _Requirements: 1.2, 7.1, 7.2_

  - [x] 4.2 Write unit tests `test/date.test.js`
    - Test `parseDate` and `formatDate` roundtrip
    - Test `isWithinRange` boundary conditions
    - Test `advanceByFrequency` for each frequency type
    - Test `periodStart` and `periodEnd` for each period
    - _Requirements: 2.6_

  - [x] 4.3 Write unit tests `test/budget.test.js`
    - Test `computeBudgetSpending` with matching/non-matching transactions
    - Test zero-transaction edge case (Requirement 4.5)
    - Test `isOverspent` and `progressRatio`
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 4.4 Write unit tests `test/recurring.test.js`
    - Test `expandRule` generates correct dates for each frequency
    - Test idempotence (double expansion produces no duplicates)
    - Test expansion from lastExpandedDate vs startDate
    - _Requirements: 5.2, 5.3_

  - [x] 4.5 Write unit tests `test/filter.test.js`
    - Test each filter criterion individually
    - Test combined AND logic with multiple filters
    - Test empty result case
    - _Requirements: 6.1, 6.3_

  - [x] 4.6 Write unit tests `test/sort.test.js`
    - Test sorting by date, amount, description
    - Test ascending and descending
    - Test that input array is not mutated
    - _Requirements: 6.2_

  - [x] 4.7 Write unit tests `test/ledgerReducer.test.js`
    - Test CREATE_ACCOUNT, EDIT_ACCOUNT, DELETE_ACCOUNT (with cascade)
    - Test CREATE_TRANSACTION with valid/invalid accountId
    - Test IMPORT_STATE and RESET_STATE
    - Test schema validation rejection
    - _Requirements: 1.1, 1.4, 2.1, 10.5_

  - [x] 4.8 Write property tests `test/properties.test.js` — Property 1: Account balance
    - **Property 1: Account balance equals sum of transaction amounts**
    - Generate random accounts and transactions, verify `accountBalance` equals manual sum
    - **Validates: Requirements 1.2, 7.1, 7.2**

  - [x] 4.9 Write property tests `test/properties.test.js` — Property 2: Cascade delete
    - **Property 2: Cascade delete removes account and all associated transactions**
    - Generate state with accounts and transactions, verify DELETE_ACCOUNT removes all references
    - **Validates: Requirements 1.4**

  - [x] 4.10 Write property tests `test/properties.test.js` — Property 3: Budget spending
    - **Property 3: Budget spending equals sum of matching transactions in period**
    - Generate budgets and transactions, verify `computeBudgetSpending` correctness
    - **Validates: Requirements 4.4, 4.5**

  - [x] 4.11 Write property tests `test/properties.test.js` — Property 8: Filter invariants
    - **Property 8: Filter results satisfy all applied criteria**
    - Generate random transactions and filter criteria, verify all results match ALL criteria
    - **Validates: Requirements 6.1, 6.3**

  - [x] 4.12 Write property tests `test/properties.test.js` — Property 9: Sort ordering
    - **Property 9: Sort results are correctly ordered**
    - Generate random transactions and sort config, verify pairwise ordering invariant
    - **Validates: Requirements 6.2**

  - [x] 4.13 Write property tests `test/properties.test.js` — Property 10: Export/import roundtrip
    - **Property 10: Export/import roundtrip preserves all data**
    - Generate random valid state, verify export → import produces deeply equal state
    - **Validates: Requirements 8.6**

  - [x] 4.14 Write property tests `test/properties.test.js` — Property 6: Recurring expansion idempotence
    - **Property 6: Recurring rule expansion is idempotent**
    - Generate random rules and reference dates, verify double expansion produces same result
    - **Validates: Requirements 5.3**

  - [x] 4.15 Write property tests `test/properties.test.js` — Property 12: Referential integrity
    - **Property 12: Referential integrity for account references**
    - Generate transaction creation with non-existent accountId, verify state unchanged
    - **Validates: Requirements 10.5**

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. React hooks layer
  - [x] 6.1 Implement `src/hooks/useLedger.js` — Main state hook with context
    - Create `LedgerContext` with `createContext`
    - Implement `useLedger` hook wrapping `useReducer(ledgerReducer, INITIAL_STATE)`
    - Load persisted state on mount via `loadState()` → dispatch `IMPORT_STATE`
    - Persist state on every change via `useEffect` calling `saveState(state)`
    - Auto-expand recurring rules on mount and when `recurringRules` change
    - Expose memoized `totalBalance` and `accountBalances` selectors
    - Implement `LedgerProvider` component wrapping children in context
    - _Requirements: 9.1, 9.2, 9.3, 5.2_

  - [x] 6.2 Implement `src/hooks/useBudgets.js` — Budget progress hook
    - Compute budget spending, ratio, and overspent flag for each budget
    - Memoize with `useMemo` keyed on budgets and transactions
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 6.3 Implement `src/hooks/useFilters.js` — Filter/sort state hook
    - Manage filter criteria and sort config as local state
    - Expose `filteredTransactions` by applying `applyFilters` then `sortTransactions`
    - Memoize results
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 7. UI components
  - [x] 7.1 Implement `src/components/Summary.jsx` and `src/components/Summary.module.css`
    - Display total balance and per-account balances
    - Handle empty state (no accounts)
    - _Requirements: 7.1, 7.2_

  - [x] 7.2 Implement `src/components/TransactionRow.jsx` and `src/components/TransactionList.jsx`
    - `TransactionRow` displays date, description, amount, category, edit/delete buttons
    - `TransactionList` renders array of transactions, shows empty state message when empty
    - Accept `onEdit` and `onDelete` callbacks
    - _Requirements: 6.4, 7.3_

  - [x] 7.3 Implement `src/components/AddTransaction.jsx`
    - Form with fields: amount, date, description, account (select), category (optional select)
    - Validate input via zod schema before dispatching
    - Display field-level error messages on validation failure
    - Support both create and edit modes
    - _Requirements: 2.1, 2.2, 2.3, 10.1, 10.2_

  - [x] 7.4 Implement `src/components/CategoryPicker.jsx`
    - Dropdown listing all categories plus an "Uncategorized" / none option
    - Allow clearing category assignment
    - _Requirements: 3.2, 3.3_

  - [x] 7.5 Implement `src/components/BudgetBar.jsx` and `src/components/BudgetBar.module.css`
    - Visual progress bar showing ratio of spent to limit
    - Visually indicate overspend state (e.g., red color, overflow indicator)
    - Display spent/limit amounts as text
    - _Requirements: 4.2, 4.3_

  - [x] 7.6 Implement `src/components/FilterBar.jsx`
    - Filter controls: account select, category select, date range inputs, amount range inputs
    - Sort controls: field select (date/amount/description), direction toggle
    - Emit filter/sort changes via `onChange` callback
    - _Requirements: 6.1, 6.2_

  - [x] 7.7 Implement `src/components/AccountForm.jsx`
    - Form for creating/editing accounts with name and type fields
    - Validate via zod schema, show field-level errors
    - _Requirements: 1.1, 1.3, 10.1, 10.2_

  - [x] 7.8 Implement `src/components/BudgetForm.jsx`
    - Form for creating/editing budgets with category select, limit amount, period select, start date
    - Validate via zod schema, show field-level errors
    - _Requirements: 4.1, 10.1_

  - [x] 7.9 Implement `src/components/RecurringRuleForm.jsx`
    - Form for creating/editing recurring rules with all template fields and frequency/start date
    - Validate via zod schema, show field-level errors
    - _Requirements: 5.1_

- [x] 8. Page components
  - [x] 8.1 Implement `src/pages/Dashboard.jsx` and `src/pages/Dashboard.module.css`
    - Display `Summary` component with total and per-account balances
    - Display recent transactions (last 5) via `TransactionList`
    - Display active budget progress bars via `BudgetBar`
    - Show onboarding prompt when no accounts or transactions exist
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.2 Implement `src/pages/Transactions.jsx` and `src/pages/Transactions.module.css`
    - Full transaction list with `FilterBar` for filtering/sorting
    - `AddTransaction` form for creating new transactions
    - Edit and delete functionality on each transaction row
    - Manage accounts list display and `AccountForm` for CRUD
    - Display empty state message when no transactions match filters
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3, 6.4_

  - [x] 8.3 Implement `src/pages/Budgets.jsx` and `src/pages/Budgets.module.css`
    - Budget list with progress bars
    - `BudgetForm` for creating/editing budgets
    - Category management section (create/delete categories)
    - Recurring rule management with `RecurringRuleForm`
    - Use `React.lazy` for code splitting
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 5.1, 5.4, 5.5_

- [x] 9. App shell and routing
  - [x] 9.1 Implement `src/App.jsx` and `src/App.css`
    - Wrap in `LedgerProvider` context
    - Simple hash-based routing (no library) between Dashboard, Transactions, Budgets
    - Navigation bar with route links
    - Suspense boundary for lazy-loaded Budgets page
    - Error banner for storage errors with reset action
    - _Requirements: 9.1, 9.4_

  - [x] 9.2 Implement `src/main.jsx` — App entry point
    - Render `App` into `#root`
    - _Requirements: 9.1_

- [x] 10. Final integration — Export/Import UI and error handling
  - [x] 10.1 Implement export/import UI in the App shell
    - Export button that triggers `exportToJSON` and creates a downloadable file
    - Import button with file input, validates JSON, shows error or replaces state
    - Confirmation dialog before import overwrites existing data
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 10.2 Add global error handling and storage failure recovery
    - Display error banner when `loadState` returns null on a populated previous session
    - Provide reset-to-empty-state button calling `clearState()` and dispatching RESET_STATE
    - _Requirements: 9.4_

- [x] 11. Final checkpoint — Ensure all tests pass and app builds
  - Ensure all tests pass, run `npm run build` to verify production build succeeds, ask the user if questions arise.

## Notes

- All tasks are mandatory
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All tests run only on pure `src/lib/` logic — no DOM testing
- Hash-based routing avoids adding a router dependency

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.2"] },
    { "id": 3, "tasks": ["2.3", "2.4", "2.5"] },
    { "id": 4, "tasks": ["2.6", "2.7", "2.8", "2.9"] },
    { "id": 5, "tasks": ["2.10"] },
    { "id": 6, "tasks": ["2.11"] },
    { "id": 7, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 8, "tasks": ["4.7", "4.8", "4.9", "4.10", "4.11", "4.12", "4.13", "4.14", "4.15"] },
    { "id": 9, "tasks": ["6.1"] },
    { "id": 10, "tasks": ["6.2", "6.3"] },
    { "id": 11, "tasks": ["7.1", "7.2", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9"] },
    { "id": 12, "tasks": ["7.3"] },
    { "id": 13, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 14, "tasks": ["9.1", "9.2"] },
    { "id": 15, "tasks": ["10.1", "10.2"] }
  ]
}
```
