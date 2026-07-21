import { periodStart, periodEnd, isWithinRange, parseDate } from './date.js';
import type { Budget, Transaction } from './types.js';

export function computeBudgetSpending(budget: Pick<Budget, 'categoryId' | 'period'>, transactions: Array<Pick<Transaction, 'categoryId' | 'date' | 'amount'>>, referenceDate: string): number {
  const start = periodStart(referenceDate, budget.period);
  const end = periodEnd(referenceDate, budget.period);

  return transactions
    .filter(t => t.categoryId === budget.categoryId && isWithinRange(parseDate(t.date), start, end))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function isOverspent(spent: number, limit: number): boolean {
  return spent > limit;
}

export function progressRatio(spent: number, limit: number): number {
  if (limit === 0) return 0;
  return spent / limit;
}