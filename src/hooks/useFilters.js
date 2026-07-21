import { useState, useMemo } from 'react';
import { applyFilters } from '../lib/filter.js';
import { sortTransactions } from '../lib/sort.js';

const DEFAULT_FILTERS = {
  accountId: null,
  categoryId: null,
  dateRange: null,
  amountRange: null,
};

const DEFAULT_SORT = {
  field: 'date',
  direction: 'desc',
};

export function useFilters(transactions) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

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
