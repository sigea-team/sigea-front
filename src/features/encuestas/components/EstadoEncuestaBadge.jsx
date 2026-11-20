import PropTypes from 'prop-types';
import { infoEstadoEncuesta } from '../encuestaUtils';

/**
 * @file EstadoEncuestaBadge.jsx
 * @description Insignia del estado de una encuesta de satisfacción (HU-25): borrador, publicada o cerrada.
 * @module features/encuestas/components/EstadoEncuestaBadge
 */
export default function EstadoEncuestaBadge({ estado }) {
  const info = infoEstadoEncuesta(estado);
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${info.clases}`}>
      {info.etiqueta}
    </span>
  );
}

EstadoEncuestaBadge.propTypes = {
  estado: PropTypes.string,
};
