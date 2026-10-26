import PropTypes from 'prop-types';
import { AlertTriangle, Ban } from 'lucide-react';
import { NIVELES_CONFLICTO } from '../asignacionUtils';

/**
 * @file ConflictoBadge.jsx
 * @description Indicador del conflicto de interés entre un evaluador y una propuesta (HU-16, Criterio 2).
 * - BLOQUEANTE: el evaluador es autor de la propuesta; no se puede asignar.
 * - ADVERTENCIA: posible conflicto (comparte afiliación con un autor); se asigna confirmando.
 * - NINGUNO: no muestra nada.
 * Usa solo la pareja de alerta del sistema de diseño (brand-100 / brand-700).
 * @module features/asignaciones/components/ConflictoBadge
 */

/**
 * @param {Object} props
 * @param {'NINGUNO'|'ADVERTENCIA'|'BLOQUEANTE'} props.nivel
 * @param {string} [props.detalle] - Explicación que se muestra al pasar el cursor.
 */
export default function ConflictoBadge({ nivel, detalle }) {
  if (nivel === NIVELES_CONFLICTO.BLOQUEANTE) {
    return (
      <span
        title={detalle || undefined}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fdecec] text-[#7a0c1e] border border-[#a6192e]/20"
      >
        <Ban className="w-3 h-3" aria-hidden="true" />
        Conflicto: no asignable
      </span>
    );
  }
  if (nivel === NIVELES_CONFLICTO.ADVERTENCIA) {
    return (
      <span
        title={detalle || undefined}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-[#7a0c1e] border border-[#a6192e]/40"
      >
        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
        Posible conflicto
      </span>
    );
  }
  return null;
}

ConflictoBadge.propTypes = {
  nivel: PropTypes.oneOf(['NINGUNO', 'ADVERTENCIA', 'BLOQUEANTE']),
  detalle: PropTypes.string,
};
