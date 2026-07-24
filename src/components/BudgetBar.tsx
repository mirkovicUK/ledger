import type { Budget } from '../lib/types.js';
import styles from './BudgetBar.module.css';

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

/**
 * BudgetBar — visual progress bar showing ratio of spent to budget limit.
 *
 * Requirements: 4.2, 4.3
 */
export default function BudgetBar({ budget, spent, ratio, overspent, categoryName }: BudgetBarProps): React.JSX.Element {
  // Cap bar fill at 100% visually; excess is shown via overspent styling
  const fillPercent = Math.min(ratio, 1) * 100;
  const percentDisplay = Math.round(ratio * 100);

  const label = categoryName || budget.id;

  return (
    <div
      className={`${(styles as Record<string, string>)['container']} ${overspent ? (styles as Record<string, string>)['overspentContainer'] : ''}`}
      aria-label={`Budget for ${label}: ${formatCurrency(spent)} of ${formatCurrency(budget.limit)} ${budget.period}`}
    >
      {/* Header row: label + period */}
      <div className={(styles as Record<string, string>)['header']}>
        <span className={(styles as Record<string, string>)['label']}>{label}</span>
        <span className={(styles as Record<string, string>)['period']}>{budget.period}</span>
      </div>

      {/* Progress bar track */}
      <div className={(styles as Record<string, string>)['track']} role="progressbar" aria-valuenow={fillPercent} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`${(styles as Record<string, string>)['fill']} ${overspent ? (styles as Record<string, string>)['overspentFill'] : ''}`}
          style={{ width: `${fillPercent}%` }}
        />
        {overspent && <div className={(styles as Record<string, string>)['overflowIndicator']} aria-hidden="true" />}
      </div>

      {/* Footer row: spent / limit amounts + percentage */}
      <div className={(styles as Record<string, string>)['footer']}>
        <span className={`${(styles as Record<string, string>)['amounts']} ${overspent ? (styles as Record<string, string>)['overspentText'] : ''}`}>
          {formatCurrency(spent)} / {formatCurrency(budget.limit)}
        </span>
        <span className={`${(styles as Record<string, string>)['percentage']} ${overspent ? (styles as Record<string, string>)['overspentText'] : ''}`}>
          {percentDisplay}%
        </span>
      </div>
    </div>
  );
}