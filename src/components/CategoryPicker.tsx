import type { Category } from '../lib/types.js';
import React from 'react';

export interface CategoryPickerProps {
  categories: Pick<Category, 'id' | 'name'>[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function CategoryPicker(props: CategoryPickerProps): React.JSX.Element {
  const { categories, value, onChange } = props;
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value || null)}>
      <option value="">Uncategorized</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  );
}