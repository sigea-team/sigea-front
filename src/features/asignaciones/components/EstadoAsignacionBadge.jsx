import PropTypes from 'prop-types';
import { ESTADOS_ASIGNACION } from '../asignacionUtils';

/**
 * @file EstadoAsignacionBadge.jsx
 * @description Estado de una asignación de evaluación: pendiente, en proceso o completada (HU-16).
 * @module features/asignaciones/components/EstadoAsignacionBadge
 */

const ESTILOS = {
  pendiente: { pill: 'bg-[#f7f7f8] text-[#5b5f66] border-[#d8dadf]', punto: 'bg-[#9ca0a6]' },
  en_proceso: { pill: 'bg-white text-[#1f2023] border-[#d8dadf]', punto: 'bg-[#a6192e]' },
  completada: { pill: 'bg-emerald-50 text-emerald-800 border-emerald-200', punto: 'bg-emerald-600' },
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
