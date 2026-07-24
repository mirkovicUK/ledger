/**
 * Money math utilities for the Ledger app.
 * All amounts are plain JavaScript numbers (no integer cents).
 */

import type { Transaction } from './types.js';

/**
 * Sum all transaction amounts.
 * @param {Array<{amount: number}>} transactions
 * @returns {number} Sum of amounts, or 0 for an empty array.
 */
export function sumAmounts(transactions: Array<{ amount: number }>): number {
  if (!transactions || transactions.length === 0) return 0;
  return transactions.reduce((acc, t) => acc + t.amount, 0);
}

/**
 * Compute balance for a specific account by filtering transactions
 * to those matching accountId, then summing their amounts.
 * @param {Array<{amount: number, accountId: string}>} transactions
 * @param {string} accountId
 * @returns {number} Sum of matching transaction amounts, or 0 if none match.
 */
export function accountBalance(transactions: Array<{ amount: number; accountId: string }>, accountId: string): number {
  if (!transactions || transactions.length === 0) return 0;
  const filtered = transactions.filter((t) => t.accountId === accountId);
  return sumAmounts(filtered);
}

/**
 * Compute total balance across all accounts by summing all transaction amounts.
 * @param {Array<{amount: number}>} transactions
 * @returns {number} Sum of all amounts, or 0 for an empty array.
 */
export function totalBalance(transactions: Array<{ amount: number }>): number {
  return sumAmounts(transactions);
}

/**
 * Compute the budget spending ratio (spent / limit).
 * @param {number} spent
 * @param {number} limit
 * @returns {number} spent / limit, or 0 if limit is 0.
 */
export function budgetRatio(spent: number, limit: number): number {
  if (limit === 0) return 0;
  return spent / limit;
}