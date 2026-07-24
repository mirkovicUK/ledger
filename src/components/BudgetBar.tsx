import styles from './BudgetBar.module.css';
import type { Budget } from '../lib/types.js';
import React from 'react';

/**
 * Format a numeric amount as a currency string with 2 decimal places.
 */
function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface BudgetBarProps {
  budget: Budget;
  spent: number;
  ratio: number;
  overspent: boolean;
  categoryName?: string;
}

export default function BudgetBar(props: BudgetBarProps): React.JSX.Element {
  const { budget, spent, ratio, overspent, categoryName } = props;
  
  // Cap bar fill at 100% visually; excess is shown via overspent styling
  const fillPercent = Math.min(ratio, 1) * 100;
  const percentDisplay = Math.round(ratio * 100);

  const label = categoryName || budget.id;

  return (
    <div
      className={`${styles.container} ${overspent ? styles.overspentContainer : ''}`}
      aria-label={`Budget for ${label}: ${formatCurrency(spent)} of ${formatCurrency(budget.limit)} ${budget.period}`}
    >
      {/* Header row: label + period */}
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.period}>{budget.period}</span>
      </div>

      {/* Progress bar track */}
      <div className={styles.track} role="progressbar" aria-valuenow={fillPercent} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`${styles.fill} ${overspent ? styles.overspentFill : ''}`}
          style={{ width: `${fillPercent}%` }}
        />
        {overspent && <div className={styles.overflowIndicator} aria-hidden="true" />}
      </div>

      {/* Footer row: spent / limit amounts + percentage */}
      <div className={styles.footer}>
        <span className={`${styles.amounts} ${overspent ? styles.overspentText : ''}`}>
          {formatCurrency(spent)} / {formatCurrency(budget.limit)}
        </span>
        <span className={`${styles.percentage} ${overspent ? styles.overspentText : ''}`}>
          {percentDisplay}%
        </span>
      </div>
    </div>
  );
}