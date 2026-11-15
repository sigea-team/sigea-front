/**
 * @file inscripcionUtils.js
 * @description Utilidades de la inscripción a eventos y actividades (HU-23): categorías, normalización de
 * actividades, detección de cruces de horario, estado de cada actividad para el participante y mensajes de error.
 * @module features/inscripciones/inscripcionUtils
 */

/** Categorías del participante (CHECK de inscripciones_evento.categoria_participante). */
export const CATEGORIAS_PARTICIPANTE = [
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'egresado', label: 'Egresado' },
  { value: 'docente', label: 'Docente' },
  { value: 'particular', label: 'Particular' },
];

/** Estados del evento con inscripciones abiertas (misma regla que el backend). */
export const ESTADOS_INSCRIPCION_ABIERTA = ['habilitado', 'en_ejecucion'];

/** @param {string} categoria */
export function etiquetaCategoria(categoria) {
  return CATEGORIAS_PARTICIPANTE.find((c) => c.value === categoria)?.label || '—';
}

/**
 * Indica si el evento admite inscripciones: publicado o en ejecución y con la fecha de fin sin vencer.
 * @param {{ estado?: string, fechaFin?: string } | null | undefined} evento
 * @param {string} [hoy] - "AAAA-MM-DD"; por defecto, la fecha local actual.
 * @returns {boolean}
 */
export function inscripcionesAbiertas(evento, hoy = fechaLocalHoy()) {
  if (!evento || !ESTADOS_INSCRIPCION_ABIERTA.includes(evento.estado)) return false;
  return !evento.fechaFin || evento.fechaFin >= hoy;
}

function fechaLocalHoy() {
  const d = new Date();
  const dos = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** "09:00:00" → "09:00"; null si no hay hora. */
export function horaCorta(h) {
  return typeof h === 'string' && h.length >= 5 ? h.slice(0, 5) : null;
}

/**
 * Normaliza una ActividadResponse (HU-21) al modelo que usa la inscripción.
 * Solo son inscribibles las actividades programadas, con fecha, horario y sala.
 * @param {Object} a
 * @returns {{ id: number, nombre: string, tipo: string, fecha: string|null, horaInicio: string|null,
 *   horaFin: string|null, sala: string, ponente: string, modalidad: string, simultanea: boolean, inscribible: boolean }}
 */
export function normalizarActividadInscribible(a) {
  const estado = String(a?.estado || 'programada').toLowerCase();
  const fecha = a?.fecha ?? null;
  const horaInicio = horaCorta(a?.horaInicio);
  const horaFin = horaCorta(a?.horaFin);
  const tieneSala = Boolean(a?.salaId ?? a?.salaNombre ?? a?.sala);
  return {
    id: a?.id,
    nombre: a?.nombre || '',
    tipo: a?.tipoActividadNombre || a?.tipoActividad || '',
    fecha,
    horaInicio,
    horaFin,
    sala: a?.salaNombre || a?.sala || '',
    ponente: a?.ponenteNombre || a?.ponente || '',
    modalidad: a?.modalidad || '',
    simultanea: Boolean(a?.simultanea ?? a?.permiteSimultaneidad),
    inscribible:
      estado !== 'por_programar' && estado !== 'cancelada' && Boolean(fecha && horaInicio && horaFin && tieneSala),
  };
}

/**
 * Convierte la agenda publicada (AgendaPublicaResponse, organizada por días) en una lista plana de actividades.
 * @param {{ dias?: Array<{ fecha: string, actividades?: Array<Object> }> } | null | undefined} agenda
 * @returns {Array<Object>}
 */
export function aplanarAgendaPublica(agenda) {
  const dias = Array.isArray(agenda?.dias) ? agenda.dias : [];
  return dias.flatMap((dia) =>
    (Array.isArray(dia?.actividades) ? dia.actividades : []).map((a) =>
      normalizarActividadInscribible({ ...a, fecha: dia.fecha })
    )
  );
}

/**
 * Ordena por fecha y hora de inicio.
 * @param {Array<{ fecha?: string|null, horaInicio?: string|null }>} actividades
 */
export function ordenarPorHorario(actividades) {
  return [...actividades].sort((a, b) =>
    `${a.fecha || '9999'}T${a.horaInicio || '99'}`.localeCompare(`${b.fecha || '9999'}T${b.horaInicio || '99'}`)
  );
}

/**
 * Agrupa las actividades por fecha, en orden cronológico.
 * @param {Array<Object>} actividades
 * @returns {Array<{ fecha: string|null, actividades: Array<Object> }>}
 */
export function agruparPorDia(actividades) {
  const grupos = new Map();
  ordenarPorHorario(actividades).forEach((a) => {
    const clave = a.fecha || null;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(a);
  });
  return [...grupos.entries()].map(([fecha, lista]) => ({ fecha, actividades: lista }));
}

/**
 * Misma regla que el backend: mismo día y los intervalos se cruzan (los extremos que solo se tocan no cuentan).
 * Si alguna de las dos permite simultaneidad, no hay conflicto.
 * @param {{ fecha?: string|null, horaInicio?: string|null, horaFin?: string|null }} a
 * @param {{ fecha?: string|null, horaInicio?: string|null, horaFin?: string|null }} b
 * @returns {boolean}
 */
export function hayTraslape(a, b) {
  if (!a || !b || !a.fecha || a.fecha !== b.fecha) return false;
  if (a.simultanea || b.simultanea) return false;
  const [ai, af, bi, bf] = [a.horaInicio, a.horaFin, b.horaInicio, b.horaFin].map(horaCorta);
  if (!ai || !af || !bi || !bf) return false;
  return ai < bf && af > bi;
}

/**
 * Primera actividad inscrita que se cruza con la indicada (Criterio 3), o null.
 * @param {Object} actividad
 * @param {Array<Object>} inscritas - Actividades ya inscritas (con `actividadId` o `id`).
 * @returns {Object|null}
 */
export function buscarConflicto(actividad, inscritas) {
  return (
    (inscritas || []).find((i) => idActividad(i) !== actividad.id && hayTraslape(i, actividad)) || null
  );
}

/**
 * InscripcionActividadResponse no trae `simultanea`; se completa con la actividad del catálogo.
 * @param {Array<Object>} inscritas
 * @param {Array<Object>} actividades - Actividades normalizadas.
 * @returns {Array<Object>}
 */
export function completarSimultaneidad(inscritas, actividades) {
  const porId = new Map((actividades || []).map((a) => [a.id, a]));
  return (inscritas || []).map((i) => ({ ...i, simultanea: Boolean(i.simultanea || porId.get(idActividad(i))?.simultanea) }));
}

/** Id de actividad de una InscripcionActividadResponse o de una actividad normalizada. */
export function idActividad(item) {
  return item?.actividadId ?? item?.id;
}

/**
 * Estado de una actividad para el participante, en orden de prioridad:
 * - `inscrito`: ya está inscrito (puede cancelar).
 * - `cerrada`: el evento ya no admite inscripciones (no se muestran cupos ni conflictos).
 * - `no_disponible`: sin horario o sala, o cancelada.
 * - `agotado`: alcanzó el aforo de la sala (Criterios 2 y 4).
 * - `conflicto`: se cruza con otra inscrita (Criterio 3).
 * - `disponible`.
 * @param {Object} actividad - Actividad normalizada.
 * @param {Object|undefined} cupo - CupoActividadResponse.
 * @param {Array<Object>} inscritas - InscripcionActividadResponse del participante.
 * @param {boolean} [abiertas=true] - Si el evento admite inscripciones (ver {@link inscripcionesAbiertas}).
 * @returns {{ estado: 'inscrito'|'cerrada'|'no_disponible'|'agotado'|'conflicto'|'disponible', conflicto: Object|null }}
 */
export function estadoActividad(actividad, cupo, inscritas, abiertas = true) {
  const yaInscrito =
    Boolean(cupo?.estaInscrito) || (inscritas || []).some((i) => idActividad(i) === actividad.id);
  if (yaInscrito) return { estado: 'inscrito', conflicto: null };
  if (!abiertas) return { estado: 'cerrada', conflicto: null };
  if (!actividad.inscribible) return { estado: 'no_disponible', conflicto: null };
  if (cupo?.cupoAgotado) return { estado: 'agotado', conflicto: null };
  const conflicto = buscarConflicto(actividad, inscritas);
  if (conflicto) return { estado: 'conflicto', conflicto };
  return { estado: 'disponible', conflicto: null };
}

/**
 * Porcentaje de ocupación (0-100) de una actividad según su cupo.
 * @param {{ aforoMaximo?: number, inscritos?: number } | undefined} cupo
 */
export function porcentajeOcupacion(cupo) {
  const aforo = Number(cupo?.aforoMaximo) || 0;
  if (aforo <= 0) return 0;
  return Math.min(100, Math.round(((Number(cupo?.inscritos) || 0) / aforo) * 100));
}

/** Títulos de alerta según el código de error del backend. */
const TITULO_POR_CODIGO = {
  INSCRIPCION_DUPLICADA: 'Ya estás inscrito',
  CUPO_AGOTADO: 'Cupo agotado',
  CONFLICTO_HORARIO_INSCRIPCION: 'Conflicto de horario',
  OPERACION_NO_PERMITIDA: 'Inscripción no permitida',
};

/**
 * Título y texto para informar al participante por qué se rechazó una inscripción (Criterio 4).
 * @param {any} err - Error de Axios.
 * @param {string} [porDefecto]
 * @returns {{ titulo: string, mensaje: string, codigo: string|undefined, status: number|undefined }}
 */
export function mensajeErrorInscripcion(err, porDefecto = 'No se pudo completar la inscripción') {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const codigo = data?.codigo;
  const mensajeBackend = typeof data?.message === 'string' && data.message.trim() ? data.message : null;

  let mensaje;
  if (status === 401) mensaje = 'Tu sesión expiró. Inicia sesión de nuevo.';
  else if (status === 403) mensaje = 'Tu usuario no tiene permiso para realizar esta inscripción.';
  else if (mensajeBackend) mensaje = mensajeBackend;
  else if (err?.request && !err?.response) mensaje = 'No fue posible conectarse con el servidor. Intenta de nuevo.';
  else mensaje = 'Ocurrió un error inesperado. Intenta de nuevo.';

  return { titulo: TITULO_POR_CODIGO[codigo] || porDefecto, mensaje, codigo, status };
}
