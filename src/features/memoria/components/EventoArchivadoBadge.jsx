import { Archive } from 'lucide-react';

/**
 * @file EventoArchivadoBadge.jsx
 * @description Etiqueta de un evento cerrado formalmente, cuya información está en la memoria histórica y es solo
 * de consulta (HU-28, Criterio 2).
 * @module features/memoria/components/EventoArchivadoBadge
 */
export default function EventoArchivadoBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-brand-600 bg-brand-100 text-brand-700 whitespace-nowrap ${className}`}
      title="Cerrado formalmente: su información está en la memoria histórica y solo se puede consultar"
    >
      <Archive className="w-3 h-3" aria-hidden="true" />
      Memoria histórica
    </span>
  );
}
