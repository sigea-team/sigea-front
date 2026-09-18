import React from 'react';

/**
 * @file Select.jsx
 * @description Componente de lista desplegable (Combobox/Select) estandarizado para SIGEA.
 * Restringe la entrada a un conjunto cerrado de opciones válidas (como Tipo de Documento y Afiliación Institucional),
 * incorporando icono chevron decorativo y estilo conforme al sistema de diseño.
 * @module components/ui/Select
 */

/**
 * @typedef {Object} SelectOption
 * @property {string} value - Valor interno del elemento a persistir o enviar a la API.
 * @property {string} label - Texto descriptivo para visualización del usuario.
 */

/**
 * @typedef {Object} SelectProps
 * @property {string} [label] - Texto descriptivo del campo desplegable.
 * @property {string} [id] - Identificador único para el elemento HTML select.
 * @property {string} [name] - Nombre del control dentro del formulario.
 * @property {string} value - Valor seleccionado actualmente.
 * @property {function(React.ChangeEvent<HTMLSelectElement>): void} onChange - Callback invocado al seleccionar una opción.
 * @property {function(React.FocusEvent<HTMLSelectElement>): void} [onBlur] - Callback invocado al perder el foco.
 * @property {Array<SelectOption>} [options=[]] - Lista de opciones seleccionables.
 * @property {string} [placeholder='Seleccione una opción'] - Texto para la opción inactiva por defecto.
 * @property {string|null} [error] - Mensaje de error de validación asociado al campo.
 * @property {boolean} [required=false] - Define si el campo es obligatorio.
 * @property {boolean} [disabled=false] - Indica si el control está inhabilitado.
 * @property {string} [helperText] - Texto secundario aclaratorio al pie del selector.
 */

/**
 * Renderiza un menú desplegable adaptado a las pautas de estilo de SIGEA.
 *
 * @component
 * @param {SelectProps & React.SelectHTMLAttributes<HTMLSelectElement>} props - Propiedades del componente Select.
 * @returns {JSX.Element} Control select estilizado con label e indicadores de validación.
 */
export default function Select({
  label,
  id,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Seleccione una opción',
  error,
  required = false,
  disabled = false,
  helperText,
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id || name} className="text-sm font-medium text-[#1f2023] flex items-center gap-1">
          {label}
          {required && <span className="text-[#a6192e] font-bold">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id || name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`w-full h-11 px-3.5 pr-10 rounded-[8px] bg-white text-sm text-[#1f2023] border appearance-none transition-colors outline-none cursor-pointer
            ${!value ? 'text-[#9ca0a6]' : 'text-[#1f2023]'}
            ${error
              ? 'border-[#a6192e] focus:border-[#7a0c1e] focus:ring-1 focus:ring-[#7a0c1e]'
              : 'border-[#d8dadf] hover:border-[#9ca0a6] focus:border-[#a6192e] focus:ring-1 focus:ring-[#a6192e]'
            }
            ${disabled ? 'bg-[#edeeef] text-[#9ca0a6] cursor-not-allowed' : ''}
          `}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-[#1f2023]">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron down */}
        <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-[#5b5f66]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error ? (
        <p className="text-xs text-[#7a0c1e] font-medium mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#5b5f66] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
