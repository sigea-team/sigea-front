import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { AlertTriangle, CalendarCheck, CheckCircle2, Clock, MapPin, Mic, Ticket, Users, XCircle } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { inscripcionService } from '../../../api/inscripcionService';
import { escaparHtml } from '../../../utils/html';
import { formatearFecha, formatearRango } from '../../eventos/eventoUtils';
import {
  CATEGORIAS_PARTICIPANTE,
  agruparPorDia,
  completarSimultaneidad,
  estadoActividad,
  etiquetaCategoria,
  horaCorta,
  inscripcionesAbiertas,
  mensajeErrorInscripcion,
  porcentajeOcupacion,
} from '../inscripcionUtils';

/**
 * @file InscripcionEventoModal.jsx
 * @description HU-23: el participante se inscribe al evento eligiendo su categoría (Criterio 1) y luego a las
 * actividades de su interés, viendo el cupo de cada una (Criterio 2). Las actividades llenas o que se cruzan con
 * otra inscrita se marcan y no se pueden tomar (Criterios 3 y 4); en un cruce puede cancelar la anterior e
 * inscribirse a la nueva. Al cancelar se libera el cupo y se refresca la disponibilidad (Criterio 5).
 * El backend vuelve a validar todo; si rechaza, se informa el motivo y se recargan los cupos.
 * @module features/inscripciones/components/InscripcionEventoModal
 */

const ESTILO_SWAL = {
  confirmButtonColor: '#a6192e',
  cancelButtonColor: '#5b5f66',
  customClass: {
    popup: 'rounded-[16px]',
    confirmButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
    cancelButton: 'px-6 py-2.5 rounded-[8px] font-medium text-sm',
  },
};

const confirmar = (opciones) =>
  Swal.fire({ icon: 'question', showCancelButton: true, cancelButtonText: 'Volver', ...ESTILO_SWAL, ...opciones }).then(
    (r) => r.isConfirmed
  );

const avisarExito = (title, text) =>
  Swal.fire({ icon: 'success', title, text, confirmButtonText: 'Entendido', ...ESTILO_SWAL, timer: 2600 });

const avisarError = (err, porDefecto) => {
  const { titulo, mensaje } = mensajeErrorInscripcion(err, porDefecto);
  return Swal.fire({ icon: 'error', title: titulo, text: mensaje, confirmButtonText: 'Entendido', ...ESTILO_SWAL });
};

const rangoHoras = (a) => `${horaCorta(a.horaInicio) || '--:--'} – ${horaCorta(a.horaFin) || '--:--'}`;

/** Etiqueta y colores de cada estado de actividad. */
const ESTADOS_VISUALES = {
  inscrito: { texto: 'Inscrito', clase: 'bg-green-50 text-green-700 border-green-200', icono: CheckCircle2 },
  agotado: { texto: 'Cupo agotado', clase: 'bg-red-50 text-red-700 border-red-200', icono: XCircle },
  conflicto: { texto: 'Cruce de horario', clase: 'bg-amber-50 text-amber-800 border-amber-200', icono: AlertTriangle },
  no_disponible: { texto: 'No disponible', clase: 'bg-surface-muted text-ink-600 border-border', icono: Clock },
  disponible: { texto: 'Cupos disponibles', clase: 'bg-brand-100 text-brand-700 border-brand-100', icono: Ticket },
};

function EstadoBadge({ estado }) {
  const { texto, clase, icono: Icono } = ESTADOS_VISUALES[estado] || ESTADOS_VISUALES.no_disponible;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${clase}`}>
      <Icono className="w-3.5 h-3.5" aria-hidden="true" />
      {texto}
    </span>
  );
}

/** Barra de ocupación de la sala: inscritos / aforo. */
function BarraCupo({ cupo }) {
  if (!cupo) return <p className="text-[11px] text-ink-600">Cupo no disponible</p>;
  const pct = porcentajeOcupacion(cupo);
  const color = cupo.cupoAgotado ? 'bg-red-600' : pct >= 80 ? 'bg-amber-500' : 'bg-green-600';
  return (
    <div className="w-full">
      <div className="flex justify-between text-[11px] text-ink-600 mb-1">
        <span className="inline-flex items-center gap-1">
          <Users className="w-3 h-3" aria-hidden="true" />
          {cupo.inscritos} / {cupo.aforoMaximo} inscritos
        </span>
        <span className={cupo.cupoAgotado ? 'text-red-700 font-semibold' : 'font-medium text-ink-900'}>
          {cupo.cupoAgotado ? 'Sin cupos' : `${cupo.cuposDisponibles} libres`}
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-border overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Ocupación de la actividad"
      >
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {{ id: number, nombre: string, estado: string, fechaInicio?: string, fechaFin?: string }} props.evento
 * @param {typeof inscripcionService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {function(): void} props.onClose
 */
export default function InscripcionEventoModal({ isOpen, evento, api = inscripcionService, onClose }) {
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [inscripcion, setInscripcion] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [cupos, setCupos] = useState({});
  const [categoria, setCategoria] = useState('');
  const [errorCategoria, setErrorCategoria] = useState('');
  const [procesando, setProcesando] = useState(null); // 'evento' | 'cancelar-evento' | id de actividad
  const [version, setVersion] = useState(0);

  const abiertas = inscripcionesAbiertas(evento);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!isOpen || !evento?.id) return undefined;
    let activo = true;
    Promise.all([api.obtenerMiInscripcion(evento.id), api.listarActividadesInscribibles(evento.id)])
      .then(async ([mia, lista]) => {
        const ids = lista.filter((a) => a.inscribible).map((a) => a.id);
        const mapaCupos = ids.length ? await api.consultarCupos(evento.id, ids) : {};
        if (!activo) return;
        setInscripcion(mia);
        setActividades(lista);
        setCupos(mapaCupos);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (activo) setErrorCarga(mensajeErrorInscripcion(err, 'No se pudo cargar la inscripción').mensaje);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, evento?.id, api, version]);

  const inscritas = useMemo(
    () => completarSimultaneidad(inscripcion?.actividades, actividades),
    [inscripcion, actividades]
  );
  const dias = useMemo(() => agruparPorDia(actividades), [actividades]);

  /** Ejecuta una operación mostrando el estado de carga y recargando al terminar (también si falla). */
  const ejecutar = async (clave, operacion) => {
    setProcesando(clave);
    try {
      await operacion();
    } finally {
      setProcesando(null);
      recargar();
    }
  };

  // Criterio 1: inscripción al evento con la categoría seleccionada.
  const inscribirEvento = async (e) => {
    e.preventDefault();
    if (!categoria) {
      setErrorCategoria('Selecciona tu categoría de participante.');
      return;
    }
    await ejecutar('evento', async () => {
      try {
        await api.inscribirAEvento(evento.id, categoria);
        avisarExito('¡Inscripción registrada!', `Quedaste inscrito en «${evento.nombre}» como ${etiquetaCategoria(categoria).toLowerCase()}. Ahora puedes elegir tus actividades.`);
      } catch (err) {
        await avisarError(err, 'No se pudo registrar la inscripción');
      }
    });
  };

  const cancelarEvento = async () => {
    const total = inscritas.length;
    const ok = await confirmar({
      icon: 'warning',
      title: '¿Cancelar tu inscripción al evento?',
      text:
        total > 0
          ? `También se cancelarán tus ${total} ${total === 1 ? 'actividad inscrita' : 'actividades inscritas'} y se liberarán sus cupos.`
          : 'Podrás volver a inscribirte mientras las inscripciones sigan abiertas.',
      confirmButtonText: 'Sí, cancelar inscripción',
    });
    if (!ok) return;
    await ejecutar('cancelar-evento', async () => {
      try {
        await api.cancelarMiInscripcion(evento.id);
        avisarExito('Inscripción cancelada', `Ya no estás inscrito en «${evento.nombre}».`);
      } catch (err) {
        await avisarError(err, 'No se pudo cancelar la inscripción');
      }
    });
  };

  // Criterios 2 y 4: inscripción a una actividad con cupo.
  const inscribirActividad = (actividad) =>
    ejecutar(actividad.id, async () => {
      try {
        await api.inscribirAActividad(evento.id, actividad.id);
        avisarExito('Cupo asegurado', `Te inscribiste en «${actividad.nombre}».`);
      } catch (err) {
        await avisarError(err, 'No se pudo inscribir a la actividad');
      }
    });

  // Criterio 5: cancelar libera el cupo.
  const cancelarActividad = async (actividad) => {
    const ok = await confirmar({
      icon: 'warning',
      title: '¿Cancelar esta actividad?',
      text: `Liberarás tu cupo en «${actividad.nombre}» (${rangoHoras(actividad)}).`,
      confirmButtonText: 'Sí, cancelar',
    });
    if (!ok) return;
    await ejecutar(actividad.id, async () => {
      try {
        await api.cancelarInscripcionActividad(evento.id, actividad.id);
        avisarExito('Inscripción cancelada', `Se liberó tu cupo en «${actividad.nombre}».`);
      } catch (err) {
        await avisarError(err, 'No se pudo cancelar la actividad');
      }
    });
  };

  // Criterio 3: hay cruce; solo se permite si cancela la anterior.
  const resolverConflicto = async (actividad, conflicto) => {
    const nombreAnterior = conflicto.actividadNombre || conflicto.nombre;
    const ok = await confirmar({
      icon: 'warning',
      title: 'Conflicto de horario',
      html: `«<b>${escaparHtml(actividad.nombre)}</b>» (${rangoHoras(actividad)}) se cruza con «<b>${escaparHtml(nombreAnterior)}</b>» (${rangoHoras(conflicto)}), en la que ya estás inscrito.<br/><br/>Para inscribirte debes cancelar la anterior.`,
      confirmButtonText: 'Cancelar la anterior e inscribirme',
    });
    if (!ok) return;
    const idAnterior = conflicto.actividadId ?? conflicto.id;
    await ejecutar(actividad.id, async () => {
      try {
        await api.cancelarInscripcionActividad(evento.id, idAnterior);
      } catch (err) {
        await avisarError(err, 'No se pudo cancelar la actividad anterior');
        return;
      }
      try {
        await api.inscribirAActividad(evento.id, actividad.id);
        avisarExito('Cambio realizado', `Cancelaste «${nombreAnterior}» y te inscribiste en «${actividad.nombre}».`);
      } catch (err) {
        // No se pudo tomar la nueva: se intenta recuperar el cupo anterior para no dejarlo sin ninguna.
        let recuperada = false;
        try {
          await api.inscribirAActividad(evento.id, idAnterior);
          recuperada = true;
        } catch {
          // La anterior queda cancelada; se informa abajo.
        }
        const { titulo, mensaje } = mensajeErrorInscripcion(err, 'No se pudo inscribir a la actividad');
        await Swal.fire({
          icon: 'error',
          title: titulo,
          text: `${mensaje} ${recuperada ? `Conservas tu inscripción en «${nombreAnterior}».` : `Tu inscripción en «${nombreAnterior}» quedó cancelada.`}`,
          confirmButtonText: 'Entendido',
          ...ESTILO_SWAL,
        });
      }
    });
  };

  if (!isOpen) return null;

  const pie = (
    <>
      {inscripcion && abiertas && (
        <Button type="button" variant="outline" onClick={cancelarEvento} loading={procesando === 'cancelar-evento'} disabled={procesando !== null}>
          Cancelar inscripción al evento
        </Button>
      )}
      <Button type="button" variant="secondary" onClick={onClose}>
        Cerrar
      </Button>
    </>
  );

  return (
    <ModalShell
      titulo={`Inscripción — ${evento.nombre}`}
      subtitulo={formatearRango(evento.fechaInicio, evento.fechaFin)}
      icono={CalendarCheck}
      onClose={onClose}
      pie={pie}
      ancho="max-w-3xl"
      tituloId="inscripcion-evento-titulo"
    >
      {cargando ? (
        <p className="py-12 text-center text-sm text-ink-600" role="status">
          Cargando tu inscripción...
        </p>
      ) : errorCarga ? (
        <div className="py-12 text-center">
          <p className="font-semibold text-ink-900">No se pudo cargar la información</p>
          <p className="text-xs text-ink-600 mt-1">{errorCarga}</p>
          <button
            type="button"
            onClick={() => {
              setErrorCarga(null);
              setCargando(true);
              recargar();
            }}
            className="text-xs mt-2 text-brand-600 font-semibold underline cursor-pointer">
            Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Paso 1: inscripción al evento */}
          {inscripcion ? (
            <section className="rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold text-ink-900">Estás inscrito en este evento</p>
                <p className="text-ink-600 text-xs mt-0.5">
                  Categoría: <strong className="text-ink-900">{etiquetaCategoria(inscripcion.categoria)}</strong>
                  {inscripcion.fechaInscripcion && <> · desde el {formatearFecha(inscripcion.fechaInscripcion.slice(0, 10))}</>}
                  {' · '}
                  {inscritas.length} {inscritas.length === 1 ? 'actividad inscrita' : 'actividades inscritas'}
                </p>
              </div>
            </section>
          ) : abiertas ? (
            <form onSubmit={inscribirEvento} className="rounded-[12px] border border-border p-4 space-y-3" noValidate>
              <div>
                <h3 className="font-semibold text-ink-900">Paso 1: inscríbete al evento</h3>
                <p className="text-xs text-ink-600 mt-0.5">
                  Selecciona tu categoría de participante. Después podrás elegir las actividades de tu interés.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1">
                  <Select
                    id="categoria-participante"
                    label="Categoría"
                    value={categoria}
                    onChange={(e) => {
                      setCategoria(e.target.value);
                      setErrorCategoria('');
                    }}
                    options={CATEGORIAS_PARTICIPANTE}
                    placeholder="Selecciona tu categoría"
                    error={errorCategoria}
                    required
                  />
                </div>
                <Button type="submit" variant="primary" className="sm:mt-7" loading={procesando === 'evento'} disabled={procesando !== null}>
                  Inscribirme al evento
                </Button>
              </div>
            </form>
          ) : (
            <section className="rounded-[12px] border border-border bg-surface-muted px-4 py-3 text-sm text-ink-600">
              Las inscripciones a este evento no están abiertas.
            </section>
          )}

          {/* Paso 2: actividades */}
          <section>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-ink-900">{inscripcion ? 'Paso 2: elige tus actividades' : 'Actividades del evento'}</h3>
                <p className="text-xs text-ink-600 mt-0.5">
                  {inscripcion
                    ? 'El cupo depende del aforo de la sala. No puedes inscribirte a dos actividades con horarios cruzados.'
                    : 'Inscríbete primero al evento para poder elegir actividades.'}
                </p>
              </div>
            </div>

            {dias.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-600 rounded-[12px] border border-dashed border-border">
                La agenda de este evento todavía no se ha publicado. Cuando se publique podrás elegir tus actividades.
              </p>
            ) : (
              <div className="space-y-5">
                {dias.map((dia) => (
                  <div key={dia.fecha || 'sin-fecha'}>
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
                      {dia.fecha ? formatearFecha(dia.fecha) : 'Sin fecha asignada'}
                    </p>
                    <ul className="space-y-2">
                      {dia.actividades.map((actividad) => {
                        const cupo = cupos[actividad.id];
                        const { estado, conflicto } = estadoActividad(actividad, cupo, inscritas);
                        const ocupado = procesando !== null;
                        return (
                          <li
                            key={actividad.id}
                            className={`rounded-[12px] border p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 ${
                              estado === 'inscrito' ? 'border-green-200 bg-green-50/40' : 'border-border bg-white'
                            }`}
                          >
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-sm text-ink-900">{actividad.nombre}</p>
                                <EstadoBadge estado={estado} />
                              </div>
                              <p className="text-xs text-ink-600 flex flex-wrap gap-x-3 gap-y-0.5">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" aria-hidden="true" />
                                  {rangoHoras(actividad)}
                                </span>
                                {actividad.sala && (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-3 h-3" aria-hidden="true" />
                                    {actividad.sala}
                                  </span>
                                )}
                                {actividad.ponente && (
                                  <span className="inline-flex items-center gap-1">
                                    <Mic className="w-3 h-3" aria-hidden="true" />
                                    {actividad.ponente}
                                  </span>
                                )}
                                {actividad.tipo && <span>{actividad.tipo}</span>}
                              </p>
                              {estado === 'conflicto' && conflicto && (
                                <p className="text-[11px] text-amber-800">
                                  Se cruza con «{conflicto.actividadNombre || conflicto.nombre}» ({rangoHoras(conflicto)}).
                                </p>
                              )}
                              {actividad.inscribible && <BarraCupo cupo={cupo} />}
                            </div>

                            {inscripcion && abiertas && (
                              <div className="shrink-0 sm:w-40 flex sm:justify-end">
                                {estado === 'inscrito' && (
                                  <Button type="button" variant="outline" onClick={() => cancelarActividad(actividad)} loading={procesando === actividad.id} disabled={ocupado}>
                                    Cancelar
                                  </Button>
                                )}
                                {estado === 'disponible' && (
                                  <Button type="button" variant="primary" onClick={() => inscribirActividad(actividad)} loading={procesando === actividad.id} disabled={ocupado}>
                                    Inscribirme
                                  </Button>
                                )}
                                {estado === 'conflicto' && (
                                  <Button type="button" variant="outline" onClick={() => resolverConflicto(actividad, conflicto)} loading={procesando === actividad.id} disabled={ocupado}>
                                    Cambiar horario
                                  </Button>
                                )}
                                {estado === 'agotado' && (
                                  <Button type="button" variant="primary" disabled>
                                    Sin cupos
                                  </Button>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </ModalShell>
  );
}

