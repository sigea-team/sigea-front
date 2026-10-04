import { AlertTriangle } from 'lucide-react';

/**
 * @file AlertaError.jsx
 * @description Alerta de error o bloqueo del sistema de diseño SIGEA:
 * fondo brand-100 con texto brand-700 (única pareja permitida para alertas).
 * @module features/eventos/components/AlertaError
 */
export default function AlertaError({ titulo, children }) {
  return (
    <div role="alert" className="p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-[#a6192e] shrink-0 mt-0.5" />
      <div className="text-sm">
        {titulo && <p className="font-bold">{titulo}</p>}
        <div className={titulo ? 'mt-0.5 text-xs leading-relaxed' : 'leading-relaxed'}>{children}</div>
      </div>
    </div>
  );
}
