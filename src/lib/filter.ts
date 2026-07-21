export interface DateRange {
  from: string;
  to: string;
}

export interface AmountRange {
  min: number;
  max: number;
}

export interface FilterCriteria {
  accountId?: string | null;
  categoryId?: string | null;
  dateRange?: DateRange | null;
  amountRange?: AmountRange | null;
}

/**
 * Apply all non-null filter criteria using AND logic.
 * Returns filtered array of transactions.
 */
export function applyFilters<T extends { accountId?: string; categoryId?: string | null; date?: string; amount?: number }>(
  transactions: T[],
  criteria: FilterCriteria
): T[] {
  if (!criteria) return transactions;

  const { accountId, categoryId, dateRange, amountRange } = criteria;

  return transactions.filter((t) => {
    // accountId: exact match
    if (accountId != null && t.accountId !== accountId) {
      return false;
    }

    // categoryId: exact match; treat null/undefined t.categoryId as 'uncategorized'
    if (categoryId != null) {
      const tCategory = t.categoryId ?? 'uncategorized';
      if (tCategory !== categoryId) {
        return false;
      }
    }

    // dateRange: string comparison works for YYYY-MM-DD
    if (dateRange != null) {
      const tDate = t.date ?? '';
      if (tDate < dateRange.from || tDate > dateRange.to) {
        return false;
      }
    }

    // amountRange: numeric comparison
    if (amountRange != null) {
      const tAmount = t.amount ?? 0;
      if (tAmount < amountRange.min || tAmount > amountRange.max) {
        return false;
      }
    }

    return true;
  });
}