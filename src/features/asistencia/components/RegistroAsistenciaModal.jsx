import { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { AlertTriangle, CheckCircle2, Clock, Mail, Search, ScanLine, UserCheck, Users, XCircle } from 'lucide-react';
import ModalShell from '../../eventos/components/ModalShell';
import Button from '../../../components/ui/Button';
import { asistenciaService } from '../../../api/asistenciaService';
import { formatearFecha } from '../../eventos/eventoUtils';
import { etiquetaCategoria, horaCorta } from '../../inscripciones/inscripcionUtils';
import EscanerQr from './EscanerQr';
import {
  MAX_CODIGO,
  combinarInscritos,
  esLecturaRepetida,
  filtrarInscritos,
  horaRegistro,
  instanteActual,
  interpretarRegistro,
  mensajeError,
  normalizarCodigo,
  porcentajeAsistencia,
  validarCodigo,
} from '../asistenciaUtils';

/**
 * @file RegistroAsistenciaModal.jsx
 * @description HU-24: el organizador registra la asistencia a una actividad.
 * - Criterio 2: escanea el QR con la cámara o escribe/pega el código (también sirve un lector USB, que escribe el
 *   código y envía Enter). El sistema lo valida y registra la asistencia con fecha y hora.
 * - Criterio 3: si el QR no corresponde o la asistencia ya existe, se muestra el motivo sin duplicar.
 * - Registro manual por inscripción y reenvío del QR (Criterio 4) desde la lista de inscritos.
 * La lista de inscritos usa endpoints de HU-23 que exigen INSCRIPCIONES_GESTIONAR; sin ese permiso queda solo
 * la lista de asistentes.
 * @module features/asistencia/components/RegistroAsistenciaModal
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

const ESTILO_RESULTADO = {
  registrada: { clase: 'border-green-200 bg-green-50 text-green-800', icono: CheckCircle2 },
  duplicada: { clase: 'border-amber-200 bg-amber-50 text-amber-900', icono: AlertTriangle },
  rechazada: { clase: 'border-red-200 bg-red-50 text-red-800', icono: XCircle },
  error: { clase: 'border-red-200 bg-red-50 text-red-800', icono: XCircle },
};

const FILTROS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'pendientes', texto: 'Sin registrar' },
  { valor: 'asistieron', texto: 'Asistieron' },
];

/** Vibración corta en celulares para confirmar la lectura sin mirar la pantalla. */
function vibrar(patron) {
  try {
    navigator.vibrate?.(patron);
  } catch {
    // No disponible.
  }
}

function ResultadoLectura({ resultado }) {
  if (!resultado) {
    return (
      <div className="rounded-[12px] border border-dashed border-border px-4 py-3 text-xs text-ink-600 text-center">
        Aquí verás el resultado de cada lectura.
      </div>
    );
  }
  const { clase, icono: Icono } = ESTILO_RESULTADO[resultado.tipo] || ESTILO_RESULTADO.error;
  return (
    <div className={`rounded-[12px] border px-4 py-3 flex items-start gap-3 ${clase}`}>
      <Icono className="w-6 h-6 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold text-sm">{resultado.titulo}</p>
        <p className="text-xs mt-0.5 break-words">{resultado.mensaje}</p>
      </div>
    </div>
  );
}

function BadgeAsistencia({ asistencia }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-green-200 bg-green-50 text-green-700 text-[11px] font-semibold whitespace-nowrap">
      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
      Asistió · {horaRegistro(asistencia.fechaHoraRegistro)}
      {asistencia.metodoRegistro === 'manual' ? ' (manual)' : ''}
    </span>
  );
}

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {{ id: number, nombre: string }} props.evento
 * @param {{ id: number, nombre: string, fecha?: string, horaInicio?: string, horaFin?: string }} props.actividad
 * @param {typeof asistenciaService} [props.api] - Cliente de la API; Storybook inyecta una versión simulada.
 * @param {import('react').ComponentType<{ onLectura: function(string): void }>} [props.Escaner] - Lector de QR;
 *   Storybook inyecta uno simulado porque no hay cámara.
 * @param {function(): void} props.onClose
 */
export default function RegistroAsistenciaModal({
  isOpen,
  evento,
  actividad,
  api = asistenciaService,
  Escaner = EscanerQr,
  onClose,
}) {
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [resumen, setResumen] = useState({ inscritos: 0, asistentes: 0, asistencias: [] });
  const [inscritos, setInscritos] = useState({ inscritosActividad: [], inscripcionesEvento: [] });
  const [errorInscritos, setErrorInscritos] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [codigoTexto, setCodigoTexto] = useState('');
  const [procesando, setProcesando] = useState(null); // 'qr' | inscripcionId | `correo-${id}`
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [version, setVersion] = useState(0);

  const ultimaLecturaRef = useRef(null);
  const ocupadoRef = useRef(false);
  const campoCodigoRef = useRef(null);

  const eventoId = evento?.id;
  const actividadId = actividad?.id;

  useEffect(() => {
    if (!isOpen || !eventoId || !actividadId) return undefined;
    let activo = true;
    Promise.allSettled([api.listarAsistencias(eventoId, actividadId), api.listarInscritosParaAsistencia(eventoId, actividadId)])
      .then(([resAsistencias, resInscritos]) => {
        if (!activo) return;
        if (resAsistencias.status === 'fulfilled') {
          setResumen(resAsistencias.value);
          setErrorCarga(null);
        } else {
          setErrorCarga(mensajeError(resAsistencias.reason, 'No se pudieron cargar las asistencias.'));
        }
        if (resInscritos.status === 'fulfilled') {
          setInscritos(resInscritos.value);
          setErrorInscritos(null);
        } else {
          const status = resInscritos.reason?.response?.status;
          setErrorInscritos(
            status === 403
              ? 'Tu usuario no puede ver la lista de inscritos (permiso «Gestionar inscripciones»). Puedes registrar la asistencia con el QR.'
              : mensajeError(resInscritos.reason, 'No se pudo cargar la lista de inscritos.')
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [isOpen, eventoId, actividadId, api, version]);

  const filas = useMemo(
    () => combinarInscritos(inscritos.inscritosActividad, inscritos.inscripcionesEvento, resumen.asistencias),
    [inscritos, resumen.asistencias]
  );
  const filasVisibles = useMemo(() => {
    const porEstado =
      filtro === 'pendientes' ? filas.filter((f) => !f.asistencia) : filtro === 'asistieron' ? filas.filter((f) => f.asistencia) : filas;
    return filtrarInscritos(porEstado, busqueda);
  }, [filas, filtro, busqueda]);

  /**
   * Suma la asistencia nueva sin recargar todo (el escáner se usa seguido). Se deduplica por asistencia y por
   * inscripción: un participante tiene a lo sumo una asistencia por actividad.
   */
  const agregarAsistencia = (asistencia) => {
    setResumen((prev) => {
      const yaEsta = prev.asistencias.some(
        (a) =>
          a.asistenciaId === asistencia.asistenciaId || String(a.inscripcionId) === String(asistencia.inscripcionId)
      );
      if (yaEsta) return prev;
      return { ...prev, asistentes: (prev.asistentes ?? prev.asistencias.length) + 1, asistencias: [...prev.asistencias, asistencia] };
    });
  };

  const mostrarResultado = (r) => {
    setResultado({ ...r, instante: instanteActual() });
    vibrar(r.tipo === 'registrada' ? 80 : [60, 40, 60]);
  };

  // Criterios 2 y 3: registro con el código leído o escrito.
  const registrarCodigo = async (texto, origen) => {
    const codigo = normalizarCodigo(texto);
    const invalido = validarCodigo(codigo);
    if (invalido) {
      if (origen === 'texto') mostrarResultado({ tipo: 'rechazada', titulo: 'Falta el código', mensaje: invalido });
      return;
    }
    const ahora = instanteActual();
    if (origen === 'camara' && esLecturaRepetida(ultimaLecturaRef.current, codigo, ahora)) return;
    if (ocupadoRef.current) return;
    ultimaLecturaRef.current = { codigo, instante: ahora };
    ocupadoRef.current = true;
    setProcesando('qr');
    try {
      const asistencia = await api.registrarPorQr(eventoId, actividadId, codigo);
      mostrarResultado(interpretarRegistro({ asistencia }));
      agregarAsistencia(asistencia);
      if (origen === 'texto') setCodigoTexto('');
    } catch (error) {
      mostrarResultado(interpretarRegistro({ error }));
    } finally {
      ocupadoRef.current = false;
      setProcesando(null);
      if (origen === 'texto') campoCodigoRef.current?.focus();
    }
  };

  const enviarTexto = (e) => {
    e.preventDefault();
    registrarCodigo(codigoTexto, 'texto');
  };

  const registrarManual = async (fila) => {
    const { isConfirmed } = await Swal.fire({
      icon: 'question',
      title: '¿Registrar la asistencia sin QR?',
      text: `Se registrará la asistencia de ${fila.nombre} a «${actividad.nombre}» con la hora actual.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Volver',
      ...ESTILO_SWAL,
    });
    if (!isConfirmed) return;
    setProcesando(fila.inscripcionId);
    try {
      const asistencia = await api.registrarManual(eventoId, actividadId, fila.inscripcionId);
      mostrarResultado(interpretarRegistro({ asistencia }));
      agregarAsistencia(asistencia);
    } catch (error) {
      mostrarResultado(interpretarRegistro({ error }));
      // Si ya existía, se recarga para mostrarla en la lista.
      if (error?.response?.data?.codigo === 'ASISTENCIA_DUPLICADA') setVersion((v) => v + 1);
    } finally {
      setProcesando(null);
    }
  };

  // Criterio 4: el organizador reenvía el mismo QR.
  const reenviarQr = async (fila) => {
    const { isConfirmed } = await Swal.fire({
      icon: 'question',
      title: '¿Reenviar el código QR?',
      text: `Se enviará a ${fila.correo || 'su correo'} el mismo código de su inscripción.`,
      showCancelButton: true,
      confirmButtonText: 'Reenviar',
      cancelButtonText: 'Volver',
      ...ESTILO_SWAL,
    });
    if (!isConfirmed) return;
    setProcesando(`correo-${fila.inscripcionId}`);
    try {
      const r = await api.reenviarQrInscripcion(eventoId, fila.inscripcionId);
      await Swal.fire({
        icon: r?.enviado ? 'success' : 'warning',
        title: r?.enviado ? 'Código QR reenviado' : 'No se pudo enviar el correo',
        text: r?.mensaje || '',
        confirmButtonText: 'Entendido',
        ...ESTILO_SWAL,
      });
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudo reenviar el código',
        text: mensajeError(err, 'Intenta de nuevo.'),
        confirmButtonText: 'Entendido',
        ...ESTILO_SWAL,
      });
    } finally {
      setProcesando(null);
    }
  };

  if (!isOpen) return null;

  const asistentes = resumen.asistentes ?? resumen.asistencias.length;
  const totalInscritos = resumen.inscritos ?? filas.length;
  const pct = porcentajeAsistencia(asistentes, totalInscritos);
  const subtitulo = [
    actividad?.fecha ? formatearFecha(actividad.fecha) : null,
    actividad?.horaInicio ? `${horaCorta(actividad.horaInicio)} – ${horaCorta(actividad.horaFin)}` : null,
    evento?.nombre,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ModalShell
      titulo={`Asistencia — ${actividad?.nombre || ''}`}
      subtitulo={subtitulo}
      icono={UserCheck}
      onClose={onClose}
      ancho="max-w-4xl"
      tituloId="registro-asistencia-titulo"
      pie={
        <Button type="button" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {cargando ? (
        <p className="py-12 text-center text-sm text-ink-600" role="status">
          Cargando asistencias...
        </p>
      ) : errorCarga ? (
        <div className="py-12 text-center" role="alert">
          <p className="font-semibold text-ink-900">No se pudo cargar la información</p>
          <p className="text-xs text-ink-600 mt-1">{errorCarga}</p>
          <button
            type="button"
            onClick={() => {
              setCargando(true);
              setVersion((v) => v + 1);
            }}
            className="text-xs mt-2 text-brand-600 font-semibold underline cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-5 md:grid-cols-[300px_1fr]">
            {/* Lector */}
            <section className="space-y-3" aria-label="Lector de código QR">
              <Escaner onLectura={(texto) => registrarCodigo(texto, 'camara')} />
              <form onSubmit={enviarTexto} className="flex gap-2" noValidate>
                <label htmlFor="codigo-qr-asistencia" className="sr-only">
                  Código QR
                </label>
                <input
                  id="codigo-qr-asistencia"
                  ref={campoCodigoRef}
                  value={codigoTexto}
                  onChange={(e) => setCodigoTexto(e.target.value)}
                  maxLength={MAX_CODIGO}
                  placeholder="Escribe o pega el código"
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 min-w-0 h-10 px-3 rounded-[8px] border border-field-border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
                <Button type="submit" variant="primary" className="h-10! px-4!" loading={procesando === 'qr'} disabled={procesando === 'qr'}>
                  Registrar
                </Button>
              </form>
            </section>

            {/* Resultado y contador */}
            <section className="space-y-4">
              <div aria-live="polite" aria-atomic="true">
                <ResultadoLectura key={resultado?.instante} resultado={resultado} />
              </div>
              <div className="rounded-[12px] border border-border p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-ink-600">Asistentes registrados</p>
                    <p className="text-2xl font-semibold text-ink-900">
                      {asistentes} <span className="text-sm font-normal text-ink-600">/ {totalInscritos} inscritos</span>
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-ink-900">{pct}%</p>
                </div>
                <div
                  className="mt-2 h-2 w-full rounded-full bg-border overflow-hidden"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Porcentaje de asistencia"
                >
                  <div className="h-full bg-green-600 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <p className="text-[11px] text-ink-600 leading-relaxed flex gap-1.5">
                <ScanLine className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden="true" />
                Cada participante usa el mismo QR en todas sus actividades. Solo se acepta si está inscrito en esta
                actividad, y una segunda lectura no duplica la asistencia.
              </p>
            </section>
          </div>

          {/* Inscritos */}
          <section aria-labelledby="inscritos-asistencia-titulo">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3">
              <div>
                <h3 id="inscritos-asistencia-titulo" className="font-semibold text-ink-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-600" aria-hidden="true" />
                  {errorInscritos ? 'Asistentes' : 'Inscritos en la actividad'}
                </h3>
                <p className="text-xs text-ink-600 mt-0.5">
                  {errorInscritos
                    ? errorInscritos
                    : 'Registra a mano a quien no tenga su QR, o reenvíale el código a su correo.'}
                </p>
              </div>
              {!errorInscritos && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" aria-hidden="true" />
                    <input
                      type="search"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por nombre o correo"
                      aria-label="Buscar inscrito"
                      className="h-9 pl-8 pr-3 w-56 rounded-[8px] border border-field-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                  <div className="inline-flex rounded-[8px] border border-field-border overflow-hidden" role="group" aria-label="Filtrar inscritos">
                    {FILTROS.map((f) => (
                      <button
                        key={f.valor}
                        type="button"
                        onClick={() => setFiltro(f.valor)}
                        aria-pressed={filtro === f.valor}
                        className={`h-9 px-3 text-xs font-medium cursor-pointer ${
                          filtro === f.valor ? 'bg-brand-600 text-white' : 'bg-white text-ink-900 hover:bg-surface-muted'
                        }`}
                      >
                        {f.texto}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {errorInscritos ? (
              resumen.asistencias.length === 0 ? (
                <p className="py-6 text-center text-xs text-ink-600 rounded-[12px] border border-dashed border-border">
                  Todavía no hay asistencias registradas.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-[12px] border border-border">
                  {resumen.asistencias.map((a) => (
                    <li key={a.asistenciaId} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-ink-900 truncate">{a.participanteNombre}</p>
                        <p className="text-[11px] text-ink-600">{etiquetaCategoria(a.categoria)}</p>
                      </div>
                      <BadgeAsistencia asistencia={a} />
                    </li>
                  ))}
                </ul>
              )
            ) : filas.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-600 rounded-[12px] border border-dashed border-border">
                Nadie se ha inscrito todavía en esta actividad.
              </p>
            ) : filasVisibles.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-600 rounded-[12px] border border-dashed border-border">
                No hay inscritos que coincidan con la búsqueda.
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-[12px] border border-border">
                {filasVisibles.map((fila) => (
                  <li key={fila.inscripcionId} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-ink-900 truncate">{fila.nombre}</p>
                      <p className="text-[11px] text-ink-600 truncate">
                        {[fila.correo, fila.categoria ? etiquetaCategoria(fila.categoria) : null].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {fila.asistencia ? (
                        <BadgeAsistencia asistencia={fila.asistencia} />
                      ) : (
                        <button
                          type="button"
                          onClick={() => registrarManual(fila)}
                          disabled={procesando !== null}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-[8px] border border-brand-600 text-brand-600 text-xs font-medium hover:bg-brand-100 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {procesando === fila.inscripcionId ? (
                            <Clock className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          Registrar asistencia
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => reenviarQr(fila)}
                        disabled={procesando !== null}
                        title="Reenviar código QR al correo"
                        aria-label={`Reenviar el código QR a ${fila.nombre}`}
                        className="p-2 rounded-[8px] text-ink-600 hover:text-ink-900 hover:bg-surface-muted cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Mail className={`w-4 h-4 ${procesando === `correo-${fila.inscripcionId}` ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </ModalShell>
  );
}
