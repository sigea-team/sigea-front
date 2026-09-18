import React from 'react';

/**
 * @file Input.jsx
 * @description Componente de campo de entrada de texto estandarizado para el sistema SIGEA.
 * Aplica los estilos institucionales: radio de 8px, borde `field-border` (#d8dadf) y 
 * resaltado de estados de error en rojo institucional (`brand-600` #a6192e / `brand-700` #7a0c1e).
 * @module components/ui/Input
 */

/**
 * @typedef {Object} InputProps
 * @property {string} [label] - Etiqueta de texto descriptiva visible sobre el input.
 * @property {string} [id] - Identificador único HTML para accesibilidad del control.
 * @property {string} [name] - Nombre del campo para el formulario.
 * @property {'text'|'password'|'email'|'tel'|'number'} [type='text'] - Tipo de dato de entrada HTML.
 * @property {string} value - Valor controlado actual del campo.
 * @property {function(React.ChangeEvent<HTMLInputElement>): void} onChange - Callback invocado al modificar el contenido.
 * @property {function(React.FocusEvent<HTMLInputElement>): void} [onBlur] - Callback invocado al perder el foco.
 * @property {string} [placeholder] - Texto de ayuda o placeholder visual cuando el campo está vacío.
 * @property {string|null} [error] - Mensaje de error de validación retornado para retroalimentación visual.
 * @property {boolean} [required=false] - Indica si el campo es obligatorio (muestra asterisco rojo).
 * @property {boolean} [disabled=false] - Inhabilita la edición del campo visual y funcionalmente.
 * @property {string} [helperText] - Texto secundario o descriptivo al pie del campo.
 * @property {React.ReactNode} [rightElement] - Elemento complementario en el extremo derecho (ej. botón ver/ocultar contraseña).
 */

/**
 * Renderiza un campo de entrada reutilizable adaptado a la identidad gráfica de SIGEA.
 *
 * @component
 * @param {InputProps & React.InputHTMLAttributes<HTMLInputElement>} props - Propiedades del componente Input.
 * @returns {JSX.Element} Elemento JSX que contiene label, campo de entrada y feedback de validación.
 */
export default function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  disabled = false,
  helperText,
  rightElement,
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
      <div className="relative flex items-center">
        <input
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-11 px-3.5 rounded-[8px] bg-white text-sm text-[#1f2023] placeholder-[#9ca0a6] border transition-colors outline-none
            ${error
              ? 'border-[#a6192e] focus:border-[#7a0c1e] focus:ring-1 focus:ring-[#7a0c1e]'
              : 'border-[#d8dadf] hover:border-[#9ca0a6] focus:border-[#a6192e] focus:ring-1 focus:ring-[#a6192e]'
            }
            ${disabled ? 'bg-[#edeeef] text-[#9ca0a6] cursor-not-allowed' : ''}
            ${rightElement ? 'pr-11' : ''}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center text-[#5b5f66]">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-[#7a0c1e] font-medium mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#5b5f66] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
