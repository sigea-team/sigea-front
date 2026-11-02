import { Users } from 'lucide-react';

/**
 * @file AforoBadge.jsx
 * @description Badge que muestra el aforo máximo de una sala con formato y tooltip.
 */
export default function AforoBadge({ aforo, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#f7f7f8] text-[#1f2023] border border-[#e5e7ea] ${className}`}
      title={`Capacidad máxima: ${aforo} personas`}
    >
      <Users className="w-3.5 h-3.5 text-[#5b5f66]" aria-hidden="true" />
      <span>
        Aforo: <strong className="font-semibold text-[#1f2023]">{aforo}</strong>
      </span>
    </span>
  );
}

