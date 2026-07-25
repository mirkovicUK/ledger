import { parseDate, formatDate, advanceByFrequency } from './date.js';
import type { RecurringRule, Transaction } from './types.js';

export interface ExpandRuleResult {
  transactions: Transaction[];
  updatedRule: RecurringRule;
}

export interface ExpandAllRulesResult {
  transactions: Transaction[];
  updatedRules: RecurringRule[];
}

export function expandRule(rule: RecurringRule, referenceDate: string, idGenerator: () => string): ExpandRuleResult {
  const refDate = parseDate(referenceDate);
  const startDate = parseDate(rule.startDate);

  let currentDate: Date;
  if (rule.lastExpandedDate == null) {
    currentDate = startDate;
  } else {
    currentDate = advanceByFrequency(parseDate(rule.lastExpandedDate), rule.frequency);
  }

  const transactions: Transaction[] = [];
  let lastGeneratedDate: Date | null = null;

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

  let newLastExpandedDate: string | null = rule.lastExpandedDate;

  if (lastGeneratedDate !== null) {
    newLastExpandedDate = formatDate(lastGeneratedDate);
  } else if (startDate <= refDate) {
    newLastExpandedDate = referenceDate;
  }

  const updatedRule: RecurringRule = { ...rule, lastExpandedDate: newLastExpandedDate };

  return { transactions, updatedRule };
}

export function expandAllRules(rules: RecurringRule[], existingTransactions: Transaction[], referenceDate: string, idGenerator: () => string): ExpandAllRulesResult {
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