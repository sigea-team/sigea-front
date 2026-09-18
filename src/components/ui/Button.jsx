import React from 'react';

/**
 * @file Button.jsx
 * @description Componente de botón de acción conforme a la identidad visual institucional de SIGEA.
 * Maneja estilos primarios (`brand-600` #a6192e, hover `brand-700` #7a0c1e), secundario y outline,
 * además de soporte nativo para indicador de carga (`loading`) con bloqueo de clics repetidos.
 * @module components/ui/Button
 */

/**
 * @typedef {Object} ButtonProps
 * @property {React.ReactNode} children - Contenido o texto interno del botón.
 * @property {'button'|'submit'|'reset'} [type='button'] - Tipo de botón HTML nativo.
 * @property {'primary'|'secondary'|'outline'} [variant='primary'] - Variante estilística según la jerarquía de la acción.
 * @property {boolean} [loading=false] - Si es true, despliega un spinner giratorio y deshabilita la interacción.
 * @property {boolean} [disabled=false] - Deshabilita el botón si está en verdadero o si loading está activo.
 * @property {function(React.MouseEvent<HTMLButtonElement>): void} [onClick] - Función ejecutada al hacer clic sobre el botón.
 * @property {string} [className=''] - Clases utilitarias CSS adicionales.
 */

/**
 * Renderiza un botón interactivo adaptado a las especificaciones de diseño SIGEA.
 *
 * @component
 * @param {ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>} props - Propiedades del botón.
 * @returns {JSX.Element} Elemento HTML button estilizado.
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'outline'
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const baseStyles = 'h-11 px-6 rounded-[8px] font-medium text-sm transition-all duration-150 inline-flex items-center justify-center gap-2 select-none cursor-pointer focus:outline-none';

  const variants = {
    primary: 'bg-[#a6192e] text-white hover:bg-[#7a0c1e] active:bg-[#600816] disabled:bg-[#d8dadf] disabled:text-[#9ca0a6] disabled:cursor-not-allowed shadow-sm',
    secondary: 'bg-[#edeeef] text-[#1f2023] hover:bg-[#d8dadf] disabled:opacity-50 disabled:cursor-not-allowed',
    outline: 'border border-[#d8dadf] text-[#1f2023] hover:bg-[#f7f7f8] disabled:opacity-50 disabled:cursor-not-allowed',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Procesando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
