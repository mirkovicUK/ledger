import type { Transaction, Category } from '../lib/types.js';

export interface TransactionRowProps {
  transaction: Transaction;
  categories?: Category[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export function TransactionRow({ transaction, categories = [], onEdit, onDelete }: TransactionRowProps): JSX.Element {
  const { id, date, description, amount, categoryId } = transaction;

  const category = categories.find(c => c.id === categoryId);
  const categoryName = category ? category.name : (categoryId ? categoryId : 'Uncategorized');

  const isPositive = amount >= 0;
  const amountDisplay = `${isPositive ? '+' : ''}${amount.toFixed(2)}`;
  const amountStyle = {
    color: isPositive ? '#2e7d32' : '#c62828',
    fontWeight: '600' as const,
  };

  return (
    <tr className="transaction-row">
      <td>{date}</td>
      <td>{description}</td>
      <td style={amountStyle} aria-label={`Amount: ${amountDisplay}`}>
        {amountDisplay}
      </td>
      <td>{categoryName}</td>
      <td className="transaction-row__actions">
        <button
          type="button"
          onClick={() => onEdit?.(transaction)}
          aria-label={`Edit transaction: ${description}`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(id)}
          aria-label={`Delete transaction: ${description}`}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default TransactionRow;