import { z } from 'zod';

// ---------------------------------------------------------------------------
// Entity Schemas
// ---------------------------------------------------------------------------

export const AccountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  type: z.enum(['checking', 'savings', 'credit', 'cash', 'investment']),
  createdAt: z.string().datetime(),
});

export const TransactionSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  amount: z.number().finite(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1).max(200),
  categoryId: z.string().nullable().optional(),
  recurringRuleId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
});

export const BudgetSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1),
  limit: z.number().positive().finite(),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const RecurringRuleSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  amount: z.number().finite(),
  description: z.string().min(1).max(200),
  categoryId: z.string().nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lastExpandedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

// ---------------------------------------------------------------------------
// Aggregate Schemas
// ---------------------------------------------------------------------------

export const AppStateSchema = z.object({
  accounts: z.array(AccountSchema),
  transactions: z.array(TransactionSchema),
  categories: z.array(CategorySchema),
  budgets: z.array(BudgetSchema),
  recurringRules: z.array(RecurringRuleSchema),
});

export const ExportPayloadSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  data: AppStateSchema,
});

// ---------------------------------------------------------------------------
// Validation Helpers — each throws ZodError on failure, returns parsed value
// ---------------------------------------------------------------------------

/** @param {unknown} data @returns {import('zod').infer<typeof AccountSchema>} */
export function validateAccount(data) {
  return AccountSchema.parse(data);
}

/** @param {unknown} data @returns {import('zod').infer<typeof TransactionSchema>} */
export function validateTransaction(data) {
  return TransactionSchema.parse(data);
}

/** @param {unknown} data @returns {import('zod').infer<typeof CategorySchema>} */
export function validateCategory(data) {
  return CategorySchema.parse(data);
}

/** @param {unknown} data @returns {import('zod').infer<typeof BudgetSchema>} */
export function validateBudget(data) {
  return BudgetSchema.parse(data);
}

/** @param {unknown} data @returns {import('zod').infer<typeof RecurringRuleSchema>} */
export function validateRecurringRule(data) {
  return RecurringRuleSchema.parse(data);
}

/** @param {unknown} data @returns {import('zod').infer<typeof AppStateSchema>} */
export function validateAppState(data) {
  return AppStateSchema.parse(data);
}

/** @param {unknown} data @returns {import('zod').infer<typeof ExportPayloadSchema>} */
export function validateExportPayload(data) {
  return ExportPayloadSchema.parse(data);
}
