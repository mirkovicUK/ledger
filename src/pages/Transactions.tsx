import { useState } from 'react';
import { useLedger } from '../hooks/useLedger.jsx';
import { useFilters } from '../hooks/useFilters.js';
import { generateId } from '../lib/id.js';
import { FilterBar } from '../components/FilterBar.jsx';
import { AddTransaction } from '../components/AddTransaction.jsx';
import { TransactionList } from '../components/TransactionList.jsx';
import { AccountForm } from '../components/AccountForm.jsx';
import type { Account, Transaction } from '../lib/types.js';
import type { AccountFormPayload } from '../components/AccountForm.jsx';
import type { AddTransactionPayload } from '../components/AddTransaction.jsx';
import styles from './Transactions.module.css';

/**
 * Transactions page — full transaction list with filter/sort, CRUD for
 * transactions, and account management.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 6.1, 6.2, 6.3, 6.4
 */
export default function Transactions(): JSX.Element {
  const { state, dispatch } = useLedger();
  const { filters, setFilters, sortConfig, setSortConfig, filteredTransactions } =
    useFilters(state.transactions);

  // Local UI state
  const [showAddTxForm, setShowAddTxForm] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showAccountForm, setShowAccountForm] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // ── Transaction handlers ────────────────────────────────────────────────────

  function handleAddTxSubmit(payload: AddTransactionPayload) {
    dispatch({
      type: 'CREATE_TRANSACTION',
      payload: { ...payload, id: generateId(), createdAt: new Date().toISOString() },
    });
    setShowAddTxForm(false);
  }

  function handleEditTxSubmit(payload: AddTransactionPayload) {
    dispatch({
      type: 'EDIT_TRANSACTION',
      payload: { ...editingTx, ...payload },
    });
    setEditingTx(null);
  }

  function handleDeleteTx(id: string) {
    dispatch({ type: 'DELETE_TRANSACTION', payload: { id } });
  }

  function handleEditTxClick(transaction: Transaction) {
    setEditingTx(transaction);
    setShowAddTxForm(false);
  }

  function handleCancelTxForm() {
    setShowAddTxForm(false);
    setEditingTx(null);
  }

  // ── Account handlers ────────────────────────────────────────────────────────

  function handleAddAccountSubmit(payload: AccountFormPayload) {
    dispatch({
      type: 'CREATE_ACCOUNT',
      payload: { ...payload, id: generateId(), createdAt: new Date().toISOString() },
    });
    setShowAccountForm(false);
  }

  function handleEditAccountSubmit(payload: AccountFormPayload) {
    dispatch({
      type: 'EDIT_ACCOUNT',
      payload: { ...editingAccount, ...payload },
    });
    setEditingAccount(null);
  }

  function handleDeleteAccount(id: string) {
    dispatch({ type: 'DELETE_ACCOUNT', payload: { id } });
  }

  function handleEditAccountClick(account: Account) {
    setEditingAccount(account);
    setShowAccountForm(false);
  }

  function handleCancelAccountForm() {
    setShowAccountForm(false);
    setEditingAccount(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className={styles['page']} aria-label="Transactions">

      {/* ── Accounts section ─────────────────────────────────────────────── */}
      <section className={styles['section']} aria-labelledby="accounts-heading">
        <div className={styles['sectionHeader']}>
          <h2 id="accounts-heading" className={styles['sectionHeading']}>Accounts</h2>
          <button
            type="button"
            className={styles['addButton']}
            onClick={() => {
              setShowAccountForm(v => !v);
              setEditingAccount(null);
            }}
            aria-expanded={showAccountForm}
          >
            {showAccountForm ? 'Cancel' : 'Add Account'}
          </button>
        </div>

        {/* Add account form */}
        {showAccountForm && !editingAccount && (
          <div className={styles['formPanel']}>
            <AccountForm
              onSubmit={handleAddAccountSubmit}
              onCancel={handleCancelAccountForm}
            />
          </div>
        )}

        {/* Account list */}
        {state.accounts.length === 0 ? (
          <p className={styles['emptyState']} role="status">
            No accounts yet. Add one to get started.
          </p>
        ) : (
          <ul className={styles['accountList']} aria-label="Accounts list">
            {state.accounts.map(account => (
              <li key={account.id} className={styles['accountItem']}>
                {editingAccount?.id === account.id ? (
                  <div className={styles['formPanel']}>
                    <AccountForm
                      initialValues={editingAccount}
                      onSubmit={handleEditAccountSubmit}
                      onCancel={handleCancelAccountForm}
                    />
                  </div>
                ) : (
                  <>
                    <span className={styles['accountName']}>{account.name}</span>
                    <span className={styles['accountType']}>{account.type}</span>
                    <div className={styles['rowActions']}>
                      <button
                        type="button"
                        onClick={() => handleEditAccountClick(account)}
                        aria-label={`Edit account: ${account.name}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAccount(account.id)}
                        aria-label={`Delete account: ${account.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Transactions section ──────────────────────────────────────────── */}
      <section className={styles['section']} aria-labelledby="transactions-heading">
        <div className={styles['sectionHeader']}>
          <h2 id="transactions-heading" className={styles['sectionHeading']}>Transactions</h2>
          <button
            type="button"
            className={styles['addButton']}
            onClick={() => {
              setShowAddTxForm(v => !v);
              setEditingTx(null);
            }}
            aria-expanded={showAddTxForm}
            disabled={state.accounts.length === 0}
            title={state.accounts.length === 0 ? 'Add an account first' : undefined}
          >
            {showAddTxForm ? 'Cancel' : 'Add Transaction'}
          </button>
        </div>

        {/* Filter bar */}
        <FilterBar
          accounts={state.accounts}
          categories={state.categories}
          filters={filters}
          sortConfig={sortConfig}
          onFiltersChange={setFilters}
          onSortChange={setSortConfig}
        />

        {/* Add transaction form */}
        {showAddTxForm && !editingTx && (
          <div className={styles['formPanel']}>
            <AddTransaction
              accounts={state.accounts}
              categories={state.categories}
              onSubmit={handleAddTxSubmit}
              onCancel={handleCancelTxForm}
            />
          </div>
        )}

        {/* Edit transaction form — shown inline above the list */}
        {editingTx && (
          <div className={styles['formPanel']}>
            <AddTransaction
              accounts={state.accounts}
              categories={state.categories}
              initialValues={editingTx}
              onSubmit={handleEditTxSubmit}
              onCancel={handleCancelTxForm}
            />
          </div>
        )}

        {/* Transaction list (shows empty-state message when filteredTransactions is empty) */}
        <TransactionList
          transactions={filteredTransactions}
          categories={state.categories}
          onEdit={handleEditTxClick}
          onDelete={handleDeleteTx}
        />
      </section>
    </main>
  );
}