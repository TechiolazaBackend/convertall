'use client';

export default function MinimalSelect({ value, onChange, options = [], disabled = false }) {
  return (
    <select className="minimal-select" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
