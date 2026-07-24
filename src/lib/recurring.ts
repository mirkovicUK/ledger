import { parseDate, formatDate, advanceByFrequency } from './date.js';
import type { RecurringRule, Transaction } from './types.js';

/**
 * Expand a recurring rule into transactions from its lastExpandedDate
 * (or startDate if never expanded) up to referenceDate.
 *
 * - If lastExpandedDate is null, start from startDate itself.
 * - If lastExpandedDate is set, start from advanceByFrequency(lastExpandedDate)
 *   because lastExpandedDate has already been covered.
 *
 * After expansion, updatedRule.lastExpandedDate is set to the last generated
 * date. If no transactions were generated but startDate <= referenceDate, set
 * lastExpandedDate to referenceDate. Otherwise leave it unchanged.
 *
 * @param {RecurringRule} rule
 * @param {string} referenceDate - YYYY-MM-DD
 * @param {() => string} idGenerator
 * @returns {{ transactions: Transaction[], updatedRule: RecurringRule }}
 */
export function expandRule(rule: RecurringRule, referenceDate: string, idGenerator: () => string): { transactions: Transaction[], updatedRule: RecurringRule } {
  const refDate = parseDate(referenceDate);
  const startDate = parseDate(rule.startDate);

  // Determine the first date to generate
  let currentDate: Date;
  if (rule.lastExpandedDate == null) {
    currentDate = startDate;
  } else {
    currentDate = advanceByFrequency(parseDate(rule.lastExpandedDate), rule.frequency);
  }

  const transactions: Transaction[] = [];
  let lastGeneratedDate: Date | null = null;

  // Generate a transaction for each date <= referenceDate
  while (currentDate <= refDate) {
    transactions.push({
      id: idGenerator(),
      accountId: rule.accountId,
      amount: rule.amount,
      date: formatDate(currentDate),
      description: rule.description,
      categoryId: rule.categoryId ?? null,
      recurringRuleId: rule.id,
      createdAt: new Date().toISOString(),
    });

    lastGeneratedDate = currentDate;
    currentDate = advanceByFrequency(currentDate, rule.frequency);
  }

  // Determine the new lastExpandedDate for the updated rule
  let newLastExpandedDate: string | null = rule.lastExpandedDate;

  if (lastGeneratedDate !== null) {
    // At least one transaction was generated
    newLastExpandedDate = formatDate(lastGeneratedDate);
  } else if (startDate <= refDate) {
    // No new transactions but startDate is still within range — advance bookmark
    newLastExpandedDate = referenceDate;
  }
  // Otherwise keep lastExpandedDate as-is (startDate > referenceDate, nothing to do)

  const updatedRule: RecurringRule = { ...rule, lastExpandedDate: newLastExpandedDate };

  return { transactions, updatedRule };
}

/**
 * Expand all recurring rules, merging new transactions with existing ones.
 * Idempotent: calling twice with the same referenceDate produces no new transactions
 * because lastExpandedDate tracks what has already been generated.
 *
 * @param {RecurringRule[]} rules - Array of RecurringRule objects
 * @param {Transaction[]} existingTransactions - Already-stored transactions
 * @param {string} referenceDate - YYYY-MM-DD
 * @param {() => string} idGenerator
 * @returns {{ transactions: Transaction[], updatedRules: RecurringRule[] }}
 */
export function expandAllRules(rules: RecurringRule[], existingTransactions: Transaction[], referenceDate: string, idGenerator: () => string): { transactions: Transaction[], updatedRules: RecurringRule[] } {
  const allNewTransactions: Transaction[] = [];
  const updatedRules: RecurringRule[] = [];

  for (const rule of rules) {
    const { transactions: newTxs, updatedRule } = expandRule(rule, referenceDate, idGenerator);
    allNewTransactions.push(...newTxs);
    updatedRules.push(updatedRule);
  }

  return {
    transactions: [...existingTransactions, ...allNewTransactions],
    updatedRules,
  };
}