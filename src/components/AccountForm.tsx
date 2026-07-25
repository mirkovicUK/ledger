import { useState } from 'react';
import { AccountSchema } from '../lib/types.js';
import type { Account } from '../lib/types.js';

/**
 * AccountForm — create or edit an account.
 *
 * Props:
 *   initialValues  — optional account object for edit mode { name, type }
 *   onSubmit(payload) — called with { name, type } on valid submit
 *   onCancel()     — called when the Cancel button is clicked
 */

export interface AccountFormProps {
  initialValues?: Pick<Account, 'name' | 'type'>;
  onSubmit: (payload: Pick<Account, 'name' | 'type'>) => void;
  onCancel: () => void;
}

type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

const ACCOUNT_TYPES: AccountType[] = ['checking', 'savings', 'credit', 'cash', 'investment'];

// Schema that only requires name + type (no id / createdAt needed for the form)
const FormSchema = AccountSchema.partial({ id: true, createdAt: true });

export function AccountForm({ initialValues, onSubmit, onCancel }: AccountFormProps): JSX.Element {
  const [name, setName] = useState<string>(initialValues?.name ?? '');
  const [type, setType] = useState<string>(initialValues?.type ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const result = FormSchema.safeParse({ name, type });

    if (!result.success) {
      // Build a map of field → first error message
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.errors) {
        const field = issue.path[0] as string | undefined;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit({ name: result.data.name, type: result.data.type as AccountType });
  }

  const isEdit = Boolean(initialValues);

  return (
    <form onSubmit={handleSubmit} aria-label={isEdit ? 'Edit account' : 'Create account'} noValidate>
      {/* ── Name ── */}
      <div>
        <label htmlFor="account-name">
          Account name
          <input
            id="account-name"
            type="text"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'account-name-error' : undefined}
            autoComplete="off"
          />
        </label>
        {errors.name && (
          <span id="account-name-error" role="alert" aria-live="polite">
            {errors.name}
          </span>
        )}
      </div>

      {/* ── Type ── */}
      <div>
        <label htmlFor="account-type">
          Account type
          <select
            id="account-type"
            value={type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
            aria-invalid={Boolean(errors.type)}
            aria-describedby={errors.type ? 'account-type-error' : undefined}
          >
            <option value="">Select a type…</option>
            {ACCOUNT_TYPES.map(t => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </label>
        {errors.type && (
          <span id="account-type-error" role="alert" aria-live="polite">
            {errors.type}
          </span>
        )}
      </div>

      {/* ── Actions ── */}
      <div>
        <button type="submit">
          {isEdit ? 'Save changes' : 'Create account'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}