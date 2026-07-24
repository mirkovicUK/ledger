import styles from './Summary.module.css';
import type { Account } from '../lib/types.js';

/**
 * Format a numeric amount as a currency string with 2 decimal places.
 * Positive values show as-is, negative values show with a minus sign.
 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface SummaryProps {
  totalBalance: number;
  accountBalances: Record<string, number>;
  accounts: Account[];
}

/**
 * Summary component — displays the total balance and per-account balances.
 */
export default function Summary({ totalBalance, accountBalances, accounts }: SummaryProps): React.JSX.Element {
  return (
    <section className={styles['container']} aria-label="Account balances summary">
      {/* Total balance */}
      <div className={styles['totalCard']}>
        <span className={styles['totalLabel']}>Total Balance</span>
        <span
          className={`${styles['totalAmount']} ${totalBalance < 0 ? styles['negative'] : ''}`}
          aria-label={`Total balance: ${formatCurrency(totalBalance)}`}
        >
          {formatCurrency(totalBalance)}
        </span>
      </div>

      {/* Per-account balances */}
      {accounts && accounts.length > 0 ? (
        <ul className={styles['accountList']} aria-label="Individual account balances">
          {accounts.map(account => {
            const balance = accountBalances?.[account.id] ?? 0;
            return (
              <li key={account.id} className={styles['accountCard']}>
                <div className={styles['accountInfo']}>
                  <span className={styles['accountName']}>{account.name}</span>
                  <span className={styles['accountType']}>{account.type}</span>
                </div>
                <span
                  className={`${styles['accountBalance']} ${balance < 0 ? styles['negative'] : ''}`}
                  aria-label={`${account.name} balance: ${formatCurrency(balance)}`}
                >
                  {formatCurrency(balance)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles['emptyState']}>No accounts yet</p>
      )}
    </section>
  );
}