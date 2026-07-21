import { useState } from 'react';
import { RecurringRuleSchema } from '../lib/types.js';

/**
 * RecurringRuleForm — create or edit a recurring rule.
 *
 * Props:
 *   accounts       — array of { id, name }
 *   categories     — array of { id, name }
 *   initialValues  — optional rule object (edit mode)
 *   onSubmit(payload) — called with validated form data
 *   onCancel       — called when the user cancels
 */
export function RecurringRuleForm({
  accounts = [],
  categories = [],
  initialValues = null,
  onSubmit,
  onCancel,
}) {
  // ── form state ────────────────────────────────────────────────────────────

  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [amount, setAmount] = useState(
    initialValues?.amount !== undefined ? String(initialValues.amount) : ''
  );
  const [accountId, setAccountId] = useState(initialValues?.accountId ?? '');
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? '');
  const [frequency, setFrequency] = useState(initialValues?.frequency ?? 'monthly');
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? '');

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // ── validation ────────────────────────────────────────────────────────────

  function validate() {
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
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field) fieldErrors[field] = issue.message;
      }
      return { valid: false, errors: fieldErrors, data: null };
    }

    return { valid: true, errors: {}, data: result.data };
  }

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);

    const { valid, errors: validationErrors, data } = validate();
    setErrors(validationErrors);

    if (valid) {
      onSubmit(data);
    }
  }

  // Re-validate on change after first submit attempt
  function revalidate() {
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
            onChange={e => { setDescription(e.target.value); revalidate(); }}
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
            onChange={e => { setAmount(e.target.value); revalidate(); }}
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
            onChange={e => { setAccountId(e.target.value); revalidate(); }}
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
            onChange={e => { setCategoryId(e.target.value); revalidate(); }}
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
            onChange={e => { setFrequency(e.target.value); revalidate(); }}
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
            onChange={e => { setStartDate(e.target.value); revalidate(); }}
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
