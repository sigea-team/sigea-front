import { Building, Monitor } from 'lucide-react';
import { ETIQUETAS_TIPO_SALA } from '../salaUtils';

/**
 * @file TipoSalaBadge.jsx
 * @description Badge visual para identificar si una sala es física o virtual.
 */
export default function TipoSalaBadge({ tipo }) {
  const esVirtual = tipo === 'virtual';
  const Icono = esVirtual ? Monitor : Building;
  const etiqueta = ETIQUETAS_TIPO_SALA[tipo] || (esVirtual ? 'Virtual' : 'Física');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        esVirtual
          ? 'bg-surface-muted text-ink-600 border border-border'
          : 'bg-brand-600 text-surface border-transparent'
      }`}
    >
      <Icono className="w-3.5 h-3.5" aria-hidden="true" />
      {etiqueta}
    </span>
  );
}

