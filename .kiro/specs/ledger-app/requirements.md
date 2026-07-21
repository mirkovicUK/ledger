# Requirements Document

## Introduction

The Ledger App is a local-first personal finance single-page application built with React 18 and Vite. It enables users to manage multiple financial accounts, track transactions with optional categorization, set budgets with visual progress indicators, define recurring transaction rules, and back up or restore data via JSON export/import. All data persists locally in IndexedDB with no backend dependency.

## Glossary

- **Ledger_App**: The single-page application serving as the personal finance management tool
- **Account**: A financial account entity (e.g., Checking, Savings, Credit Card) that groups transactions
- **Transaction**: A financial record associated with an Account, containing amount, date, description, and optional category
- **Category**: An optional label assigned to a Transaction for classification purposes
- **Budget**: A spending limit defined for a specific Category over a defined time period
- **Recurring_Rule**: A rule that defines a transaction template and a recurrence schedule for automatic expansion into Transactions
- **Dashboard**: The overview page displaying summaries of account balances, recent transactions, and budget progress
- **Data_Store**: The IndexedDB-based local persistence layer using idb-keyval
- **Export_Payload**: A JSON document containing the full serialized state of all Accounts, Transactions, Categories, Budgets, and Recurring_Rules

## Requirements

### Requirement 1: Account Management

**User Story:** As a user, I want to create and manage multiple financial accounts, so that I can organize my transactions by account type.

#### Acceptance Criteria

1. THE Ledger_App SHALL allow users to create an Account with a name and account type
2. THE Ledger_App SHALL display a list of all Accounts with their current balances
3. WHEN a user edits an Account name or type, THE Ledger_App SHALL persist the updated Account to the Data_Store
4. WHEN a user deletes an Account, THE Ledger_App SHALL remove the Account and all associated Transactions from the Data_Store
5. THE Ledger_App SHALL assign a unique identifier to each Account using nanoid

### Requirement 2: Transaction Management

**User Story:** As a user, I want to add, edit, and delete transactions within my accounts, so that I can track my income and expenses.

#### Acceptance Criteria

1. WHEN a user creates a Transaction, THE Ledger_App SHALL require an amount, date, description, and Account reference
2. THE Ledger_App SHALL allow a Transaction to exist without a Category assignment
3. WHEN a user edits a Transaction, THE Ledger_App SHALL validate the updated fields using zod schemas and persist changes to the Data_Store
4. WHEN a user deletes a Transaction, THE Ledger_App SHALL remove the Transaction from the Data_Store
5. THE Ledger_App SHALL assign a unique identifier to each Transaction using nanoid
6. THE Ledger_App SHALL store the Transaction date in ISO 8601 format using date-fns for formatting and parsing

### Requirement 3: Category Assignment

**User Story:** As a user, I want to optionally assign categories to transactions, so that I can classify my spending when convenient.

#### Acceptance Criteria

1. THE Ledger_App SHALL allow users to create named Categories
2. WHEN a user assigns a Category to a Transaction, THE Ledger_App SHALL update the Transaction record in the Data_Store
3. THE Ledger_App SHALL allow a Category assignment to be removed from a Transaction, returning the Transaction to uncategorized status
4. WHEN displaying summaries that group by Category, THE Ledger_App SHALL include an "Uncategorized" group for Transactions without a Category

### Requirement 4: Budget Tracking

**User Story:** As a user, I want to set budgets for spending categories and see visual progress, so that I can monitor my spending habits.

#### Acceptance Criteria

1. THE Ledger_App SHALL allow users to create a Budget with a Category reference, a spending limit amount, and a time period
2. WHEN displaying a Budget, THE Ledger_App SHALL show a visual progress bar indicating the ratio of actual spending to the budget limit
3. WHEN actual spending for a Budget exceeds the defined limit, THE Ledger_App SHALL visually indicate the overspend state on the progress bar
4. THE Ledger_App SHALL calculate Budget spending totals from Transactions matching the Budget Category within the Budget time period
5. WHEN a Budget references a Category with no matching Transactions, THE Ledger_App SHALL display zero spending against the budget limit

### Requirement 5: Recurring Transaction Rules

**User Story:** As a user, I want to define recurring transaction rules, so that predictable income and expenses are automatically generated.

#### Acceptance Criteria

1. THE Ledger_App SHALL allow users to create a Recurring_Rule with a transaction template (amount, description, Account, optional Category) and a recurrence schedule (frequency, start date)
2. WHEN the Ledger_App loads or when a Recurring_Rule is created, THE Ledger_App SHALL expand the Recurring_Rule into individual Transactions up to the current date
3. THE Ledger_App SHALL not create duplicate Transactions for a Recurring_Rule that has already been expanded for a given date
4. WHEN a user edits a Recurring_Rule, THE Ledger_App SHALL apply changes to future expansions only
5. WHEN a user deletes a Recurring_Rule, THE Ledger_App SHALL remove the rule but retain previously expanded Transactions

### Requirement 6: Filtering and Sorting

**User Story:** As a user, I want to filter and sort my transactions, so that I can find specific records and analyze spending patterns.

#### Acceptance Criteria

1. THE Ledger_App SHALL allow users to filter Transactions by Account, Category, date range, and amount range
2. THE Ledger_App SHALL allow users to sort Transactions by date, amount, or description in ascending or descending order
3. WHEN multiple filters are applied simultaneously, THE Ledger_App SHALL combine filters using AND logic
4. WHEN no Transactions match the applied filters, THE Ledger_App SHALL display an empty state message

### Requirement 7: Dashboard Overview

**User Story:** As a user, I want a dashboard that summarizes my financial state, so that I can quickly understand my overall position.

#### Acceptance Criteria

1. THE Dashboard SHALL display the total balance across all Accounts
2. THE Dashboard SHALL display individual Account balances
3. THE Dashboard SHALL display a summary of recent Transactions
4. THE Dashboard SHALL display active Budget progress bars
5. WHEN there are no Accounts or Transactions, THE Dashboard SHALL display an onboarding prompt

### Requirement 8: JSON Export and Import

**User Story:** As a user, I want to export and import my data as JSON, so that I can back up and restore my financial records.

#### Acceptance Criteria

1. WHEN a user triggers an export, THE Ledger_App SHALL serialize all Accounts, Transactions, Categories, Budgets, and Recurring_Rules into a single Export_Payload JSON document
2. THE Ledger_App SHALL offer the Export_Payload as a downloadable file
3. WHEN a user imports an Export_Payload, THE Ledger_App SHALL validate the JSON structure using zod schemas before processing
4. IF the imported JSON fails validation, THEN THE Ledger_App SHALL display a descriptive error message and reject the import
5. WHEN a valid Export_Payload is imported, THE Ledger_App SHALL replace the current Data_Store contents with the imported data
6. THE Ledger_App SHALL produce an Export_Payload that roundtrips cleanly back into the application without data loss

### Requirement 9: Local Data Persistence

**User Story:** As a user, I want my data to persist locally without a backend, so that I can use the app offline and maintain privacy.

#### Acceptance Criteria

1. THE Ledger_App SHALL persist all application state to IndexedDB using idb-keyval
2. WHEN the Ledger_App loads, THE Ledger_App SHALL restore all persisted state from the Data_Store
3. WHEN any data mutation occurs, THE Ledger_App SHALL write the updated state to the Data_Store
4. IF the Data_Store is unavailable or corrupted, THEN THE Ledger_App SHALL display an error message and allow the user to reset to an empty state

### Requirement 10: Data Validation

**User Story:** As a user, I want my data to be validated, so that corrupted or invalid records do not enter the system.

#### Acceptance Criteria

1. THE Ledger_App SHALL validate all user input against zod schemas before persisting to the Data_Store
2. IF validation fails on user input, THEN THE Ledger_App SHALL display field-level error messages indicating the validation failure
3. THE Ledger_App SHALL validate that Transaction amount is a numeric value
4. THE Ledger_App SHALL validate that Transaction date conforms to ISO 8601 format
5. THE Ledger_App SHALL validate that Account references in Transactions correspond to existing Accounts
