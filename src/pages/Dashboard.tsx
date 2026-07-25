import { useLedger } from '../hooks/useLedger';
import { useBudgets } from '../hooks/useBudgets.js';
import Summary from '../components/Summary.jsx';
import TransactionList from '../components/TransactionList.jsx';
import BudgetBar from '../components/BudgetBar.jsx';
import styles from './Dashboard.module.css';

export default function Dashboard(): JSX.Element {
  const { state, totalBalance, accountBalances } = useLedger();
  const budgetProgress = useBudgets(state);

  const hasAccounts = state.accounts.length > 0;
  const hasTransactions = state.transactions.length > 0;
  const showOnboarding = !hasAccounts && !hasTransactions;

  const recentTransactions = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const noop = () => {};

  return (
    <main className={styles.page} aria-label="Dashboard">
      {showOnboarding && (
        <section className={styles.onboarding} aria-live="polite">
          <p className={styles.onboardingText}>
            Get started by adding your first account
          </p>
        </section>
      )}

      <section className={styles.section} aria-labelledby="summary-heading">
        <h2 id="summary-heading" className={styles.sectionHeading}>Balances</h2>
        <Summary
          totalBalance={totalBalance}
          accountBalances={accountBalances}
          accounts={state.accounts}
        />
      </section>

      <section className={styles.section} aria-labelledby="recent-heading">
        <h2 id="recent-heading" className={styles.sectionHeading}>Recent Transactions</h2>
        <TransactionList
          transactions={recentTransactions}
          categories={state.categories}
          onEdit={noop}
          onDelete={noop}
        />
      </section>

      {budgetProgress.length > 0 && (
        <section className={styles.section} aria-labelledby="budgets-heading">
          <h2 id="budgets-heading" className={styles.sectionHeading}>Budgets</h2>
          <div className={styles.budgetGrid}>
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