import PropTypes from 'prop-types';
import { ESTADOS_ASIGNACION } from '../asignacionUtils';

/**
 * @file EstadoAsignacionBadge.jsx
 * @description Estado de una asignación de evaluación: pendiente, en proceso o completada (HU-16).
 * @module features/asignaciones/components/EstadoAsignacionBadge
 */

const ESTILOS = {
  pendiente: { pill: 'bg-surface-muted text-ink-600 border-field-border', punto: 'bg-ink-300' },
  en_proceso: { pill: 'bg-white text-ink-900 border-field-border', punto: 'bg-brand-600' },
  completada: { pill: 'bg-brand-600 text-surface border-transparent', punto: 'bg-surface' },
};

/**
 * @param {Object} props
 * @param {'pendiente'|'en_proceso'|'completada'} props.estado
 */
export default function EstadoAsignacionBadge({ estado }) {
  const estilo = ESTILOS[estado] || ESTILOS.pendiente;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${estilo.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${estilo.punto}`} aria-hidden="true"></span>
      {ESTADOS_ASIGNACION[estado] || estado}
    </span>
  );
}

EstadoAsignacionBadge.propTypes = {
  estado: PropTypes.string.isRequired,
};
