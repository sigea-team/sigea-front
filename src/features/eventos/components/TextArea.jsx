/**
 * @file TextArea.jsx
 * @description Área de texto con el mismo estilo que el Input del sistema de diseño
 * (usada para objetivo y descripción del evento).
 * @module features/eventos/components/TextArea
 */
export default function TextArea({ label, id, value, onChange, placeholder, rows = 3, error, helperText }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#1f2023]">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className={`w-full p-3 rounded-[8px] bg-white text-sm text-[#1f2023] placeholder-[#9ca0a6] border outline-none transition-colors resize-y ${
          error
            ? 'border-[#a6192e] focus:border-[#7a0c1e] focus:ring-1 focus:ring-[#7a0c1e]'
            : 'border-[#d8dadf] hover:border-[#9ca0a6] focus:border-[#a6192e] focus:ring-1 focus:ring-[#a6192e]'
        }`}
      />
      {error ? (
        <p className="text-xs text-[#7a0c1e] font-medium mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#5b5f66] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
