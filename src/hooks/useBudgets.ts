import { useMemo } from 'react';
import { computeBudgetSpending, progressRatio, isOverspent } from '../lib/budget.js';
import type { AppState } from '../lib/types.js';
import type { Budget } from '../lib/types.js';

export interface BudgetProgress extends Budget {
  spent: number;
  ratio: number;
  overspent: boolean;
}

export function useBudgets(state: AppState): BudgetProgress[] {
  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return state.budgets.map((budget) => {
      const spent = computeBudgetSpending(budget, state.transactions, today);
      return {
        ...budget,
        spent,
        ratio: progressRatio(spent, budget.limit),
        overspent: isOverspent(spent, budget.limit),
      };
    });
  }, [state.budgets, state.transactions]);
}