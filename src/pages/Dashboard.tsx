import { useLedger } from '../hooks/useLedger.jsx';
import { useBudgets } from '../hooks/useBudgets.js';
import Summary from '../components/Summary.jsx';
import TransactionList from '../components/TransactionList.jsx';
import BudgetBar from '../components/BudgetBar.jsx';
import styles from './Dashboard.module.css';
import type { Transaction } from '../lib/types.js';

/**
 * Dashboard page — shows balance summary, recent transactions, and active budgets.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export default function Dashboard(): JSX.Element {
  const { state, totalBalance, accountBalances } = useLedger();
  const budgetProgress = useBudgets(state);

  const hasAccounts = state.accounts.length > 0;
  const hasTransactions = state.transactions.length > 0;
  const showOnboarding = !hasAccounts && !hasTransactions;

  // Show the 5 most recent transactions (sorted by date descending)
  const recentTransactions: Transaction[] = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // No-op handlers — Dashboard is read-only
  const noop = () => {};

  const s = styles as Record<string, string>;

  return (
    <main className={s['page']} aria-label="Dashboard">
      {showOnboarding && (
        <section className={s['onboarding']} aria-live="polite">
          <p className={s['onboardingText']}>
            Get started by adding your first account
          </p>
        </section>
      )}

      {/* Balance summary */}
      <section className={s['section']} aria-labelledby="summary-heading">
        <h2 id="summary-heading" className={s['sectionHeading']}>Balances</h2>
        <Summary
          totalBalance={totalBalance}
          accountBalances={accountBalances}
          accounts={state.accounts}
        />
      </section>

      {/* Recent transactions */}
      <section className={s['section']} aria-labelledby="recent-heading">
        <h2 id="recent-heading" className={s['sectionHeading']}>Recent Transactions</h2>
        <TransactionList
          transactions={recentTransactions}
          categories={state.categories}
          onEdit={noop}
          onDelete={noop}
        />
      </section>

      {/* Active budgets */}
      {budgetProgress.length > 0 && (
        <section className={s['section']} aria-labelledby="budgets-heading">
          <h2 id="budgets-heading" className={s['sectionHeading']}>Budgets</h2>
          <div className={s['budgetGrid']}>
            {budgetProgress.map(budget => {
              const category = state.categories.find(c => c.id === budget.categoryId);
              return (
                <BudgetBar
                  key={budget.id}
                  budget={budget}
                  spent={budget.spent}
                  ratio={budget.ratio}
                  overspent={budget.overspent}
                  categoryName={category?.name}
                />
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}