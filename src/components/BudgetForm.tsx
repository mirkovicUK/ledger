import { useState } from 'react';
import { z } from 'zod';
import type { Budget, Category } from '../lib/types.js';

/**
 * BudgetForm — create or edit a budget.
 *
 * Props:
 *   categories     — array of { id, name }
 *   initialValues  — optional budget object for edit mode
 *                    { categoryId, limit, period, startDate }
 *   onSubmit(payload) — called with validated budget payload
 *   onCancel          — called when the user cancels
 */

// Validation schema for the form fields (id excluded — assigned by reducer)
const BudgetFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  limit: z
    .number({ invalid_type_error: 'Limit must be a number' })
    .positive('Limit must be a positive amount')
    .finite('Limit must be a finite number'),
  period: z.enum(['weekly', 'monthly', 'yearly'], {
    errorMap: () => ({ message: 'Period must be weekly, monthly, or yearly' }),
  }),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be a valid date (YYYY-MM-DD)'),
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

export interface BudgetFormPayload {
  categoryId: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
}

export interface BudgetFormProps {
  categories?: Pick<Category, 'id' | 'name'>[];
  initialValues?: Partial<Budget>;
  onSubmit: (payload: BudgetFormPayload) => void;
  onCancel: () => void;
}

export function BudgetForm({ categories = [], initialValues, onSubmit, onCancel }: BudgetFormProps): React.JSX.Element {
  const [fields, setFields] = useState({
    categoryId: initialValues?.categoryId ?? '',
    limit: initialValues?.limit != null ? String(initialValues.limit) : '',
    period: initialValues?.period ?? 'monthly',
    startDate: initialValues?.startDate ?? today(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    // Clear the error for the field as the user edits it
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const raw = {
      categoryId: fields.categoryId,
      limit: fields.limit === '' ? undefined : parseFloat(fields.limit),
      period: fields.period,
      startDate: fields.startDate,
    };

    const result = BudgetFormSchema.safeParse(raw);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  }

  const isEditMode = Boolean(initialValues);

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={isEditMode ? 'Edit budget' : 'Create budget'}>
      {/* Category */}
      <div>
        <label htmlFor="budget-categoryId">Category</label>
        <select
          id="budget-categoryId"
          name="categoryId"
          value={fields.categoryId}
          onChange={handleChange}
          aria-invalid={Boolean(errors.categoryId)}
          aria-describedby={errors.categoryId ? 'budget-categoryId-error' : undefined}
          required
        >
          <option value="">Select a category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.categoryId && (
          <span id="budget-categoryId-error" role="alert" className="field-error">
            {errors.categoryId}
          </span>
        )}
      </div>

      {/* Limit */}
      <div>
        <label htmlFor="budget-limit">Spending Limit</label>
        <input
          id="budget-limit"
          name="limit"
          type="number"
          min="0.01"
          step="any"
          value={fields.limit}
          onChange={handleChange}
          placeholder="e.g. 500"
          aria-invalid={Boolean(errors.limit)}
          aria-describedby={errors.limit ? 'budget-limit-error' : undefined}
          required
        />
        {errors.limit && (
          <span id="budget-limit-error" role="alert" className="field-error">
            {errors.limit}
          </span>
        )}
      </div>

      {/* Period */}
      <div>
        <label htmlFor="budget-period">Period</label>
        <select
          id="budget-period"
          name="period"
          value={fields.period}
          onChange={handleChange}
          aria-invalid={Boolean(errors.period)}
          aria-describedby={errors.period ? 'budget-period-error' : undefined}
          required
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        {errors.period && (
          <span id="budget-period-error" role="alert" className="field-error">
            {errors.period}
          </span>
        )}
      </div>

      {/* Start Date */}
      <div>
        <label htmlFor="budget-startDate">Start Date</label>
        <input
          id="budget-startDate"
          name="startDate"
          type="date"
          value={fields.startDate}
          onChange={handleChange}
          aria-invalid={Boolean(errors.startDate)}
          aria-describedby={errors.startDate ? 'budget-startDate-error' : undefined}
          required
        />
        {errors.startDate && (
          <span id="budget-startDate-error" role="alert" className="field-error">
            {errors.startDate}
          </span>
        )}
      </div>

      {/* Actions */}
      <div>
        <button type="submit">{isEditMode ? 'Save Changes' : 'Create Budget'}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}