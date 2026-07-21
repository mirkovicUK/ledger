export function CategoryPicker({ categories, value, onChange }) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value || null)}>
      <option value="">Uncategorized</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  );
}
