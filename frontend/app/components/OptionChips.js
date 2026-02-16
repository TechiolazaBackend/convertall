'use client';

export default function OptionChips({ value, onChange, options = [], disabled = false }) {
  return (
    <div className="option-chips" role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`chip ${value === option.value ? 'active' : ''}`}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          title={option.hint || option.label}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
