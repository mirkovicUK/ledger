import { useState } from 'react';
import type { Account } from '../lib/types.js';
import { AccountSchema } from '../lib/types.js';
import { z } from 'zod';

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'cash', 'investment'] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number];

const FormSchema = AccountSchema.partial({ id: true, createdAt: true });

export interface AccountFormPayload {
  name: string;
  type: string;
}

export interface AccountFormProps {
  initialValues?: Partial<Account>;
  onSubmit: (payload: AccountFormPayload) => void;
  onCancel: () => void;
}

export function AccountForm({ initialValues, onSubmit, onCancel }: AccountFormProps): JSX.Element {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [type, setType] = useState(initialValues?.type ?? '');
  const [errors, setErrors] = useState<Partial<Record<keyof AccountFormPayload, string>>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const result = FormSchema.safeParse({ name, type });

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof AccountFormPayload, string>> = {};
      for (const issue of result.error.errors) {
        const field = issue.path[0] as keyof AccountFormPayload;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit({ name: result.data.name, type: result.data.type });
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
            onChange={(e) => setName(e.target.value)}
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
            onChange={(e) => setType(e.target.value)}
            aria-invalid={Boolean(errors.type)}
            aria-describedby={errors.type ? 'account-type-error' : undefined}
          >
            <option value="">Select a type…</option>
            {ACCOUNT_TYPES.map((t) => (
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