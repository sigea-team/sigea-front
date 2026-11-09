import { esConvocatoriaExpirada } from '../convocatoriaUtils';

/**
 * @file EstadoConvocatoriaBadge.jsx
 * @description Badge/pill para el estado de una convocatoria en SIGEA.
 * Muestra BORRADOR, ABIERTA, o CERRADA (por fecha cumplida o estado explícito).
 * Respeta la paleta institucional (brand-600 #a6192e, brand-100 #fdecec, surface-muted, ink-600).
 * @module features/convocatorias/components/EstadoConvocatoriaBadge
 */

/**
 * Renderiza el badge de estado para una convocatoria.
 * @param {Object} props
 * @param {string} props.estado - Estado de la convocatoria ('BORRADOR' | 'ABIERTA' | 'CERRADA').
 * @param {string|Date} [props.fechaCierre] - Fecha de cierre para evaluar expiración automática.
 */
export default function EstadoConvocatoriaBadge({ estado, fechaCierre }) {
  const expirada = fechaCierre ? esConvocatoriaExpirada(fechaCierre) : false;
  const estadoUpper = (estado || '').toUpperCase();

  if (estadoUpper === 'BORRADOR') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-muted text-ink-600 border border-field-border">
        <span className="w-1.5 h-1.5 rounded-full bg-ink-300 mr-1.5"></span>
        Borrador
      </span>
    );
  }

  if (expirada || estadoUpper === 'CERRADA') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-700 border border-brand-600">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mr-1.5"></span>
        Cerrada (Vencida)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-600 text-surface">
      <span className="w-1.5 h-1.5 rounded-full bg-surface mr-1.5"></span>
      {estadoUpper === 'PUBLICADA' ? 'Publicada' : 'Abierta'}
    </span>
  );
}
