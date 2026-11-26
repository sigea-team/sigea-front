import { ESTADOS_EVENTO } from '../eventoUtils';

/**
 * @file EstadoEventoBadge.jsx
 * @description Píldora con el estado de un evento (HU-04, Criterio 4).
 * Cumple estrictamente con el sistema de diseño SIGEA (COLOR_STYLES.md):
 * - Activo / publicado / en ejecución: fondo brand-600, texto surface (blanco), sin borde.
 * - Pendiente / en configuración: fondo surface-muted, texto ink-600, borde border.
 * - Cerrado / finalizado: fondo brand-100, texto brand-700, sin borde.
 * No utiliza puntos de color, siguiendo las pautas de accesibilidad y diseño del proyecto.
 * @module features/eventos/components/EstadoEventoBadge
 */

/**
 * @param {{ estado: 'en_configuracion'|'habilitado'|'en_ejecucion'|'cerrado', className?: string }} props
 */
export default function EstadoEventoBadge({ estado, className = '' }) {
  const estilosPorEstado = {
    habilitado: 'bg-brand-600 text-surface',
    en_ejecucion: 'bg-brand-600 text-surface',
    en_configuracion: 'bg-surface-muted text-ink-600 border border-border',
    cerrado: 'bg-brand-100 text-brand-700',
  };

  const clase = estilosPorEstado[estado] || 'bg-surface-muted text-ink-600 border border-border';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${clase} ${className}`}
    >
      {ESTADOS_EVENTO[estado] || estado}
    </span>
  );
}
