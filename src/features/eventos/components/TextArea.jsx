/**
 * @file TextArea.jsx
 * @description Área de texto con el mismo estilo que el Input del sistema de diseño
 * (usada para objetivo y descripción del evento).
 * @module features/eventos/components/TextArea
 */
export default function TextArea({ label, id, value, onChange, placeholder, rows = 3, error, helperText, maxLength }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-900">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full p-3 rounded-[8px] bg-white text-sm text-ink-900 placeholder-ink-300 border outline-none transition-colors resize-y ${
          error
            ? 'border-brand-600 focus:border-brand-700 focus:ring-1 focus:ring-brand-700'
            : 'border-field-border hover:border-ink-300 focus:border-brand-600 focus:ring-1 focus:ring-brand-600'
        }`}
      />
      <div className="flex justify-between gap-3">
        {error ? (
          <p className="text-xs text-brand-700 font-medium mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-ink-600 mt-0.5">{helperText}</p>
        ) : (
          <span />
        )}
        {maxLength && (
          <p className="text-xs text-ink-600 mt-0.5 shrink-0 tabular-nums">
            {(value || '').length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
