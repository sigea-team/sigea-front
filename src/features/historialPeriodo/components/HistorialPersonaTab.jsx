import React, { useState } from 'react';
import {
  Search,
  User,
  Mail,
  CreditCard,
  Calendar,
  Clock,
  Award,
  Layers,
  FileText,
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import FiltrosPeriodoBar from './FiltrosPeriodoBar';
import { historialParticipacionService } from '../../../api/historialParticipacionService';
import { configuracionRol, interpretarError } from '../historialPeriodoUtils';

/**
 * @file HistorialPersonaTab.jsx
 * @description Pestaña de consulta del historial de participación de una persona (HU-27, Criterios 1, 2 y 3).
 * Permite buscar por documento o correo y consultar los eventos, actividades, roles y propuestas
 * en las que participó, con filtros por periodo académico.
 * @module features/historialPeriodo/components/HistorialPersonaTab
 */

export default function HistorialPersonaTab({ api = historialParticipacionService }) {
  const [tipoBusqueda, setTipoBusqueda] = useState('documento'); // 'documento' | 'correo'
  const [valorBusqueda, setValorBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  // Parámetros de búsqueda actuales para recargar al cambiar filtros
  const [busquedaActiva, setBusquedaActiva] = useState(null);

  // Filtros aplicables al historial (Criterio 3)
  const [filtros, setFiltros] = useState({
    semestre: '',
    fechaDesde: '',
    fechaHasta: '',
    tipoEventoId: '',
    tipoActividad: '',
  });

  const [eventosExpandidos, setEventosExpandidos] = useState({});

  const ejecutarConsulta = async (criterioBusqueda, filtrosAplicar) => {
    if (!criterioBusqueda || !criterioBusqueda.valor.trim()) {
      setError('Por favor ingrese un valor de búsqueda.');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const payload = {
        documento: criterioBusqueda.tipo === 'documento' ? criterioBusqueda.valor.trim() : undefined,
        correo: criterioBusqueda.tipo === 'correo' ? criterioBusqueda.valor.trim() : undefined,
        ...filtrosAplicar,
      };
      const data = await api.consultarPorIdentificacion(payload);
      setResultado(data);
      setBusquedaActiva(criterioBusqueda);
    } catch (err) {
      setResultado(null);
      const { mensaje, status } = interpretarError(err);
      if (status === 404) {
        setError(
          `No se encontró ninguna persona registrada con el ${
            criterioBusqueda.tipo === 'documento' ? 'documento' : 'correo'
          } "${criterioBusqueda.valor}". Verifique los datos ingresados.`
        );
      } else {
        setError(mensaje || 'No fue posible consultar el historial de la persona.');
      }
    } finally {
      setCargando(false);
    }
  };

  const handleBuscar = (e) => {
    if (e) e.preventDefault();
    if (!valorBusqueda.trim()) {
      setError('Ingrese un número de documento o correo para buscar.');
      return;
    }
    const nuevoCriterio = { tipo: tipoBusqueda, valor: valorBusqueda.trim() };
    ejecutarConsulta(nuevoCriterio, filtros);
  };

  const handleAplicarFiltros = () => {
    if (busquedaActiva) {
      ejecutarConsulta(busquedaActiva, filtros);
    }
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
    if (busquedaActiva) {
      ejecutarConsulta(busquedaActiva, filtrosVacios);
    }
  };

  const toggleExpandirEvento = (eventoId) => {
    setEventosExpandidos((prev) => ({
      ...prev,
      [eventoId]: !prev[eventoId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Formulario de búsqueda de persona */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Buscar persona</h3>
          <p className="text-xs text-ink-600 mt-0.5">
            Consulte la trayectoria de una persona en el programa buscando por su documento de identidad o correo.
          </p>
        </div>

        <form onSubmit={handleBuscar} className="space-y-3">
          <div className="flex gap-4 border-b border-border pb-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-900 cursor-pointer">
              <input
                type="radio"
                name="tipoBusqueda"
                value="documento"
                checked={tipoBusqueda === 'documento'}
                onChange={() => setTipoBusqueda('documento')}
                className="text-brand-600 focus:ring-brand-600"
              />
              <span>Número de documento</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-900 cursor-pointer">
              <input
                type="radio"
                name="tipoBusqueda"
                value="correo"
                checked={tipoBusqueda === 'correo'}
                onChange={() => setTipoBusqueda('correo')}
                className="text-brand-600 focus:ring-brand-600"
              />
              <span>Correo electrónico</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                id="campo-busqueda-persona"
                type={tipoBusqueda === 'correo' ? 'email' : 'text'}
                placeholder={
                  tipoBusqueda === 'documento'
                    ? 'Ingrese el número de documento (ej: 1090123456)'
                    : 'Ingrese el correo institucional o personal'
                }
                value={valorBusqueda}
                onChange={(e) => setValorBusqueda(e.target.value)}
                rightElement={
                  tipoBusqueda === 'documento' ? (
                    <CreditCard className="w-4 h-4 text-ink-600" />
                  ) : (
                    <Mail className="w-4 h-4 text-ink-600" />
                  )
                }
              />
            </div>
            <Button type="submit" variant="primary" loading={cargando} className="sm:w-auto h-11">
              <Search className="w-4 h-4" />
              <span>Consultar historial</span>
            </Button>
          </div>
        </form>

        {error && (
          <div
            className="flex items-start gap-2.5 p-3 rounded-lg bg-brand-100/50 border border-brand-600/20 text-brand-700 text-xs"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Resultados de la consulta */}
      {resultado && (
        <div className="space-y-6">
          {/* Tarjeta de información de la persona */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-serif-title font-semibold text-ink-900 leading-tight">
                    {resultado.nombreCompleto || 'Persona sin nombre'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600 mt-1">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      {resultado.numeroDocumento || 'Sin documento'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {resultado.correo || 'Sin correo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-surface-muted border border-border px-3 py-1.5 rounded-lg font-medium text-ink-900">
                  Total eventos:{' '}
                  <strong className="text-brand-600 font-bold">{resultado.totalEventos || 0}</strong>
                </span>
              </div>
            </div>

            {/* Resumen de roles desempeñados */}
            {resultado.eventosPorRol && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-ink-600 mr-1">Roles en eventos:</span>
                {Object.entries(resultado.eventosPorRol).map(([rol, cantidad]) => {
                  const conf = configuracionRol(rol);
                  return (
                    <span
                      key={rol}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${conf.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${conf.dotClass}`} />
                      {conf.label}: <strong>{cantidad}</strong>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Barra de filtros de periodo (Criterio 3) */}
          <FiltrosPeriodoBar
            filtros={filtros}
            onChangeFiltros={setFiltros}
            onAplicar={handleAplicarFiltros}
            onLimpiar={handleLimpiarFiltros}
            loading={cargando}
          />

          {/* Criterio 2: Primera participación o sin participación registrada */}
          {resultado.primeraParticipacion && (
            <div
              className="bg-sky-50 border border-sky-200 rounded-xl p-6 text-center space-y-3 shadow-2xs"
              role="status"
            >
              <div className="w-12 h-12 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-200 text-sky-800 mb-2">
                  Primera participación registrada
                </span>
                <h4 className="text-base font-semibold text-sky-950">Sin historial previo</h4>
                <p className="text-xs text-sky-800 mt-1 leading-relaxed">
                  {resultado.mensaje ||
                    'La persona no tiene participación registrada en los eventos del programa; esta sería su primera participación.'}
                </p>
              </div>
            </div>
          )}

          {/* Sin coincidencias con filtros aplicados */}
          {!resultado.primeraParticipacion && !resultado.tieneHistorial && (
            <div
              className="bg-surface-muted border border-border rounded-xl p-6 text-center space-y-3 shadow-2xs"
              role="status"
            >
              <div className="w-12 h-12 bg-border text-ink-600 rounded-full flex items-center justify-center mx-auto">
                <Info className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-base font-semibold text-ink-900">Sin historial en este filtro</h4>
                <p className="text-xs text-ink-600 mt-1">
                  {resultado.mensaje ||
                    'La persona no tiene participaciones que coincidan con los filtros aplicados.'}
                </p>
                <div className="mt-3">
                  <Button variant="secondary" onClick={handleLimpiarFiltros} className="text-xs h-9">
                    Restablecer filtros
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Criterio 1: Lista de eventos y actividades con roles */}
          {resultado.tieneHistorial && resultado.eventos && resultado.eventos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>Trayectoria de eventos ({resultado.eventos.length})</span>
                </h4>
                <span className="text-xs text-ink-600">Ordenados del más reciente al más antiguo</span>
              </div>

              <div className="space-y-3">
                {resultado.eventos.map((evento) => {
                  const expandido = eventosExpandidos[evento.eventoId] ?? true;
                  return (
                    <div
                      key={evento.eventoId}
                      className="bg-surface border border-border rounded-xl overflow-hidden shadow-2xs transition-all hover:border-ink-300"
                    >
                      {/* Cabecera del evento */}
                      <div className="p-4 bg-surface flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/60">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif-title font-semibold text-base text-ink-900">
                              {evento.nombre}
                            </span>
                            {evento.tipoEvento && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-muted text-ink-600 border border-border font-medium">
                                {evento.tipoEvento}
                              </span>
                            )}
                            {evento.semestre && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-brand-100 text-brand-700 font-semibold">
                                Semestre {evento.semestre}
                              </span>
                            )}
                            {evento.estado && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-muted text-ink-600 border border-border">
                                {evento.estado}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-ink-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {evento.fechaInicio}
                              {evento.fechaFin && evento.fechaFin !== evento.fechaInicio
                                ? ` al ${evento.fechaFin}`
                                : ''}
                            </span>
                          </div>
                        </div>

                        {/* Roles de la persona en este evento */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {evento.roles &&
                            Array.from(evento.roles).map((rol) => {
                              const conf = configuracionRol(rol);
                              return (
                                <span
                                  key={rol}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${conf.badgeClass}`}
                                >
                                  <Award className="w-3 h-3" />
                                  {conf.label}
                                </span>
                              );
                            })}

                          <button
                            type="button"
                            onClick={() => toggleExpandirEvento(evento.eventoId)}
                            className="p-1 rounded text-ink-600 hover:text-ink-900 hover:bg-surface-muted transition-colors cursor-pointer"
                            aria-label={expandido ? 'Ocultar actividades' : 'Mostrar actividades'}
                          >
                            {expandido ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Contenido expandible del evento */}
                      {expandido && (
                        <div className="p-4 bg-surface-muted/30 space-y-4">
                          {/* Tema de conferencia registrada */}
                          {evento.temaConferencia && (
                            <div className="p-3 rounded-lg bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
                              <Award className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold block">Tema de conferencia o ponencia:</span>
                                <span>{evento.temaConferencia}</span>
                              </div>
                            </div>
                          )}

                          {/* Actividades en las que participó */}
                          <div>
                            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-ink-900 uppercase tracking-wider">
                              <Clock className="w-3.5 h-3.5 text-brand-600" />
                              <span>
                                Actividades participadas ({evento.actividades?.length || 0})
                              </span>
                            </div>

                            {evento.actividades && evento.actividades.length > 0 ? (
                              <div className="overflow-x-auto border border-border rounded-lg bg-surface">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-surface-muted text-ink-600 border-b border-border uppercase font-semibold text-[10px]">
                                    <tr>
                                      <th className="p-2.5">Actividad</th>
                                      <th className="p-2.5">Tipo</th>
                                      <th className="p-2.5">Fecha</th>
                                      <th className="p-2.5">Horario</th>
                                      <th className="p-2.5">Estado</th>
                                      <th className="p-2.5">Rol en actividad</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {evento.actividades.map((act) => {
                                      const rolConf = configuracionRol(act.rol);
                                      return (
                                        <tr key={act.actividadId} className="hover:bg-surface-muted/50">
                                          <td className="p-2.5 font-medium text-ink-900">
                                            {act.nombre}
                                          </td>
                                          <td className="p-2.5 text-ink-600">
                                            {act.tipoActividad || '—'}
                                          </td>
                                          <td className="p-2.5 text-ink-600">
                                            {act.fecha || 'Por programar'}
                                          </td>
                                          <td className="p-2.5 text-ink-600">
                                            {act.horaInicio
                                              ? `${act.horaInicio}${
                                                  act.horaFin ? ` - ${act.horaFin}` : ''
                                                }`
                                              : '—'}
                                          </td>
                                          <td className="p-2.5">
                                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-muted border border-border text-ink-600">
                                              {act.estado}
                                            </span>
                                          </td>
                                          <td className="p-2.5">
                                            <span
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${rolConf.badgeClass}`}
                                            >
                                              {rolConf.label}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-ink-600 italic bg-surface p-3 rounded-lg border border-border">
                                Inscrito a nivel general del evento (sin actividades individuales registradas).
                              </p>
                            )}
                          </div>

                          {/* Propuestas postuladas */}
                          {evento.propuestas && evento.propuestas.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-ink-900 uppercase tracking-wider">
                                <FileText className="w-3.5 h-3.5 text-amber-600" />
                                <span>Propuestas postuladas ({evento.propuestas.length})</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {evento.propuestas.map((prop) => (
                                  <div
                                    key={prop.propuestaId}
                                    className="p-3 bg-surface border border-border rounded-lg text-xs space-y-1.5"
                                  >
                                    <div className="font-medium text-ink-900">{prop.titulo}</div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-muted border border-border text-ink-600">
                                        Estado: {prop.estado}
                                      </span>
                                      {prop.rolAutor && (
                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                                          {prop.rolAutor}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
