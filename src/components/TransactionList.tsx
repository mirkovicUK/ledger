import type { Transaction, Category } from '../lib/types.js';
import { TransactionRow } from './TransactionRow.js';

export interface TransactionListProps {
  transactions?: Transaction[];
  categories?: Category[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions = [], categories = [], onEdit, onDelete }: TransactionListProps): JSX.Element {
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