/**
 * FilterBar — filter and sort controls for the transaction list.
 *
 * Props:
 *   accounts       — array of { id, name }
 *   categories     — array of { id, name }
 *   filters        — { accountId, categoryId, dateRange, amountRange }
 *   sortConfig     — { field, direction }
 *   onFiltersChange(newFilters)   — called when any filter changes
 *   onSortChange(newSortConfig)   — called when sort config changes
 */
import type { Pick as PickType } from '../lib/types.js';
import type { FilterCriteria } from '../lib/filter.js';
import type { SortConfig } from '../lib/sort.js';
import type { Account, Category } from '../lib/types.js';
import { useState } from 'react';

export interface FilterBarProps {
  accounts?: PickType<Account, 'id' | 'name'>[];
  categories?: PickType<Category, 'id' | 'name'>[];
  filters?: FilterCriteria;
  sortConfig?: Partial<SortConfig>;
  onFiltersChange: (filters: FilterCriteria) => void;
  onSortChange: (sortConfig: SortConfig) => void;
}

export function FilterBar(props: FilterBarProps): JSX.Element {
  const {
    accounts = [],
    categories = [],
    filters = {},
    sortConfig = {},
    onFiltersChange,
    onSortChange,
  } = props;
  const { accountId = null, categoryId = null, dateRange = null, amountRange = null } = filters;
  const { field = 'date', direction = 'desc' } = sortConfig;

  // ── filter helpers ──────────────────────────────────────────────────────────

  function handleAccountChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onFiltersChange({ ...filters, accountId: e.target.value || null });
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onFiltersChange({ ...filters, categoryId: e.target.value || null });
  }

  function handleDateFrom(e: React.ChangeEvent<HTMLInputElement>) {
    const from = e.target.value || null;
    const to = dateRange?.to ?? null;
    onFiltersChange({
      ...filters,
      dateRange: from || to ? { from: from ?? '', to: to ?? '' } : null,
    });
  }

  function handleDateTo(e: React.ChangeEvent<HTMLInputElement>) {
    const from = dateRange?.from ?? null;
    const to = e.target.value || null;
    onFiltersChange({
      ...filters,
      dateRange: from || to ? { from: from ?? '', to: to ?? '' } : null,
    });
  }

  function handleAmountMin(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const min = raw === '' ? null : parseFloat(raw);
    const max = amountRange?.max ?? null;
    onFiltersChange({
      ...filters,
      amountRange: min !== null || max !== null ? { min: min ?? null, max: max ?? null } : null,
    });
  }

  function handleAmountMax(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const min = amountRange?.min ?? null;
    const max = raw === '' ? null : parseFloat(raw);
    onFiltersChange({
      ...filters,
      amountRange: min !== null || max !== null ? { min: min ?? null, max: max ?? null } : null,
    });
  }

  // ── sort helpers ─────────────────────────────────────────────────────────────

  function handleFieldChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onSortChange({ field: e.target.value as SortConfig['field'], direction });
  }

  function handleDirectionToggle() {
    onSortChange({ field, direction: direction === 'asc' ? 'desc' : 'asc' });
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="filter-bar" role="search" aria-label="Filter and sort transactions">
      {/* ── Account filter ── */}
      <label htmlFor="filter-account">
        Account
        <select
          id="filter-account"
          value={accountId ?? ''}
          onChange={handleAccountChange}
        >
          <option value="">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
      </label>

      {/* ── Category filter ── */}
      <label htmlFor="filter-category">
        Category
        <select
          id="filter-category"
          value={categoryId ?? ''}
          onChange={handleCategoryChange}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </label>

      {/* ── Date range ── */}
      <label htmlFor="filter-date-from">
        Date from
        <input
          id="filter-date-from"
          type="date"
          value={dateRange?.from ?? ''}
          onChange={handleDateFrom}
        />
      </label>

      <label htmlFor="filter-date-to">
        Date to
        <input
          id="filter-date-to"
          type="date"
          value={dateRange?.to ?? ''}
          onChange={handleDateTo}
        />
      </label>

      {/* ── Amount range ── */}
      <label htmlFor="filter-amount-min">
        Amount min
        <input
          id="filter-amount-min"
          type="number"
          step="any"
          value={amountRange?.min ?? ''}
          onChange={handleAmountMin}
          placeholder="Min"
        />
      </label>

      <label htmlFor="filter-amount-max">
        Amount max
        <input
          id="filter-amount-max"
          type="number"
          step="any"
          value={amountRange?.max ?? ''}
          onChange={handleAmountMax}
          placeholder="Max"
        />
      </label>

      {/* ── Sort field ── */}
      <label htmlFor="sort-field">
        Sort by
        <select
          id="sort-field"
          value={field}
          onChange={handleFieldChange}
        >
          <option value="date">Date</option>
          <option value="amount">Amount</option>
          <option value="description">Description</option>
        </select>
      </label>

      {/* ── Sort direction toggle ── */}
      <button
        type="button"
        onClick={handleDirectionToggle}
        aria-label={`Sort direction: ${direction === 'asc' ? 'ascending' : 'descending'}. Click to toggle.`}
        aria-pressed={direction === 'asc'}
      >
        {direction === 'asc' ? '↑ Asc' : '↓ Desc'}
      </button>
    </div>
  );
}