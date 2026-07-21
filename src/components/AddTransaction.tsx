import { useState } from 'react';
import type { Account, Category, Transaction } from '../lib/types.js';
import { TransactionSchema } from '../lib/types.js';
import { CategoryPicker } from './CategoryPicker.jsx';

export interface AddTransactionPayload {
  amount: number;
  date: string;
  description: string;
  accountId: string;
  categoryId: string | null;
}

export interface AddTransactionProps {
  accounts?: Pick<Account, 'id' | 'name'>[];
  categories?: Pick<Category, 'id' | 'name'>[];
  initialValues?: Partial<Transaction>;
  onSubmit: (payload: AddTransactionPayload) => void;
  onCancel: () => void;
}

// Schema that only requires the fields the form provides.
// id, createdAt, and recurringRuleId are assigned by the reducer.
const FormSchema = TransactionSchema.partial({
  id: true,
  createdAt: true,
  recurringRuleId: true,
});

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FieldErrors {
  amount?: string;
  date?: string;
  description?: string;
  accountId?: string;
  categoryId?: string;
  [key: string]: string | undefined;
}

interface FormFields {
  amount: string;
  date: string;
  description: string;
  accountId: string;
  categoryId: string | null;
}

export function AddTransaction({
  accounts = [],
  categories = [],
  initialValues,
  onSubmit,
  onCancel,
}: AddTransactionProps): JSX.Element {
  const [fields, setFields] = useState<FormFields>({
    amount: initialValues?.amount != null ? String(initialValues.amount) : '',
    date: initialValues?.date ?? today(),
    description: initialValues?.description ?? '',
    accountId: initialValues?.accountId ?? '',
    categoryId: initialValues?.categoryId ?? null,
  });

  const [errors, setErrors] = useState<FieldErrors>({});

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  function handleCategoryChange(value: string | null): void {
    setFields(prev => ({ ...prev, categoryId: value }));
    if (errors.categoryId) {
      setErrors(prev => ({ ...prev, categoryId: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();

    const raw = {
      amount: fields.amount === '' ? undefined : parseFloat(fields.amount),
      date: fields.date,
      description: fields.description,
      accountId: fields.accountId,
      categoryId: fields.categoryId ?? null,
    };

    const result = FormSchema.safeParse(raw);

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit({
      amount: result.data.amount,
      date: result.data.date,
      description: result.data.description,
      accountId: result.data.accountId,
      categoryId: result.data.categoryId ?? null,
    });
  }

  const isEdit = Boolean(initialValues);

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={isEdit ? 'Edit transaction' : 'Add transaction'}
    >
      {/* ── Amount ── */}
      <div>
        <label htmlFor="txn-amount">Amount</label>
        <input
          id="txn-amount"
          name="amount"
          type="number"
          step="any"
          value={fields.amount}
          onChange={handleInputChange}
          placeholder="e.g. -42.50"
          aria-invalid={Boolean(errors.amount)}
          aria-describedby={errors.amount ? 'txn-amount-error' : undefined}
          required
        />
        {errors.amount && (
          <span id="txn-amount-error" role="alert" className="field-error">
            {errors.amount}
          </span>
        )}
      </div>

      {/* ── Date ── */}
      <div>
        <label htmlFor="txn-date">Date</label>
        <input
          id="txn-date"
          name="date"
          type="date"
          value={fields.date}
          onChange={handleInputChange}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'txn-date-error' : undefined}
          required
        />
        {errors.date && (
          <span id="txn-date-error" role="alert" className="field-error">
            {errors.date}
          </span>
        )}
      </div>

      {/* ── Description ── */}
      <div>
        <label htmlFor="txn-description">Description</label>
        <input
          id="txn-description"
          name="description"
          type="text"
          value={fields.description}
          onChange={handleInputChange}
          placeholder="e.g. Grocery run"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'txn-description-error' : undefined}
          required
        />
        {errors.description && (
          <span id="txn-description-error" role="alert" className="field-error">
            {errors.description}
          </span>
        )}
      </div>

      {/* ── Account ── */}
      <div>
        <label htmlFor="txn-accountId">Account</label>
        <select
          id="txn-accountId"
          name="accountId"
          value={fields.accountId}
          onChange={handleSelectChange}
          aria-invalid={Boolean(errors.accountId)}
          aria-describedby={errors.accountId ? 'txn-accountId-error' : undefined}
          required
        >
          <option value="">Select an account…</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
        {errors.accountId && (
          <span id="txn-accountId-error" role="alert" className="field-error">
            {errors.accountId}
          </span>
        )}
      </div>

      {/* ── Category (optional) ── */}
      <div>
        <label htmlFor="txn-categoryId">Category (optional)</label>
        <CategoryPicker
          categories={categories}
          value={fields.categoryId}
          onChange={handleCategoryChange}
        />
        {errors.categoryId && (
          <span id="txn-categoryId-error" role="alert" className="field-error">
            {errors.categoryId}
          </span>
        )}
      </div>

      {/* ── Actions ── */}
      <div>
        <button type="submit">
          {isEdit ? 'Save changes' : 'Add transaction'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}