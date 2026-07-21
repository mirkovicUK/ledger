# Ledger App

A local-first personal finance SPA built with **React 18 + Vite**. All data lives in the browser's IndexedDB — no backend, no account required.

## Features

- **Accounts** — create and manage checking, savings, credit, cash, or investment accounts
- **Transactions** — add, edit, and delete transactions with optional category tagging
- **Budgets** — set spending limits per category and period, with visual progress bars
- **Recurring rules** — define repeating income/expenses that auto-expand on load
- **Filter & sort** — filter transactions by account, category, date range, or amount; sort by any field
- **Export / Import** — back up the full data set as a JSON file and restore it later
- **Offline-first** — all state persists to IndexedDB via `idb-keyval`

## Tech Stack

| Tool | Role |
|---|---|
| React 18 | UI layer with `useReducer` + Context for state |
| Vite 5 | Dev server and production bundler |
| Zod | Runtime schema validation |
| date-fns | Date arithmetic and formatting |
| nanoid | Unique ID generation |
| idb-keyval | IndexedDB persistence |
| Jest 29 | Unit and property-based test runner |
| Babel | Transpiles source for Jest (Node environment) |

## Two Separate Tools: Vite vs Jest

This project uses **both Vite and Jest** — they serve entirely different purposes and never conflict.

### Vite (`vite.config.js`)

Vite handles everything related to the **browser app**:

- `npm run dev` — starts a fast HMR dev server at `localhost:5173`
- `npm run build` — bundles the React app for production (`dist/`)
- `npm run preview` — serves the production build locally

Vite reads `.jsx` files, processes CSS Modules, lazy-loads the Budgets page as a separate chunk, and outputs optimised assets. It knows nothing about tests.

### Jest + Babel (`jest.config.js`, `babel.config.cjs`)

Jest handles the **automated tests**, which run in **Node.js** — not in a browser:

- `npm test` — runs all tests in `test/`
- Tests only import pure domain logic from `src/lib/` (no DOM, no React hooks)
- Babel transpiles the ES module source so Node can execute it
- The `transformIgnorePatterns` entry tells Jest to also transpile `nanoid`, which ships as pure ESM

### Why not use Vite's test runner (Vitest)?

Vitest would be a natural fit since it reuses the Vite config. This project uses Jest instead because the spec called for Jest explicitly. The trade-off is the extra Babel config, but the tests themselves are identical either way.

### Is this TypeScript?

No. Every file is plain JavaScript (`.js` / `.jsx`). There is no `tsconfig.json` and no TypeScript compiler. The `vite.config.js` and `jest.config.js` extensions are `.js` simply because the whole project is JS.

## Project Structure

```
ledger-app/
├── src/
│   ├── lib/           # Pure domain logic (no React)
│   │   ├── types.js       # Zod schemas and validation helpers
│   │   ├── ledgerReducer.js  # Central state machine
│   │   ├── money.js       # Balance calculations
│   │   ├── budget.js      # Budget spending computation
│   │   ├── recurring.js   # Recurring rule expansion
│   │   ├── filter.js      # Transaction filtering (AND logic)
│   │   ├── sort.js        # Transaction sorting
│   │   ├── categories.js  # Category grouping
│   │   ├── date.js        # date-fns wrappers
│   │   ├── id.js          # nanoid wrapper
│   │   └── storage.js     # IndexedDB + export/import
│   ├── hooks/
│   │   ├── useLedger.jsx  # Main state hook + LedgerProvider
│   │   ├── useBudgets.js  # Budget progress hook
│   │   └── useFilters.js  # Filter/sort state hook
│   ├── components/    # Reusable UI components
│   ├── pages/         # Dashboard, Transactions, Budgets
│   ├── App.jsx        # App shell: routing, nav, export/import
│   └── main.jsx       # Entry point
├── test/              # All tests (Jest, Node environment)
│   ├── money.test.js
│   ├── date.test.js
│   ├── budget.test.js
│   ├── recurring.test.js
│   ├── filter.test.js
│   ├── sort.test.js
│   ├── ledgerReducer.test.js
│   └── properties.test.js  # Property-based tests (100+ iterations each)
├── vite.config.js     # Vite: dev server + bundler
├── jest.config.js     # Jest: test runner config
├── babel.config.cjs   # Babel: transpile source for Jest/Node
└── package.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Run all tests
npm test

# Build for production
npm run build
```

## Testing Approach

Tests target only `src/lib/` — pure functions with no DOM dependencies.

**Unit tests** cover specific examples and edge cases: empty arrays, boundary dates, cascade deletes, schema validation rejections, etc.

**Property-based tests** (`test/properties.test.js`) verify universal correctness properties over 100 randomly generated inputs each:

| Property | What it checks |
|---|---|
| Account balance | `accountBalance` equals manual filter+sum |
| Cascade delete | DELETE_ACCOUNT removes all associated transactions |
| Budget spending | `computeBudgetSpending` equals manual filter+sum |
| Filter invariants | Every result satisfies ALL applied criteria (AND logic) |
| Sort ordering | Every adjacent pair satisfies the ordering constraint |
| Export/import roundtrip | Re-imported state deeply equals the original |
| Recurring idempotence | Double expansion with same date produces no new transactions |
| Referential integrity | Transactions with non-existent `accountId` leave state unchanged |

## Architecture

Data flows in one direction:

```
UI dispatches action
  → ledgerReducer produces new state
    → useLedger persists to IndexedDB
      → UI re-renders from new state
```

The reducer is a pure function — given the same state and action it always returns the same result. All business logic lives in `src/lib/` and is tested independently of React.

## Routing

Hash-based routing with no router library. Three routes:

- `#/` — Dashboard
- `#/transactions` — Transactions page
- `#/budgets` — Budgets page (lazy-loaded via `React.lazy`)
