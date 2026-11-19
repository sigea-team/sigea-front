import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Globe,
  Building,
  Layers,
  Sparkles,
  FileText,
  ArrowRight,
  Info,
} from 'lucide-react';
import { formatearRangoFechas } from '../homeUtils';

/**
 * @file HomeEventoCard.jsx
 * @description Tarjeta de presentación de evento académico para la sección pública de la Homepage.
 * Toda la tarjeta y su botón principal son clicables y redirigen a la vista con la información completa del evento.
 * No incluye ubicación ni botones independientes de agenda/conferencistas/postular (reemplazados por el botón de información completa).
 * @module features/home/components/HomeEventoCard
 */
export default function HomeEventoCard({ evento, onVerDetalle }) {
  const navigate = useNavigate();

  if (!evento) return null;

  const modalidadNombre = (evento.modalidad || '').toLowerCase();
  const esVirtual = modalidadNombre === 'virtual';
  const esHibrido = modalidadNombre.includes('hibrid') || modalidadNombre.includes('híbrid');

  const irAInfoCompleta = () => {
    if (onVerDetalle) {
      onVerDetalle(evento);
      return;
    }
    navigate(`/eventos/${evento.id}`, { state: { evento } });
  };

  const manejarKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      irAInfoCompleta();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={irAInfoCompleta}
      onKeyDown={manejarKeyDown}
      aria-label={`Ver información completa del evento ${evento.nombre}`}
      className="bg-white border border-border hover:border-brand-600/50 rounded-[16px] p-6 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-5 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 select-none h-full"
    >
      <div className="space-y-3.5">
        {/* Metadatos superiores: Modalidad, Semestre, Estado/Destacado */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                esVirtual
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : esHibrido
                  ? 'bg-purple-50 text-purple-700 border border-purple-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}
            >
              {esVirtual ? (
                <Globe className="w-3 h-3" />
              ) : esHibrido ? (
                <Layers className="w-3 h-3" />
              ) : (
                <Building className="w-3 h-3" />
              )}
              <span>{evento.modalidadTexto || (esVirtual ? 'Virtual' : esHibrido ? 'Híbrida' : 'Presencial')}</span>
            </span>

            <span className="text-xs font-medium text-ink-600 bg-surface-muted px-2 py-0.5 rounded-[6px] border border-border">
              Semestre {evento.semestre || '2026-2'}
            </span>
          </div>

          {evento.destacado && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-brand-600" />
              <span>Destacado</span>
            </span>
          )}
        </div>

        {/* Título del evento */}
        <h3 className="font-serif-title text-xl sm:text-2xl text-ink-900 group-hover:text-brand-600 transition-colors leading-snug">
          {evento.nombre}
        </h3>

        {/* Descripción resumida */}
        <p className="text-sm text-ink-600 leading-relaxed font-normal line-clamp-3">
          {evento.descripcion || evento.objetivo || 'Evento académico oficial de la Facultad de Ingeniería.'}
        </p>

        {/* Información de fechas (sin ubicación) */}
        <div className="pt-1 text-xs text-ink-600">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="font-medium text-ink-900">
              {formatearRangoFechas(evento.fechaInicio, evento.fechaFin)}
            </span>
          </div>
        </div>

        {/* Líneas Temáticas / Tags */}
        {evento.lineasTematicas && evento.lineasTematicas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {evento.lineasTematicas.slice(0, 3).map((linea) => (
              <span
                key={linea}
                className="text-[11px] font-medium text-ink-600 bg-surface-muted px-2 py-0.5 rounded-[6px]"
              >
                #{linea}
              </span>
            ))}
          </div>
        )}

        {/* Indicador de convocatorias asociadas (informativo, sin botón para postular) */}
        {evento.convocatorias && evento.convocatorias.length > 0 && (
          <div className="pt-2">
            <div className="p-2.5 rounded-[8px] bg-brand-100/60 border border-brand-100 flex items-center gap-2 text-xs text-brand-700">
              <FileText className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span className="font-semibold">
                {evento.convocatorias.length} convocatoria{evento.convocatorias.length > 1 ? 's' : ''} activa{evento.convocatorias.length > 1 ? 's' : ''} para ponencias
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Botón único de acción: Ver información completa del evento */}
      <div className="pt-4 border-t border-border">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            irAInfoCompleta();
          }}
          className="w-full h-10 px-4 rounded-[8px] bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 cursor-pointer"
        >
          <Info className="w-4 h-4" />
          <span>Ver información completa</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </article>
  );
}

HomeEventoCard.propTypes = {
  evento: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    nombre: PropTypes.string.isRequired,
    descripcion: PropTypes.string,
    objetivo: PropTypes.string,
    modalidad: PropTypes.string,
    modalidadTexto: PropTypes.string,
    semestre: PropTypes.string,
    fechaInicio: PropTypes.string,
    fechaFin: PropTypes.string,
    destacado: PropTypes.bool,
    lineasTematicas: PropTypes.arrayOf(PropTypes.string),
    convocatorias: PropTypes.array,
  }).isRequired,
  onVerDetalle: PropTypes.func,
};
