import React from 'react';

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
