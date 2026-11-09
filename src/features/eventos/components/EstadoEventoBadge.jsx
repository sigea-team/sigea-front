import { ESTADOS_EVENTO } from '../eventoUtils';

/**
 * @file EstadoEventoBadge.jsx
 * @description Píldora con el estado de un evento (HU-04, Criterio 4).
 * Usa solo los tokens del sistema de diseño: el estado se distingue por el texto
 * y por el color del punto (brand-600 para el estado editable "en configuración").
 * @module features/eventos/components/EstadoEventoBadge
 */

const PUNTO_POR_ESTADO = {
  en_configuracion: 'bg-brand-600',
  habilitado: 'bg-ink-900',
  en_ejecucion: 'bg-ink-600',
  cerrado: 'bg-ink-300',
};

/**
 * @param {{ estado: 'en_configuracion'|'habilitado'|'en_ejecucion'|'cerrado' }} props
 */
export default function EstadoEventoBadge({ estado }) {
  const cerrado = estado === 'cerrado';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
        cerrado
          ? 'bg-surface-page text-ink-600 border-field-border'
          : 'bg-surface-muted text-ink-900 border-border'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${PUNTO_POR_ESTADO[estado] || 'bg-ink-300'}`} aria-hidden="true" />
      {ESTADOS_EVENTO[estado] || estado}
    </span>
  );
}
