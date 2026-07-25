import { useState } from 'react';
import type { Account, Category, RecurringRule } from '../lib/types.js';
import { RecurringRuleSchema } from '../lib/types.js';

export interface RecurringRuleFormPayload {
  id?: string;
  accountId: string;
  amount: number;
  description: string;
  categoryId: string | null;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  startDate: string;
  lastExpandedDate?: string | null;
}

export interface RecurringRuleFormProps {
  accounts?: Pick<Account, 'id' | 'name'>[];
  categories?: Pick<Category, 'id' | 'name'>[];
  initialValues?: Partial<RecurringRule> | null;
  onSubmit: (payload: RecurringRuleFormPayload) => void;
  onCancel: () => void;
}

type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export function RecurringRuleForm({
  accounts = [],
  categories = [],
  initialValues = null,
  onSubmit,
  onCancel,
}: RecurringRuleFormProps): JSX.Element {
  // ── form state ────────────────────────────────────────────────────────────

  const [description, setDescription] = useState<string>(initialValues?.description ?? '');
  const [amount, setAmount] = useState<string>(
    initialValues?.amount !== undefined ? String(initialValues.amount) : ''
  );
  const [accountId, setAccountId] = useState<string>(initialValues?.accountId ?? '');
  const [categoryId, setCategoryId] = useState<string>(initialValues?.categoryId ?? '');
  const [frequency, setFrequency] = useState<Frequency>(
    (initialValues?.frequency as Frequency) ?? 'monthly'
  );
  const [startDate, setStartDate] = useState<string>(initialValues?.startDate ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  // ── validation ────────────────────────────────────────────────────────────

  function validate(): { valid: boolean; errors: Record<string, string>; data: RecurringRuleFormPayload | null } {
    const payload = {
      ...(initialValues?.id ? { id: initialValues.id } : {}),
      description,
      amount: amount === '' ? undefined : Number(amount),
      accountId,
      categoryId: categoryId || null,
      frequency,
      startDate,
      ...(initialValues?.lastExpandedDate !== undefined
        ? { lastExpandedDate: initialValues.lastExpandedDate }
        : {}),
    };

    const schema = RecurringRuleSchema.partial({ id: true, lastExpandedDate: true });
    const result = schema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string | undefined;
        if (field) fieldErrors[field] = issue.message;
      }
      return { valid: false, errors: fieldErrors, data: null };
    }

    const parsed = result.data;
    const validData: RecurringRuleFormPayload = {
      ...(parsed.id ? { id: parsed.id } : {}),
      accountId: parsed.accountId,
      amount: parsed.amount,
      description: parsed.description,
      categoryId: parsed.categoryId ?? null,
      frequency: parsed.frequency,
      startDate: parsed.startDate,
      ...(parsed.lastExpandedDate !== undefined
        ? { lastExpandedDate: parsed.lastExpandedDate }
        : {}),
    };

    return { valid: true, errors: {}, data: validData };
  }

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setSubmitted(true);

    const { valid, errors: validationErrors, data } = validate();
    setErrors(validationErrors);

    if (valid && data) {
      onSubmit(data);
    }
  }

  // Re-validate on change after first submit attempt
  function revalidate(): void {
    if (submitted) {
      const { errors: validationErrors } = validate();
      setErrors(validationErrors);
    }
  }

  // ── derived state ─────────────────────────────────────────────────────────

  const hasErrors = Object.keys(errors).length > 0;
  const isEditMode = Boolean(initialValues?.id);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEditMode ? 'Edit recurring rule' : 'Add recurring rule'}>
      {/* Description */}
      <div>
        <label htmlFor="rrf-description">
          Description
          <input
            id="rrf-description"
            type="text"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setDescription(e.target.value); revalidate(); }}
            placeholder="e.g. Monthly rent"
            aria-describedby={errors.description ? 'rrf-description-error' : undefined}
            aria-invalid={Boolean(errors.description)}
          />
        </label>
        {errors.description && (
          <span id="rrf-description-error" role="alert" className="field-error">
            {errors.description}
          </span>
        )}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="rrf-amount">
          Amount
          <input
            id="rrf-amount"
            type="number"
            step="any"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAmount(e.target.value); revalidate(); }}
            placeholder="e.g. -1200 or 500"
            aria-describedby={errors.amount ? 'rrf-amount-error' : undefined}
            aria-invalid={Boolean(errors.amount)}
          />
        </label>
        {errors.amount && (
          <span id="rrf-amount-error" role="alert" className="field-error">
            {errors.amount}
          </span>
        )}
      </div>

      {/* Account */}
      <div>
        <label htmlFor="rrf-account">
          Account
          <select
            id="rrf-account"
            value={accountId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setAccountId(e.target.value); revalidate(); }}
            aria-describedby={errors.accountId ? 'rrf-account-error' : undefined}
            aria-invalid={Boolean(errors.accountId)}
          >
            <option value="">Select account…</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </label>
        {errors.accountId && (
          <span id="rrf-account-error" role="alert" className="field-error">
            {errors.accountId}
          </span>
        )}
      </div>

      {/* Category (optional) */}
      <div>
        <label htmlFor="rrf-category">
          Category (optional)
          <select
            id="rrf-category"
            value={categoryId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setCategoryId(e.target.value); revalidate(); }}
          >
            <option value="">Uncategorized</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Frequency */}
      <div>
        <label htmlFor="rrf-frequency">
          Frequency
          <select
            id="rrf-frequency"
            value={frequency}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setFrequency(e.target.value as Frequency);
              revalidate();
            }}
            aria-describedby={errors.frequency ? 'rrf-frequency-error' : undefined}
            aria-invalid={Boolean(errors.frequency)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
        {errors.frequency && (
          <span id="rrf-frequency-error" role="alert" className="field-error">
            {errors.frequency}
          </span>
        )}
      </div>

      {/* Start date */}
      <div>
        <label htmlFor="rrf-start-date">
          Start date
          <input
            id="rrf-start-date"
            type="date"
            value={startDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setStartDate(e.target.value); revalidate(); }}
            aria-describedby={errors.startDate ? 'rrf-start-date-error' : undefined}
            aria-invalid={Boolean(errors.startDate)}
          />
        </label>
        {errors.startDate && (
          <span id="rrf-start-date-error" role="alert" className="field-error">
            {errors.startDate}
          </span>
        )}
      </div>

      {/* Actions */}
      <div>
        <button
          type="submit"
          disabled={submitted && hasErrors}
          aria-disabled={submitted && hasErrors}
        >
          {isEditMode ? 'Save changes' : 'Add rule'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}