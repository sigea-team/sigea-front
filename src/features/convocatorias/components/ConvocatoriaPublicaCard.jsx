import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { estadoRecepcion, formatearFechaHora } from '../convocatoriaUtils';

/**
 * @file ConvocatoriaPublicaCard.jsx
 * @description Tarjeta de una convocatoria publicada en la vista pública (HU-11, Criterio 1).
 * Muestra evento, título, descripción, periodo de recepción y requisitos (desplegables),
 * con un indicador de si la recepción está próxima, abierta o cerrada.
 * @module features/convocatorias/components/ConvocatoriaPublicaCard
 */

/** Fecha legible o un texto claro si el dato no viene en la respuesta. */
const fechaOTexto = (fecha) => (fecha ? formatearFechaHora(fecha) : 'Sin fecha definida');

const ESTILOS_RECEPCION = {
  abierta: {
    texto: 'Recibiendo propuestas',
    clase: 'bg-brand-600 text-surface border-transparent',
    punto: 'bg-surface',
  },
  proxima: {
    texto: 'Próximamente',
    clase: 'bg-surface-muted text-ink-600 border-field-border',
    punto: 'bg-ink-300',
  },
  cerrada: {
    texto: 'Recepción cerrada',
    clase: 'bg-brand-100 text-brand-700 border-brand-600',
    punto: 'bg-brand-600',
  },
};

/**
 * @param {Object} props
 * @param {Object} props.convocatoria - Convocatoria publicada (ConvocatoriaResponse del backend).
 * @param {boolean} [props.destacada=false] - Resalta la tarjeta (p. ej. al llegar desde una notificación).
 * @param {boolean} [props.conSesion=false] - Si hay sesión iniciada, cambia el texto de la acción.
 */
export default function ConvocatoriaPublicaCard({ convocatoria, destacada = false, conSesion = false }) {
  const [verRequisitos, setVerRequisitos] = useState(destacada);
  const recepcion = estadoRecepcion(convocatoria);
  const estilo = ESTILOS_RECEPCION[recepcion];

  return (
    <article
      id={`convocatoria-${convocatoria.id}`}
      className={`bg-white rounded-[16px] border p-6 transition-shadow ${
        destacada ? 'border-brand-600 shadow-md ring-2 ring-brand-100' : 'border-border shadow-xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{convocatoria.eventoNombre}</p>
          <h3 className="text-lg font-semibold text-ink-900 mt-1 leading-snug">{convocatoria.titulo}</h3>
        </div>
        <span
          className={`inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${estilo.clase}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${estilo.punto}`}></span>
          {estilo.texto}
        </span>
      </div>

      {convocatoria.descripcion && (
        <p className="text-sm text-ink-600 mt-3 leading-relaxed whitespace-pre-line">{convocatoria.descripcion}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-900">
        <p className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-ink-600" />
          <span className="text-ink-600">Apertura:</span>
          <strong>{fechaOTexto(convocatoria.fechaApertura)}</strong>
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-ink-600">Fecha límite:</span>
          <strong>{fechaOTexto(convocatoria.fechaCierre)}</strong>
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {convocatoria.requisitos ? (
          <button
            type="button"
            onClick={() => setVerRequisitos((v) => !v)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline cursor-pointer"
            aria-expanded={verRequisitos}
          >
            {verRequisitos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {verRequisitos ? 'Ocultar requisitos' : 'Ver requisitos'}
          </button>
        ) : (
          <span />
        )}

        {recepcion === 'abierta' && (
          <Link
            to={conSesion ? '/dashboard' : '/login'}
            className="h-10 px-5 rounded-[8px] bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            {conSesion ? 'Ir a mi panel para postularme' : 'Inicia sesión para postularte'}
          </Link>
        )}
      </div>

      {verRequisitos && convocatoria.requisitos && (
        <div className="mt-3 p-4 rounded-[8px] bg-surface-muted border border-border">
          <p className="text-xs font-semibold text-ink-900 mb-1">Requisitos para los autores</p>
          <p className="text-sm text-ink-600 whitespace-pre-line leading-relaxed">{convocatoria.requisitos}</p>
        </div>
      )}
    </article>
  );
}

ConvocatoriaPublicaCard.propTypes = {
  convocatoria: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    eventoNombre: PropTypes.string,
    titulo: PropTypes.string.isRequired,
    descripcion: PropTypes.string,
    requisitos: PropTypes.string,
    fechaApertura: PropTypes.string,
    fechaCierre: PropTypes.string,
  }).isRequired,
  destacada: PropTypes.bool,
  conSesion: PropTypes.bool,
};
