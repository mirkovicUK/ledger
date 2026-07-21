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
// TypeScript Types
// ---------------------------------------------------------------------------

export type Account = z.infer<typeof AccountSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Budget = z.infer<typeof BudgetSchema>;
export type RecurringRule = z.infer<typeof RecurringRuleSchema>;
export type AppState = z.infer<typeof AppStateSchema>;
export type ExportPayload = z.infer<typeof ExportPayloadSchema>;

// ---------------------------------------------------------------------------
// Validation Helpers — each throws ZodError on failure, returns parsed value
// ---------------------------------------------------------------------------

export function validateAccount(data: unknown): Account {
  return AccountSchema.parse(data);
}

export function validateTransaction(data: unknown): Transaction {
  return TransactionSchema.parse(data);
}

export function validateCategory(data: unknown): Category {
  return CategorySchema.parse(data);
}

export function validateBudget(data: unknown): Budget {
  return BudgetSchema.parse(data);
}

export function validateRecurringRule(data: unknown): RecurringRule {
  return RecurringRuleSchema.parse(data);
}

export function validateAppState(data: unknown): AppState {
  return AppStateSchema.parse(data);
}

export function validateExportPayload(data: unknown): ExportPayload {
  return ExportPayloadSchema.parse(data);
}