import { httpClient } from './httpClient';
import { normalizarActividadResponse } from './actividadService';

/**
 * @file agendaService.js
 * @description Cliente de la API de generación y publicación de la agenda (HU-22: RF38 + RF39).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición (la agenda pública no lo necesita).
 * Endpoints del backend:
 * - POST /api/v1/eventos/{eventoId}/actividades/por-programar                -> Registrar actividad sin horario
 * - PUT  /api/v1/eventos/{eventoId}/actividades/{actividadId}/por-programar  -> Modificarla mientras sigue sin horario
 * - POST /api/v1/eventos/{eventoId}/actividades/{actividadId}/desprogramar   -> Quitarle horario y sala
 * - POST /api/v1/eventos/{eventoId}/agenda/generar                           -> Propuesta (no guarda nada)
 * - POST /api/v1/eventos/{eventoId}/agenda/generar/aplicar                   -> Generar y guardar
 * - GET  /api/v1/eventos/{eventoId}/agenda/validacion                        -> Revisión antes de publicar
 * - POST /api/v1/eventos/{eventoId}/agenda/publicar                          -> Publicar (409 si incompleta o con cruces)
 * - GET  /api/v1/publico/eventos/{eventoId}/agenda                           -> Agenda publicada, sin sesión
 * - GET  /api/v1/eventos/{eventoId}/propuestas-programables                  -> Propuestas con versión definitiva (HU-19)
 * @module api/agendaService
 */

const rutaActividades = (eventoId) => `/eventos/${eventoId}/actividades`;
const rutaAgenda = (eventoId) => `/eventos/${eventoId}/agenda`;

/**
 * Convierte el formulario de una actividad por programar al DTO `ActividadPorProgramarRequest`.
 * @param {{ nombre: string, tipoActividadId: string|number, duracionMinutos: string|number,
 *   ponenteId?: string|number, propuestaId?: string|number, lineaTematicaId?: string|number,
 *   modalidad?: string, simultanea?: boolean }} datos
 * @returns {Object}
 */
export function aPorProgramarRequest(datos) {
  const numeroONulo = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  return {
    nombre: (datos.nombre || '').trim(),
    tipoActividadId: numeroONulo(datos.tipoActividadId),
    duracionMinutos: numeroONulo(datos.duracionMinutos),
    ponenteId: numeroONulo(datos.ponenteId),
    propuestaId: numeroONulo(datos.propuestaId),
    lineaTematicaId: numeroONulo(datos.lineaTematicaId),
    modalidad: datos.modalidad || null,
    simultanea: Boolean(datos.simultanea),
  };
}

/**
 * Registra una actividad con su duración y sin fecha, horario ni sala (Criterio 1).
 * - 400 VALIDACION_FALLIDA: falta nombre, tipo o duración (5 a 1440 minutos).
 * - 404: el tipo de actividad, ponente o propuesta no pertenece al evento.
 * @param {number|string} eventoId
 * @param {Object} datos - Ver {@link aPorProgramarRequest}.
 * @returns {Promise<Object>} Actividad en estado `por_programar`.
 */
export async function registrarPorProgramar(eventoId, datos) {
  const { data } = await httpClient.post(`${rutaActividades(eventoId)}/por-programar`, aPorProgramarRequest(datos));
  return normalizarActividadResponse(data);
}

/**
 * Modifica una actividad que sigue por programar.
 * - 409 OPERACION_NO_PERMITIDA: ya tiene horario (se modifica con el formulario de HU-21).
 * @param {number|string} eventoId
 * @param {number|string} actividadId
 * @param {Object} datos
 * @returns {Promise<Object>}
 */
export async function actualizarPorProgramar(eventoId, actividadId, datos) {
  const { data } = await httpClient.put(
    `${rutaActividades(eventoId)}/${actividadId}/por-programar`,
    aPorProgramarRequest(datos)
  );
  return normalizarActividadResponse(data);
}

/**
 * Quita fecha, horario y sala a una actividad, que vuelve a por programar conservando su duración (ajuste
 * manual del Criterio 1). Si la agenda estaba publicada, el backend avisa a los inscritos (Criterio 5).
 * @param {number|string} eventoId
 * @param {number|string} actividadId
 * @returns {Promise<Object>}
 */
export async function desprogramar(eventoId, actividadId) {
  const { data } = await httpClient.post(`${rutaActividades(eventoId)}/${actividadId}/desprogramar`);
  return normalizarActividadResponse(data);
}

/**
 * Propone una agenda sin guardar nada (Criterios 1 y 2).
 * @param {number|string} eventoId
 * @param {{ reubicarAutomaticas?: boolean }} [opciones] - Volver a ubicar las que puso una generación anterior.
 * @returns {Promise<{ eventoId: number, aplicada: boolean, totalPorUbicar: number,
 *   asignadas: Array<Object>, pendientes: Array<Object> }>}
 */
export async function proponer(eventoId, { reubicarAutomaticas = false } = {}) {
  const { data } = await httpClient.post(`${rutaAgenda(eventoId)}/generar`, null, {
    params: { reubicarAutomaticas },
  });
  return data;
}

/**
 * Calcula la propuesta y la guarda (Criterio 1). Las que no caben siguen por programar (Criterio 2).
 * @param {number|string} eventoId
 * @param {{ reubicarAutomaticas?: boolean }} [opciones]
 * @returns {Promise<Object>} Mismo formato que {@link proponer}, con `aplicada: true`.
 */
export async function aplicar(eventoId, { reubicarAutomaticas = false } = {}) {
  const { data } = await httpClient.post(`${rutaAgenda(eventoId)}/generar/aplicar`, null, {
    params: { reubicarAutomaticas },
  });
  return data;
}

/**
 * Revisa la agenda antes de publicarla (Criterios 3 y 4).
 * @param {number|string} eventoId
 * @returns {Promise<{ eventoId: number, puedePublicar: boolean, motivoNoPublicable: string|null,
 *   publicada: boolean, fechaPublicacion: string|null, totalActividades: number, dias: Array<Object>,
 *   incompletas: Array<Object>, conflictos: Array<Object> }>}
 */
export async function validar(eventoId) {
  const { data } = await httpClient.get(`${rutaAgenda(eventoId)}/validacion`);
  return data;
}

/**
 * Publica la agenda organizada por día (Criterio 3).
 * - 409 AGENDA_INCOMPLETA: hay actividades sin sala u horario (Criterio 4), vienen en `incompletas`.
 * - 409 AGENDA_CON_CONFLICTOS: hay cruces, vienen en `conflictos`.
 * - 409 AGENDA_VACIA u OPERACION_NO_PERMITIDA: sin actividades, evento sin publicar o cerrado.
 * @param {number|string} eventoId
 * @returns {Promise<{ eventoId: number, fechaPublicacion: string, diasPublicados: string[], totalActividades: number }>}
 */
export async function publicar(eventoId) {
  const { data } = await httpClient.post(`${rutaAgenda(eventoId)}/publicar`);
  return data;
}

/**
 * Agenda publicada del evento organizada por día y hora (Criterio 3). No requiere sesión.
 * - 404: el evento no existe, no está publicado o su agenda todavía no se publicó.
 * @param {number|string} eventoId
 * @returns {Promise<{ eventoId: number, eventoNombre: string, fechaPublicacion: string, dias: Array<Object> }>}
 */
export async function obtenerAgendaPublica(eventoId) {
  const { data } = await httpClient.get(`/publico/eventos/${eventoId}/agenda`);
  return data;
}

/**
 * HU-19, Criterio 3: propuestas de las convocatorias del evento con versión definitiva aprobada, las únicas que
 * se pueden vincular a una actividad.
 * @param {number|string} eventoId
 * @param {{ soloSinProgramar?: boolean }} [opciones]
 * @returns {Promise<Array<{ propuestaId: number, titulo: string, convocatoriaTitulo: string,
 *   lineaTematicaId: number|null, numeroVersion: number, autores: string[], ponenteSugeridoId: number|null,
 *   programada: boolean, actividadIds: number[] }>>}
 */
export async function listarPropuestasProgramables(eventoId, { soloSinProgramar = false } = {}) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/propuestas-programables`, {
    params: soloSinProgramar ? { soloSinProgramar: true } : undefined,
  });
  return Array.isArray(data) ? data : [];
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const agendaService = {
  registrarPorProgramar,
  actualizarPorProgramar,
  desprogramar,
  proponer,
  aplicar,
  validar,
  publicar,
  obtenerAgendaPublica,
  listarPropuestasProgramables,
};

export default agendaService;
