import PropTypes from 'prop-types';
import { claseGrupo, etiquetaClasificacion } from '../clasificacionUtils';

/**
 * @file ClasificacionBadge.jsx
 * @description Distintivo de la clasificación de una propuesta (HU-18): Aceptada, Aceptada con modificaciones
 * o Rechazada. Sin clasificación muestra «Sin clasificar».
 * @module features/clasificacion/components/ClasificacionBadge
 */

/**
 * @param {Object} props
 * @param {'aprobada'|'aprobada_con_ajustes'|'rechazada'|null} [props.clasificacion]
 * @param {string} [props.etiqueta] - Texto a mostrar; por defecto, el nombre de la clasificación.
 */
export default function ClasificacionBadge({ clasificacion = null, etiqueta }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${claseGrupo(
        clasificacion || 'sin_clasificar'
      )}`}
    >
      {etiqueta || etiquetaClasificacion(clasificacion)}
    </span>
  );
}

ClasificacionBadge.propTypes = {
  clasificacion: PropTypes.oneOf(['aprobada', 'aprobada_con_ajustes', 'rechazada', null]),
  etiqueta: PropTypes.string,
};
