import React from 'react';

/**
 * Alert - Siguiendo regla estricta de SIGEA:
 * "Alertas siempre en la misma pareja de colores: fondo brand-100 (#fdecec) con texto brand-700 (#7a0c1e)"
 */
export default function Alert({ title, message, onClose, variant = 'error' }) {
  if (!message && !title) return null;

  const isSuccess = variant === 'success';

  return (
    <div
      role="alert"
      className={`w-full rounded-[8px] p-4 flex items-start gap-3 transition-all ${
        isSuccess
          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          : 'bg-[#fdecec] text-[#7a0c1e] border border-[#fbd0d4]'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isSuccess ? (
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-[#7a0c1e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {message && <div className="font-normal leading-relaxed">{message}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 text-current opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Cerrar notificación"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
