import { computeBudgetSpending, isOverspent, progressRatio } from '../src/lib/budget.js';
import { describe, it, expect } from 'vitest';

// Helper to build a minimal transaction object
function makeTx(categoryId: string | null, date: string, amount: number) {
  return { categoryId, date, amount };
}

// A budget that tracks category 'cat-food' on a monthly period
const foodBudget = { categoryId: 'cat-food', period: 'monthly', limit: 300 };

// Reference date sitting in mid-month
const REF = '2024-03-15';

describe('computeBudgetSpending', () => {
  it('returns 0 when transaction array is empty (Req 4.5)', () => {
    expect(computeBudgetSpending(foodBudget, [], REF)).toBe(0);
  });

  it('returns 0 when no transactions match the category', () => {
    const txs = [
      makeTx('cat-travel', '2024-03-10', 50),
      makeTx('cat-travel', '2024-03-12', 80),
    ];
    expect(computeBudgetSpending(foodBudget, txs, REF)).toBe(0);
  });

  it('sums transactions that match category and fall within the period', () => {
    const txs = [
      makeTx('cat-food', '2024-03-01', 100),
      makeTx('cat-food', '2024-03-15', 80),
      makeTx('cat-food', '2024-03-31', 60),
    ];
    expect(computeBudgetSpending(foodBudget, txs, REF)).toBeCloseTo(240);
  });

  it('excludes transactions outside the period even if category matches', () => {
    const txs = [
      makeTx('cat-food', '2024-02-28', 200), // previous month
      makeTx('cat-food', '2024-04-01', 150), // next month
      makeTx('cat-food', '2024-03-10', 50),  // within period
    ];
    expect(computeBudgetSpending(foodBudget, txs, REF)).toBeCloseTo(50);
  });

  it('excludes transactions with wrong category that are in the period', () => {
    const txs = [
      makeTx('cat-food', '2024-03-05', 40),
      makeTx('cat-other', '2024-03-05', 999),
    ];
    expect(computeBudgetSpending(foodBudget, txs, REF)).toBeCloseTo(40);
  });

  it('excludes transactions where categoryId is null or undefined', () => {
    const txs = [
      makeTx(null, '2024-03-10', 100),
      makeTx(undefined, '2024-03-10', 200),
    ];
    expect(computeBudgetSpending(foodBudget, txs, REF)).toBe(0);
  });

  it('handles a single matching transaction', () => {
    const txs = [makeTx('cat-food', '2024-03-20', 75)];
    expect(computeBudgetSpending(foodBudget, txs, REF)).toBeCloseTo(75);
  });

  it('includes boundary dates (first and last day of period)', () => {
    const txs = [
      makeTx('cat-food', '2024-03-01', 10), // first day of month
      makeTx('cat-food', '2024-03-31', 20), // last day of month
    ];
    expect(computeBudgetSpending(foodBudget, txs, REF)).toBeCloseTo(30);
  });

  it('works with weekly period', () => {
    // REF is 2024-03-15 (Friday). startOfWeek is Sunday 2024-03-10, endOfWeek is Saturday 2024-03-16.
    const weeklyBudget = { categoryId: 'cat-food', period: 'weekly', limit: 100 };
    const txs = [
      makeTx('cat-food', '2024-03-10', 10), // Sunday — in week
      makeTx('cat-food', '2024-03-15', 20), // Friday — in week
      makeTx('cat-food', '2024-03-09', 50), // Saturday before — outside
    ];
    expect(computeBudgetSpending(weeklyBudget, txs, REF)).toBeCloseTo(30);
  });

  it('works with yearly period', () => {
    const yearlyBudget = { categoryId: 'cat-food', period: 'yearly', limit: 5000 };
    const txs = [
      makeTx('cat-food', '2024-01-01', 100),
      makeTx('cat-food', '2024-12-31', 200),
      makeTx('cat-food', '2023-12-31', 999), // previous year
    ];
    expect(computeBudgetSpending(yearlyBudget, txs, REF)).toBeCloseTo(300);
  });

  it('handles negative amounts (refunds)', () => {
    const txs = [
      makeTx('cat-food', '2024-03-05', 100),
      makeTx('cat-food', '2024-03-10', -20), // refund
    ];
    expect(computeBudgetSpending(foodBudget, txs, REF)).toBeCloseTo(80);
  });

  it('returns 0 when category has no matching transactions (Req 4.5)', () => {
    // All transactions exist but none for this budget's category
    const txs = [
      makeTx('cat-rent', '2024-03-01', 1200),
      makeTx('cat-util', '2024-03-05', 80),
    ];
    expect(computeBudgetSpending(foodBudget, txs, REF)).toBe(0);
  });
});

describe('isOverspent', () => {
  it('returns false when spent equals limit (Req 4.3)', () => {
    expect(isOverspent(300, 300)).toBe(false);
  });

  it('returns false when spent is below limit', () => {
    expect(isOverspent(100, 300)).toBe(false);
    expect(isOverspent(0, 300)).toBe(false);
  });

  it('returns true when spent exceeds limit (Req 4.3)', () => {
    expect(isOverspent(301, 300)).toBe(true);
    expect(isOverspent(1000, 300)).toBe(true);
  });

  it('returns false when both spent and limit are zero', () => {
    expect(isOverspent(0, 0)).toBe(false);
  });

  it('returns true for fractional overspend', () => {
    expect(isOverspent(100.01, 100)).toBe(true);
  });

  it('returns false for fractional underspend', () => {
    expect(isOverspent(99.99, 100)).toBe(false);
  });
});

describe('progressRatio', () => {
  it('returns 0 when limit is 0 to avoid division by zero', () => {
    expect(progressRatio(0, 0)).toBe(0);
    expect(progressRatio(100, 0)).toBe(0);
  });

  it('returns 0 when nothing is spent', () => {
    expect(progressRatio(0, 300)).toBe(0);
  });

  it('returns 0.5 when half the budget is spent (Req 4.2)', () => {
    expect(progressRatio(150, 300)).toBeCloseTo(0.5);
  });

  it('returns 1 when exactly at limit', () => {
    expect(progressRatio(300, 300)).toBeCloseTo(1);
  });

  it('returns > 1 when overspent (Req 4.3)', () => {
    expect(progressRatio(600, 300)).toBeCloseTo(2);
    expect(progressRatio(450, 300)).toBeCloseTo(1.5);
  });

  it('handles fractional inputs', () => {
    expect(progressRatio(1, 3)).toBeCloseTo(0.3333);
  });

  it('handles large values correctly', () => {
    expect(progressRatio(10000, 50000)).toBeCloseTo(0.2);
  });
});