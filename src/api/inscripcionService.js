import { httpClient } from './httpClient';
import { aplanarAgendaPublica } from '../features/inscripciones/inscripcionUtils';

/**
 * @file inscripcionService.js
 * @description Cliente de la API de inscripciones a eventos y actividades (HU-23).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Endpoints del backend (InscripcionController):
 * - POST   /api/v1/eventos/{eventoId}/inscripciones                                   -> Inscribirse al evento (Criterio 1)
 * - GET    /api/v1/eventos/{eventoId}/inscripciones/mi-inscripcion                    -> Mi inscripción y mis actividades
 * - DELETE /api/v1/eventos/{eventoId}/inscripciones/mi-inscripcion                    -> Cancelar mi inscripción (libera todo)
 * - POST   /api/v1/eventos/{eventoId}/actividades/{actividadId}/inscripciones         -> Inscribirse a una actividad (Criterios 2-4)
 * - DELETE /api/v1/eventos/{eventoId}/actividades/{actividadId}/inscripciones/mi-inscripcion -> Cancelar (Criterio 5)
 * - GET    /api/v1/eventos/{eventoId}/actividades/{actividadId}/cupos                 -> Aforo, inscritos y cupos libres
 * - GET    /api/v1/eventos/{eventoId}/mis-actividades-inscritas                       -> Mis actividades del evento
 *
 * Errores 409 que el backend distingue por `codigo`:
 * - INSCRIPCION_DUPLICADA: ya estaba inscrito (no se crea un duplicado).
 * - CUPO_AGOTADO: la actividad alcanzó el aforo de su sala.
 * - CONFLICTO_HORARIO_INSCRIPCION: se traslapa con otra actividad inscrita.
 * - OPERACION_NO_PERMITIDA: inscripciones cerradas, no inscrito al evento o actividad no disponible.
 * @module api/inscripcionService
 */

const rutaEvento = (eventoId) => `/eventos/${eventoId}`;

/**
 * Inscribe al usuario autenticado en el evento con la categoría elegida (Criterio 1).
 * @param {number|string} eventoId
 * @param {'estudiante'|'egresado'|'docente'|'particular'} categoria
 * @returns {Promise<Object>} InscripcionEventoResponse
 */
export async function inscribirAEvento(eventoId, categoria) {
  const { data } = await httpClient.post(`${rutaEvento(eventoId)}/inscripciones`, { categoria });
  return data;
}

/**
 * Inscripción del usuario en el evento con sus actividades. Si no está inscrito (404) devuelve null.
 * @param {number|string} eventoId
 * @returns {Promise<Object|null>} MiInscripcionResponse o null
 */
export async function obtenerMiInscripcion(eventoId) {
  try {
    const { data } = await httpClient.get(`${rutaEvento(eventoId)}/inscripciones/mi-inscripcion`);
    return data ? { ...data, actividades: Array.isArray(data.actividades) ? data.actividades : [] } : null;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

/**
 * Cancela la inscripción al evento; el backend libera en cascada los cupos de sus actividades (Criterio 5).
 * @param {number|string} eventoId
 */
export async function cancelarMiInscripcion(eventoId) {
  await httpClient.delete(`${rutaEvento(eventoId)}/inscripciones/mi-inscripcion`);
}

/**
 * Inscribe al usuario en una actividad (Criterios 2, 3 y 4).
 * @param {number|string} eventoId
 * @param {number|string} actividadId
 * @returns {Promise<Object>} InscripcionActividadResponse
 */
export async function inscribirAActividad(eventoId, actividadId) {
  const { data } = await httpClient.post(`${rutaEvento(eventoId)}/actividades/${actividadId}/inscripciones`);
  return data;
}

/**
 * Cancela la inscripción a una actividad y libera su cupo (Criterio 5).
 * @param {number|string} eventoId
 * @param {number|string} actividadId
 */
export async function cancelarInscripcionActividad(eventoId, actividadId) {
  await httpClient.delete(`${rutaEvento(eventoId)}/actividades/${actividadId}/inscripciones/mi-inscripcion`);
}

/**
 * Aforo, inscritos y cupos libres de una actividad.
 * @param {number|string} eventoId
 * @param {number|string} actividadId
 * @returns {Promise<{ actividadId: number, actividadNombre: string, aforoMaximo: number, inscritos: number,
 *   cuposDisponibles: number, cupoAgotado: boolean, estaInscrito: boolean }>}
 */
export async function consultarCupo(eventoId, actividadId) {
  const { data } = await httpClient.get(`${rutaEvento(eventoId)}/actividades/${actividadId}/cupos`);
  return data;
}

/**
 * Cupos de varias actividades a la vez. Las que fallen quedan sin entrada en el mapa.
 * @param {number|string} eventoId
 * @param {Array<number|string>} actividadIds
 * @returns {Promise<Record<string, Object>>} Cupo por id de actividad.
 */
export async function consultarCupos(eventoId, actividadIds) {
  const resultados = await Promise.allSettled(actividadIds.map((id) => consultarCupo(eventoId, id)));
  const cupos = {};
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) cupos[actividadIds[i]] = r.value;
  });
  return cupos;
}

/**
 * Actividades del evento a las que el usuario está inscrito.
 * @param {number|string} eventoId
 * @returns {Promise<Array<Object>>}
 */
export async function listarMisActividades(eventoId) {
  const { data } = await httpClient.get(`${rutaEvento(eventoId)}/mis-actividades-inscritas`);
  return Array.isArray(data) ? data : [];
}

/**
 * Actividades del evento que se ofrecen para inscripción: solo las de la agenda publicada (HU-22).
 * No se usa GET /eventos/{id}/actividades porque exige EVENTOS_VER, permiso que el participante no tiene
 * (muestra también eventos sin publicar). Si la agenda no está publicada, no hay actividades que ofrecer.
 * @param {number|string} eventoId
 * @returns {Promise<Array<Object>>} Actividades normalizadas (ver {@link normalizarActividadInscribible}).
 */
export async function listarActividadesInscribibles(eventoId) {
  try {
    const { data } = await httpClient.get(`/publico/eventos/${eventoId}/agenda`);
    return aplanarAgendaPublica(data);
  } catch (err) {
    // Agenda todavía no publicada: no hay actividades que ofrecer.
    if (err?.response?.status === 404) return [];
    throw err;
  }
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const inscripcionService = {
  inscribirAEvento,
  obtenerMiInscripcion,
  cancelarMiInscripcion,
  inscribirAActividad,
  cancelarInscripcionActividad,
  consultarCupo,
  consultarCupos,
  listarMisActividades,
  listarActividadesInscribibles,
};

export default inscripcionService;
