import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Users,
  Mic,
  Award,
  FileText,
  Clock,
  Layers,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import FiltrosPeriodoBar from './FiltrosPeriodoBar';
import { periodoAcademicoService } from '../../../api/periodoAcademicoService';
import { formatearNumero, formatearPorcentaje, interpretarError } from '../historialPeriodoUtils';

/**
 * @file PeriodosIndicadoresTab.jsx
 * @description Pestaña de consulta de eventos e indicadores por periodo académico (HU-27, Criterios 3 y 4).
 * Presenta métricas agregadas del programa y eventos filtrados por semestre, rango de fechas,
 * tipo de evento y tipo de actividad. Informa con precisión cuando un periodo no tiene información disponible.
 * @module features/historialPeriodo/components/PeriodosIndicadoresTab
 */

export default function PeriodosIndicadoresTab({ api = periodoAcademicoService }) {
  const [filtros, setFiltros] = useState({
    semestre: '',
    fechaDesde: '',
    fechaHasta: '',
    tipoEventoId: '',
    tipoActividad: '',
  });

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [indicadores, setIndicadores] = useState(null);
  const [eventosData, setEventosData] = useState(null);
  const [eventosExpandidos, setEventosExpandidos] = useState({});

  const consultarDatos = async (filtrosConsulta) => {
    setCargando(true);
    setError(null);
    try {
      const [resIndicadores, resEventos] = await Promise.all([
        api.calcularIndicadores(filtrosConsulta),
        api.consultarEventos(filtrosConsulta),
      ]);
      setIndicadores(resIndicadores);
      setEventosData(resEventos);
    } catch (err) {
      const { mensaje } = interpretarError(err);
      setError(mensaje || 'No fue posible cargar los datos del periodo.');
      setIndicadores(null);
      setEventosData(null);
    } finally {
      setCargando(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    consultarDatos(filtros);
  }, []);

  const handleAplicarFiltros = () => {
    consultarDatos(filtros);
  };

  const handleLimpiarFiltros = () => {
    const filtrosVacios = {
      semestre: '',
      fechaDesde: '',
      fechaHasta: '',
      tipoEventoId: '',
      tipoActividad: '',
    };
    setFiltros(filtrosVacios);
    consultarDatos(filtrosVacios);
  };

  const toggleExpandirEvento = (eventoId) => {
    setEventosExpandidos((prev) => ({
      ...prev,
      [eventoId]: !prev[eventoId],
    }));
  };

  const hayInformacion = Boolean(indicadores?.hayInformacion);

  return (
    <div className="space-y-6">
      {/* Barra de filtros */}
      <FiltrosPeriodoBar
        filtros={filtros}
        onChangeFiltros={setFiltros}
        onAplicar={handleAplicarFiltros}
        onLimpiar={handleLimpiarFiltros}
        loading={cargando}
      />

      {error && (
        <div
          className="flex items-start gap-2.5 p-3 rounded-lg bg-brand-100/50 border border-brand-600/20 text-brand-700 text-xs"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Criterio 4: Periodo sin información o sin eventos registrados */}
      {!cargando && indicadores && !hayInformacion && (
        <div
          className="bg-surface-muted border border-border rounded-xl p-8 text-center space-y-3 shadow-2xs"
          role="status"
        >
          <div className="w-14 h-14 bg-surface border border-border text-ink-600 rounded-full flex items-center justify-center mx-auto shadow-2xs">
            <Info className="w-7 h-7 text-brand-600" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-serif-title font-semibold text-ink-900">
              No hay información disponible
            </h4>
            <p className="text-xs text-ink-600 leading-relaxed">
              {indicadores.mensaje ||
                eventosData?.mensaje ||
                'No existen eventos registrados para el periodo o criterios consultados.'}
            </p>
          </div>
        </div>
      )}

      {/* Criterio 3: Indicadores y eventos del periodo consultado */}
      {!cargando && indicadores && hayInformacion && (
        <div className="space-y-6">
          {/* Tarjetas de Indicadores Principales */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-semibold text-ink-900 uppercase tracking-wider">
                Indicadores del periodo
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-surface border border-border rounded-xl p-3.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-ink-600 uppercase block">Eventos</span>
                <span className="text-2xl font-serif-title font-bold text-brand-600 block mt-1">
                  {formatearNumero(indicadores.totalEventos)}
                </span>
                <span className="text-[10px] text-ink-600">Registrados</span>
              </div>

              <div className="bg-surface border border-border rounded-xl p-3.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-ink-600 uppercase block">Actividades</span>
                <span className="text-2xl font-serif-title font-bold text-ink-900 block mt-1">
                  {formatearNumero(indicadores.totalActividades)}
                </span>
                <span className="text-[10px] text-ink-600">No canceladas</span>
              </div>

              <div className="bg-surface border border-border rounded-xl p-3.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-ink-600 uppercase block">Inscripciones</span>
                <span className="text-2xl font-serif-title font-bold text-ink-900 block mt-1">
                  {formatearNumero(indicadores.totalInscripciones)}
                </span>
                <span className="text-[10px] text-ink-600">
                  {indicadores.participantesUnicos || 0} personas únicas
                </span>
              </div>

              <div className="bg-surface border border-border rounded-xl p-3.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-ink-600 uppercase block">Promedio / Evento</span>
                <span className="text-2xl font-serif-title font-bold text-ink-900 block mt-1">
                  {formatearNumero(indicadores.promedioInscritosPorEvento, 1)}
                </span>
                <span className="text-[10px] text-ink-600">Inscritos por evento</span>
              </div>

              <div className="bg-surface border border-border rounded-xl p-3.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-ink-600 uppercase block">Ponentes / Conf.</span>
                <span className="text-2xl font-serif-title font-bold text-ink-900 block mt-1">
                  {formatearNumero(indicadores.totalPonentes + indicadores.totalConferencistas)}
                </span>
                <span className="text-[10px] text-ink-600">
                  {indicadores.totalConferencistas} conf. · {indicadores.totalPonentes} ponentes
                </span>
              </div>

              <div className="bg-surface border border-border rounded-xl p-3.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-ink-600 uppercase block">Aprobación Propuestas</span>
                <span className="text-2xl font-serif-title font-bold text-emerald-700 block mt-1">
                  {formatearPorcentaje(indicadores.tasaAprobacionPropuestas)}
                </span>
                <span className="text-[10px] text-ink-600">
                  {indicadores.propuestasAprobadas} de {indicadores.propuestasRecibidas}
                </span>
              </div>
            </div>
          </div>

          {/* Desgloses por categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Eventos por tipo */}
            <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-ink-900 uppercase tracking-wider block">
                Eventos por tipo
              </span>
              {indicadores.eventosPorTipo && Object.keys(indicadores.eventosPorTipo).length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {Object.entries(indicadores.eventosPorTipo).map(([tipo, cant]) => (
                    <div key={tipo} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-ink-600 truncate mr-2">{tipo}</span>
                      <strong className="text-ink-900 bg-surface-muted px-2 py-0.5 rounded border border-border">
                        {cant}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-600 italic">Sin datos</p>
              )}
            </div>

            {/* Eventos por estado */}
            <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-ink-900 uppercase tracking-wider block">
                Eventos por estado
              </span>
              {indicadores.eventosPorEstado && Object.keys(indicadores.eventosPorEstado).length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {Object.entries(indicadores.eventosPorEstado).map(([estado, cant]) => (
                    <div key={estado} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-ink-600 capitalize mr-2">{estado}</span>
                      <strong className="text-ink-900 bg-surface-muted px-2 py-0.5 rounded border border-border">
                        {cant}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-600 italic">Sin datos</p>
              )}
            </div>

            {/* Actividades por tipo */}
            <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-ink-900 uppercase tracking-wider block">
                Actividades por tipo
              </span>
              {indicadores.actividadesPorTipo && Object.keys(indicadores.actividadesPorTipo).length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {Object.entries(indicadores.actividadesPorTipo).map(([tipo, cant]) => (
                    <div key={tipo} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-ink-600 truncate mr-2">{tipo}</span>
                      <strong className="text-ink-900 bg-surface-muted px-2 py-0.5 rounded border border-border">
                        {cant}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-600 italic">Sin datos</p>
              )}
            </div>

            {/* Inscripciones por categoría */}
            <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-ink-900 uppercase tracking-wider block">
                Inscripciones por categoría
              </span>
              {indicadores.inscripcionesPorCategoria &&
              Object.keys(indicadores.inscripcionesPorCategoria).length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {Object.entries(indicadores.inscripcionesPorCategoria).map(([cat, cant]) => (
                    <div key={cat} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-ink-600 capitalize mr-2">{cat}</span>
                      <strong className="text-ink-900 bg-surface-muted px-2 py-0.5 rounded border border-border">
                        {cant}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-600 italic">Sin datos</p>
              )}
            </div>
          </div>

          {/* Listado de eventos del periodo */}
          {eventosData?.eventos && eventosData.eventos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>Eventos del periodo ({eventosData.eventos.length})</span>
                </h4>
              </div>

              <div className="space-y-3">
                {eventosData.eventos.map((ev) => {
                  const expandido = eventosExpandidos[ev.eventoId] ?? false;
                  return (
                    <div
                      key={ev.eventoId}
                      className="bg-surface border border-border rounded-xl overflow-hidden shadow-2xs transition-all hover:border-ink-300"
                    >
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif-title font-semibold text-base text-ink-900">
                              {ev.nombre}
                            </span>
                            {ev.tipoEvento && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-muted text-ink-600 border border-border font-medium">
                                {ev.tipoEvento}
                              </span>
                            )}
                            {ev.semestre && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-brand-100 text-brand-700 font-semibold">
                                {ev.semestre}
                              </span>
                            )}
                            {ev.modalidad && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-muted text-ink-600 border border-border">
                                {ev.modalidad}
                              </span>
                            )}
                            {ev.estado && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-muted text-ink-600 border border-border">
                                {ev.estado}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {ev.fechaInicio}
                              {ev.fechaFin && ev.fechaFin !== ev.fechaInicio ? ` al ${ev.fechaFin}` : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <strong>{ev.inscritos}</strong> inscritos
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <strong>{ev.totalActividades}</strong> actividades
                            </span>
                          </div>
                        </div>

                        {ev.actividades && ev.actividades.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandirEvento(ev.eventoId)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer self-start md:self-center"
                          >
                            <span>{expandido ? 'Ocultar actividades' : 'Ver actividades'}</span>
                            {expandido ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Lista desplegable de actividades del evento */}
                      {expandido && ev.actividades && (
                        <div className="p-4 bg-surface-muted/30 border-t border-border">
                          <table className="w-full text-left text-xs bg-surface border border-border rounded-lg overflow-hidden">
                            <thead className="bg-surface-muted text-ink-600 border-b border-border uppercase font-semibold text-[10px]">
                              <tr>
                                <th className="p-2.5">Actividad</th>
                                <th className="p-2.5">Tipo</th>
                                <th className="p-2.5">Fecha</th>
                                <th className="p-2.5">Horario</th>
                                <th className="p-2.5">Sala</th>
                                <th className="p-2.5">Inscritos</th>
                                <th className="p-2.5">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {ev.actividades.map((act) => (
                                <tr key={act.actividadId} className="hover:bg-surface-muted/50">
                                  <td className="p-2.5 font-medium text-ink-900">{act.nombre}</td>
                                  <td className="p-2.5 text-ink-600">{act.tipoActividad || '—'}</td>
                                  <td className="p-2.5 text-ink-600">{act.fecha || 'Por programar'}</td>
                                  <td className="p-2.5 text-ink-600">
                                    {act.horaInicio ? `${act.horaInicio} - ${act.horaFin || ''}` : '—'}
                                  </td>
                                  <td className="p-2.5 text-ink-600">{act.sala || 'Sin sala'}</td>
                                  <td className="p-2.5 font-semibold text-ink-900">{act.inscritos}</td>
                                  <td className="p-2.5">
                                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-muted border border-border text-ink-600">
                                      {act.estado}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
