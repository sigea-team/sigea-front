import React from 'react';

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
