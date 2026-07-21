import { useMemo } from 'react';
import { computeBudgetSpending, progressRatio, isOverspent } from '../lib/budget.js';

export function useBudgets(state) {
  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return state.budgets.map(budget => {
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
