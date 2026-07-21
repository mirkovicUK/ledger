import React from 'react';

/**
 * Displays a single transaction row with date, description, amount,
 * category, and edit/delete action buttons.
 *
 * Props:
 *   transaction  — transaction object
 *   categories   — array of category objects [{ id, name }]
 *   onEdit       — called with the transaction object when Edit is clicked
 *   onDelete     — called with the transaction id when Delete is clicked
 */
export function TransactionRow({ transaction, categories = [], onEdit, onDelete }) {
  const { id, date, description, amount, categoryId } = transaction;

  const category = categories.find(c => c.id === categoryId);
  const categoryName = category ? category.name : (categoryId ? categoryId : 'Uncategorized');

  const isPositive = amount >= 0;
  const amountDisplay = `${isPositive ? '+' : ''}${amount.toFixed(2)}`;
  const amountStyle = {
    color: isPositive ? '#2e7d32' : '#c62828',
    fontWeight: '600',
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
          onClick={() => onEdit && onEdit(transaction)}
          aria-label={`Edit transaction: ${description}`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete && onDelete(id)}
          aria-label={`Delete transaction: ${description}`}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default TransactionRow;
