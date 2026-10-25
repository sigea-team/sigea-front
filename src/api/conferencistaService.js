/**
 * @file conferencistaService.js
 * @description Cliente de la API del módulo de conferencistas (HU-12: RF16 y RF17).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * - Conferencistas de un evento: /api/v1/eventos/{eventoId}/conferencistas
 * - Invitaciones a conferencistas nuevos: /api/v1/eventos/{eventoId}/conferencistas/invitaciones
 * - Enlace del invitado (sin sesión): /api/v1/publico/invitaciones-conferencista/{token}
 * - Perfil de la persona (datos, trayectoria e historial): /api/v1/conferencistas
 * - Vista pública (sin sesión): /api/v1/publico/eventos/{eventoId}/conferencistas
 * @module api/conferencistaService
 */

import { httpClient } from './httpClient';

/**
 * Conferencistas asociados a un evento.
 * Endpoint: GET /api/v1/eventos/{eventoId}/conferencistas
 * @param {number} eventoId
 * @returns {Promise<Array<Object>>}
 */
export async function listarConferencistas(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/conferencistas`);
  return Array.isArray(data) ? data : [];
}

/**
 * Conferencistas ya registrados (con trayectoria) para vincularlos a un evento (Criterio 3).
 * Endpoint: GET /api/v1/conferencistas?busqueda=&eventoId=
 * @param {string} [busqueda] - Nombre, documento o correo.
 * @param {number} [eventoId] - Marca quién ya está en el evento.
 * @returns {Promise<Array<Object>>}
 */
export async function listarRegistrados(busqueda, eventoId) {
  const params = {};
  if (busqueda && busqueda.trim()) params.busqueda = busqueda.trim();
  if (eventoId) params.eventoId = eventoId;
  const { data } = await httpClient.get('/conferencistas', { params });
  return Array.isArray(data) ? data : [];
}

/**
 * Invitaciones pendientes (vigentes o vencidas) del evento, con su enlace.
 * Endpoint: GET /api/v1/eventos/{eventoId}/conferencistas/invitaciones
 * @param {number} eventoId
 */
export async function listarInvitaciones(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/conferencistas/invitaciones`);
  return Array.isArray(data) ? data : [];
}

/**
 * Invita a un conferencista nuevo con solo nombre y correo; le llega un enlace para registrar sus datos.
 * Si el correo ya es de un conferencista registrado responde 409 CONFERENCISTA_EXISTENTE con `coincidencia`.
 * Endpoint: POST /api/v1/eventos/{eventoId}/conferencistas/invitaciones
 * @param {number} eventoId
 * @param {{ nombre: string, correo: string }} datos
 */
export async function invitarConferencista(eventoId, datos) {
  const { data } = await httpClient.post(`/eventos/${eventoId}/conferencistas/invitaciones`, datos);
  return data;
}

/**
 * Reenvía la invitación con un enlace nuevo (vigente 3 días).
 * Endpoint: POST /api/v1/eventos/{eventoId}/conferencistas/invitaciones/{invitacionId}/reenviar
 */
export async function reenviarInvitacion(eventoId, invitacionId) {
  const { data } = await httpClient.post(`/eventos/${eventoId}/conferencistas/invitaciones/${invitacionId}/reenviar`);
  return data;
}

/**
 * Cancela una invitación pendiente.
 * Endpoint: DELETE /api/v1/eventos/{eventoId}/conferencistas/invitaciones/{invitacionId}
 */
export async function cancelarInvitacion(eventoId, invitacionId) {
  await httpClient.delete(`/eventos/${eventoId}/conferencistas/invitaciones/${invitacionId}`);
}

/**
 * Invitación vista por el conferencista desde el enlace del correo (no requiere sesión).
 * 410 si venció, ya se usó, fue cancelada o el evento ya no recibe conferencistas.
 * Endpoint: GET /api/v1/publico/invitaciones-conferencista/{token}
 * @param {string} token
 */
export async function consultarInvitacion(token) {
  const { data } = await httpClient.get(`/publico/invitaciones-conferencista/${encodeURIComponent(token)}`);
  return data;
}

/**
 * El conferencista registra sus datos y trayectoria desde el enlace y queda vinculado al evento.
 * Endpoint: POST /api/v1/publico/invitaciones-conferencista/{token}
 * @param {string} token
 * @param {Object} datos - CompletarInvitacionRequest
 */
export async function completarInvitacion(token, datos) {
  const { data } = await httpClient.post(`/publico/invitaciones-conferencista/${encodeURIComponent(token)}`, datos);
  return data;
}

/**
 * Asocia al evento una persona que ya existe (Criterio 3).
 * Endpoint: POST /api/v1/eventos/{eventoId}/conferencistas/asociar
 * @param {number} eventoId
 * @param {{ personaId: number, tipoParticipacion: string, tema?: string, trayectoria?: Object|null }} datos
 */
export async function asociarConferencista(eventoId, datos) {
  const { data } = await httpClient.post(`/eventos/${eventoId}/conferencistas/asociar`, datos);
  return data;
}

/**
 * Retira al conferencista del evento; la persona y su trayectoria se conservan.
 * Endpoint: DELETE /api/v1/eventos/{eventoId}/conferencistas/{participacionId}
 * @param {number} eventoId
 * @param {number} participacionId
 */
export async function retirarConferencista(eventoId, participacionId) {
  await httpClient.delete(`/eventos/${eventoId}/conferencistas/${participacionId}`);
}

/**
 * Busca una persona registrada por documento o correo (Criterio 3).
 * Endpoint: GET /api/v1/conferencistas/buscar → 200 con la persona o 204 sin coincidencias.
 * @param {{ numeroDocumento?: string, correo?: string, eventoId?: number }} filtros
 * @returns {Promise<Object|null>} la coincidencia o null
 */
export async function buscarConferencista({ numeroDocumento, correo, eventoId }) {
  const params = {};
  if (numeroDocumento) params.numeroDocumento = numeroDocumento;
  if (correo) params.correo = correo;
  if (eventoId) params.eventoId = eventoId;
  const respuesta = await httpClient.get('/conferencistas/buscar', { params });
  return respuesta.status === 204 || !respuesta.data ? null : respuesta.data;
}

/**
 * Perfil completo: datos, trayectoria e historial de participaciones (RF17).
 * Endpoint: GET /api/v1/conferencistas/{personaId}
 * @param {number} personaId
 */
export async function obtenerPerfilConferencista(personaId) {
  const { data } = await httpClient.get(`/conferencistas/${personaId}`);
  return data;
}

/**
 * Actualiza datos y trayectoria; el cambio se ve de inmediato en la vista pública (Criterio 4).
 * Endpoint: PUT /api/v1/conferencistas/{personaId}
 * @param {number} personaId
 * @param {Object} datos - ActualizarConferencistaRequest
 */
export async function actualizarConferencista(personaId, datos) {
  const { data } = await httpClient.put(`/conferencistas/${personaId}`, datos);
  return data;
}

/**
 * Perfil de ingreso «Conferencista»: perfil del usuario de la sesión (404 si aún no es conferencista).
 * Endpoint: GET /api/v1/conferencistas/mi-perfil
 */
export async function obtenerMiPerfilConferencista() {
  const { data } = await httpClient.get('/conferencistas/mi-perfil');
  return data;
}

/**
 * Perfil de ingreso «Conferencista»: el usuario de la sesión actualiza sus datos y su trayectoria.
 * Endpoint: PUT /api/v1/conferencistas/mi-perfil
 * @param {Object} datos - ActualizarConferencistaRequest
 */
export async function actualizarMiPerfilConferencista(datos) {
  const { data } = await httpClient.put('/conferencistas/mi-perfil', datos);
  return data;
}

/**
 * Vista pública de los conferencistas de un evento publicado (Criterio 4). No requiere sesión.
 * Endpoint: GET /api/v1/publico/eventos/{eventoId}/conferencistas
 * @param {number|string} eventoId
 */
export async function listarConferencistasPublicos(eventoId) {
  const { data } = await httpClient.get(`/publico/eventos/${eventoId}/conferencistas`);
  return data;
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const conferencistaService = {
  listarConferencistas,
  listarRegistrados,
  listarInvitaciones,
  invitarConferencista,
  reenviarInvitacion,
  cancelarInvitacion,
  consultarInvitacion,
  completarInvitacion,
  asociarConferencista,
  retirarConferencista,
  buscarConferencista,
  obtenerPerfilConferencista,
  actualizarConferencista,
  listarConferencistasPublicos,
  obtenerMiPerfilConferencista,
  actualizarMiPerfilConferencista,
};
