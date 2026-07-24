import { useState, useMemo } from 'react';
import { applyFilters } from '../lib/filter.js';
import { sortTransactions } from '../lib/sort.js';
import type { Transaction } from '../lib/types.js';
import type { FilterCriteria } from '../lib/filter.js';
import type { SortConfig } from '../lib/sort.js';

const DEFAULT_FILTERS: FilterCriteria = {
  accountId: null,
  categoryId: null,
  dateRange: null,
  amountRange: null,
};

const DEFAULT_SORT: SortConfig = {
  field: 'date',
  direction: 'desc',
};

export function useFilters(transactions: Transaction[]) {
  const [filters, setFilters] = useState<FilterCriteria>(DEFAULT_FILTERS);
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);

  const filteredTransactions = useMemo(() => {
    const filtered = applyFilters(transactions, filters);
    return sortTransactions(filtered, sortConfig);
  }, [transactions, filters, sortConfig]);

  return {
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    filteredTransactions,
  };
}