import React from 'react';
import { TransactionRow } from './TransactionRow.jsx';

/**
 * Renders a list of transactions, or an empty-state message when the list
 * is empty.
 *
 * Props:
 *   transactions — array of transaction objects
 *   categories   — array of category objects [{ id, name }]
 *   onEdit       — called with a transaction object when Edit is clicked
 *   onDelete     — called with a transaction id when Delete is clicked
 */
export function TransactionList({ transactions = [], categories = [], onEdit, onDelete }) {
  if (transactions.length === 0) {
    return (
      <p className="transaction-list__empty" role="status">
        No transactions found
      </p>
    );
  }

  return (
    <table className="transaction-list">
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Description</th>
          <th scope="col">Amount</th>
          <th scope="col">Category</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(transaction => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            categories={categories}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  );
}

export default TransactionList;
