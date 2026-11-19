import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Globe,
  Building,
  Layers,
  Search,
  SlidersHorizontal,
  CalendarCheck2,
} from 'lucide-react';
import { filtrarEventos } from '../homeUtils';
import HomeEventosGallery from './HomeEventosGallery';

/**
 * @file HomeEventosSection.jsx
 * @description Sección de Eventos Académicos y Programación Pública (Objetivo 1).
 * Permite a cualquier visitante sin sesión buscar eventos, filtrar por modalidad y
 * acceder a la agenda publicada y nómina de conferencistas.
 * @module features/home/components/HomeEventosSection
 */
export default function HomeEventosSection({ eventos = [], cargando = false }) {
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
        {cargando ? (
          <div className="bg-white border border-border rounded-[16px] p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-ink-600">Cargando eventos académicos del servidor...</p>
          </div>
        ) : eventos.length === 0 ? (
          <div className="bg-white border border-border rounded-[16px] p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-ink-900">No hay eventos académicos publicados actualmente</h3>
            <p className="text-sm text-ink-600 max-w-md mx-auto">
              El comité organizador publicará próximamente la programación de las nuevas jornadas, congresos y simposios institucionales.
            </p>
          </div>
        ) : eventosFiltrados.length === 0 ? (
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
          <HomeEventosGallery eventos={eventosFiltrados} />
        )}
      </div>
    </section>
  );
}
