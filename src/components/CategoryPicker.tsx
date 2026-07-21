import type { Category } from '../lib/types.js';

export interface CategoryPickerProps {
  categories: Category[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps): JSX.Element {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value || null)}>
      <option value="">Uncategorized</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  );
}