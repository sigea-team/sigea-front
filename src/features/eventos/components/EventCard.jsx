import { CalendarDays, MapPin, Tag, ArrowRight, Layers } from 'lucide-react';
import EstadoEventoBadge from './EstadoEventoBadge';
import EventoArchivadoBadge from '../../memoria/components/EventoArchivadoBadge';
import { etiquetaModalidad, formatearRango } from '../eventoUtils';

/**
 * @file EventCard.jsx
 * @description Tarjeta de presentación individual para cada evento en la galería de SIGEA.
 * Cumple estrictamente con las reglas de color de COLOR_STYLES.md:
 * - Marco y borde: fondo surface, borde border, con borde superior en brand-600 (#a6192e).
 * - Iconos y contenedores: contenedor de acento en brand-100 con icono en brand-600.
 * - Tipografía: títulos en font-serif-title (ink-900) con hover en brand-600; kickers en brand-600; metadatos en ink-600 e ink-300.
 * @module features/eventos/components/EventCard
 */

/**
 * @param {Object} props
 * @param {Object} props.evento - Información del evento.
 * @param {string} [props.nombreBase] - Nombre del evento base cuando es una edición.
 * @param {number} [props.derivadas] - Cantidad de ediciones derivadas.
 * @param {function(): void} props.onClick - Manejador al hacer clic para abrir el popup de detalle.
 */
export default function EventCard({ evento, nombreBase, derivadas = 0, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-surface rounded-[16px] border border-border border-t-4 border-t-brand-600 shadow-xs hover:border-brand-600 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 cursor-pointer flex flex-col justify-between"
      aria-label={`Ver información completa de ${evento.nombre}`}
    >
      <div className="p-5 flex flex-col gap-3.5 w-full flex-1">
        {/* Cabecera de la tarjeta: kicker o tipo + contenedor de icono rojo institucional */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 line-clamp-1">
              {evento.tipo || 'Evento académico'}
            </span>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <EstadoEventoBadge estado={evento.estado} />
              {evento.archivado && <EventoArchivadoBadge />}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>

        {/* Título y relación con evento base */}
        <div className="space-y-1">
          <h3 className="font-serif-title text-base sm:text-lg font-semibold text-ink-900 leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
            {evento.nombre}
          </h3>

          {evento.esEdicion && nombreBase && (
            <p className="text-xs text-ink-600 line-clamp-1">
              <span className="font-medium text-brand-600">Edición</span> de {nombreBase}
            </p>
          )}

          {!evento.esEdicion && derivadas > 0 && (
            <p className="text-xs text-ink-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-ink-300" aria-hidden="true" />
              <span>Evento base · {derivadas} {derivadas === 1 ? 'edición' : 'ediciones'}</span>
            </p>
          )}
        </div>

        {/* Resumen del objetivo si está presente */}
        {evento.objetivo && (
          <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">
            {evento.objetivo}
          </p>
        )}

        {/* Metadatos: Fechas, Modalidad, Semestre */}
        <div className="mt-auto pt-3 border-t border-border flex flex-col gap-1.5 text-xs text-ink-600">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-ink-300 shrink-0" aria-hidden="true" />
            <span className="truncate">{formatearRango(evento.fechaInicio, evento.fechaFin)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-ink-300 shrink-0" aria-hidden="true" />
              <span className="truncate">{etiquetaModalidad(evento.modalidad)}</span>
            </div>
            {evento.semestre && (
              <span className="bg-surface-muted text-ink-900 px-2 py-0.5 rounded border border-border font-medium shrink-0">
                {evento.semestre}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pie de tarjeta con llamado a la acción interactivo */}
      <div className="px-5 py-2.5 bg-surface-muted border-t border-border rounded-b-[12px] flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:text-brand-700">
        <span>Ver información y opciones</span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
      </div>
    </button>
  );
}
