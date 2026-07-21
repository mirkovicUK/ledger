import styles from './BudgetBar.module.css';

/**
 * Format a numeric amount as a currency string with 2 decimal places.
 */
function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * BudgetBar — visual progress bar showing ratio of spent to budget limit.
 *
 * Props:
 *   budget       {object}  – { id, categoryId, limit, period, startDate }
 *   spent        {number}  – total amount spent in the current period
 *   ratio        {number}  – spent / limit (may exceed 1.0 when overspent)
 *   overspent    {boolean} – true when spent > limit
 *   categoryName {string}  – optional human-readable category name
 *
 * Requirements: 4.2, 4.3
 */
export default function BudgetBar({ budget, spent, ratio, overspent, categoryName }) {
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
