import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  Globe,
  Building,
  Layers,
  MapPin,
  Mic,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  FileText,
  CalendarCheck2,
} from 'lucide-react';
import { filtrarEventos, formatearRangoFechas } from '../homeUtils';

/**
 * @file HomeEventosSection.jsx
 * @description Sección de Eventos Académicos y Programación Pública (Objetivo 1).
 * Permite a cualquier visitante sin sesión buscar eventos, filtrar por modalidad y
 * acceder a la agenda publicada y nómina de conferencistas.
 * @module features/home/components/HomeEventosSection
 */
export default function HomeEventosSection({ eventos = [] }) {
  const [busqueda, setBusqueda] = useState('');
  const [modalidadFiltro, setModalidadFiltro] = useState('todas');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');

  // Filtrado reactivo en memoria
  const eventosFiltrados = useMemo(() => {
    return filtrarEventos(eventos, {
      busqueda,
      modalidad: modalidadFiltro,
      estado: estadoFiltro,
    });
  }, [eventos, busqueda, modalidadFiltro, estadoFiltro]);

  const opcionesModalidad = [
    { id: 'todas', label: 'Todas las modalidades' },
    { id: 'presencial', label: 'Presencial', icono: Building },
    { id: 'virtual', label: 'Virtual', icono: Globe },
    { id: 'hibrida', label: 'Híbrida', icono: Layers },
  ];

  return (
    <section id="eventos" className="min-h-screen py-16 sm:py-20 bg-surface-muted border-b border-border flex flex-col justify-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Encabezado de la sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 uppercase tracking-wider">
              <CalendarCheck2 className="w-4 h-4" />
              <span>Programación Institucional</span>
            </div>
            <h2 className="font-serif-title text-3xl sm:text-4xl text-ink-900 tracking-tight">
              Eventos Académicos & Jornadas
            </h2>
            <p className="text-sm sm:text-base text-ink-600 font-normal leading-relaxed">
              Consulta los congresos, simposios, hackatones y workshops vigentes. Revisa las agendas
              por día y hora, así como los conferencistas invitados sin necesidad de iniciar sesión.
            </p>
          </div>

          <div className="text-xs text-ink-600 bg-white border border-border px-3.5 py-2 rounded-[8px] self-start md:self-auto shrink-0 shadow-2xs">
            Mostrando <strong>{eventosFiltrados.length}</strong> de <strong>{eventos.length}</strong> eventos disponibles
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-white border border-border rounded-[16px] p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Input de búsqueda */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre de evento, temática o semestre (ej. Hackathon, IA, 2026-2)..."
                className="w-full h-11 pl-10 pr-4 rounded-[8px] border border-field-border text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition-colors"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-600 hover:text-ink-900"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Filtros por Modalidad */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {opcionesModalidad.map((opcion) => {
                const Icono = opcion.icono;
                const activo = modalidadFiltro === opcion.id;
                return (
                  <button
                    key={opcion.id}
                    type="button"
                    onClick={() => setModalidadFiltro(opcion.id)}
                    className={`h-11 px-3.5 rounded-[8px] text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                      activo
                        ? 'bg-brand-600 text-white shadow-2xs'
                        : 'bg-surface-muted text-ink-600 hover:text-ink-900 hover:bg-border/60'
                    }`}
                  >
                    {Icono && <Icono className="w-3.5 h-3.5" />}
                    <span>{opcion.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtros rápidos de estado temporal */}
          <div className="flex items-center justify-between pt-2 border-t border-border/80 text-xs text-ink-600">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-ink-600" />
              <span className="font-medium">Estado:</span>
              <button
                type="button"
                onClick={() => setEstadoFiltro('todos')}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  estadoFiltro === 'todos' ? 'bg-ink-900 text-white' : 'hover:bg-surface-muted'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setEstadoFiltro('activos')}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  estadoFiltro === 'activos' ? 'bg-brand-600 text-white' : 'hover:bg-surface-muted'
                }`}
              >
                Vigentes / Próximos
              </button>
              <button
                type="button"
                onClick={() => setEstadoFiltro('finalizados')}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  estadoFiltro === 'finalizados' ? 'bg-ink-900 text-white' : 'hover:bg-surface-muted'
                }`}
              >
                Histórico
              </button>
            </div>

            {(busqueda || modalidadFiltro !== 'todas' || estadoFiltro !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  setModalidadFiltro('todas');
                  setEstadoFiltro('todos');
                }}
                className="text-brand-600 hover:text-brand-700 underline font-medium"
              >
                Restablecer todos los filtros
              </button>
            )}
          </div>
        </div>

        {/* Rejilla de Tarjetas de Eventos */}
        {eventosFiltrados.length === 0 ? (
          <div className="bg-white border border-border rounded-[16px] p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-ink-900">No se encontraron eventos</h3>
            <p className="text-sm text-ink-600 max-w-md mx-auto">
              No hay eventos que coincidan con &ldquo;{busqueda}&rdquo; bajo los filtros seleccionados. Intenta con otros términos o restablece los filtros.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                setModalidadFiltro('todas');
                setEstadoFiltro('todos');
              }}
              className="mt-2 h-9 px-4 rounded-[8px] bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors"
            >
              Ver todos los eventos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eventosFiltrados.map((evento) => {
              const modalidadNombre = (evento.modalidad || '').toLowerCase();
              const esVirtual = modalidadNombre === 'virtual';
              const esHibrido = modalidadNombre.includes('hibrid') || modalidadNombre.includes('híbrid');

              return (
                <article
                  key={evento.id}
                  className="bg-white border border-border hover:border-brand-600/40 rounded-[16px] p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-5 group"
                >
                  <div className="space-y-3.5">
                    {/* Metadatos superiores: Modalidad, Semestre, Estado */}
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

                    {/* Descripción */}
                    <p className="text-sm text-ink-600 leading-relaxed font-normal line-clamp-3">
                      {evento.descripcion || evento.objetivo || 'Evento académico oficial de la Facultad de Ingeniería.'}
                    </p>

                    {/* Info de fechas y lugar */}
                    <div className="space-y-1.5 pt-1 text-xs text-ink-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-brand-600 shrink-0" />
                        <span className="font-medium text-ink-900">
                          {formatearRangoFechas(evento.fechaInicio, evento.fechaFin)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-ink-600 shrink-0" />
                        <span className="truncate">{evento.lugar || 'Campus Central UFPS — Cúcuta'}</span>
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

                    {/* Convocatorias asociadas si las hay */}
                    {evento.convocatorias && evento.convocatorias.length > 0 && (
                      <div className="pt-2">
                        <div className="p-2.5 rounded-[8px] bg-brand-100/60 border border-brand-100 flex items-center justify-between text-xs text-brand-700">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-brand-600" />
                            <span className="font-semibold">
                              {evento.convocatorias.length} convocatoria{evento.convocatorias.length > 1 ? 's' : ''} activa{evento.convocatorias.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <Link
                            to={`/convocatorias-publicas?convocatoria=${evento.convocatorias[0].id}`}
                            className="font-medium hover:underline text-brand-700 inline-flex items-center gap-0.5"
                          >
                            <span>Postular</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones del evento: Agenda y Conferencistas */}
                  <div className="pt-4 border-t border-border flex flex-wrap items-center gap-2 sm:gap-3">
                    <Link
                      to={`/eventos/${evento.id}/agenda-publica`}
                      className="flex-1 h-10 px-4 rounded-[8px] bg-brand-600 text-white hover:bg-brand-700 font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Ver Agenda & Horarios</span>
                    </Link>

                    <Link
                      to={`/eventos/${evento.id}/conferencistas-publicos`}
                      className="h-10 px-4 rounded-[8px] border border-field-border bg-white text-ink-900 hover:bg-surface-muted font-medium text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      title="Consultar conferencistas y ponentes invitados"
                    >
                      <Mic className="w-4 h-4 text-brand-600" />
                      <span>Conferencistas</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
