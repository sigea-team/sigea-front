/**
 * @file eventoService.js
 * @description Cliente de la API de eventos y ediciones (HU-04: RF03 + RF04).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Base: /api/v1/eventos
 * @module api/eventoService
 */

import { httpClient } from './httpClient';

/**
 * Lista todos los eventos y ediciones, del más reciente al más antiguo.
 * Endpoint: GET /api/v1/eventos
 * @returns {Promise<Array<Object>>}
 */
export async function listarEventos() {
  const { data } = await httpClient.get('/eventos');
  return data;
}

/**
 * Consulta un evento por su ID.
 * Endpoint: GET /api/v1/eventos/{id}
 * @param {number} id
 */
export async function obtenerEvento(id) {
  const { data } = await httpClient.get(`/eventos/${id}`);
  return data;
}

/**
 * Crea un evento nuevo; queda en estado "en_configuracion" (Criterio 1).
 * Endpoint: POST /api/v1/eventos
 * @param {Object} evento - { nombre, objetivo, descripcion, tipo, modalidad, fechaInicio, fechaFin, semestre }
 */
export async function crearEvento(evento) {
  const { data } = await httpClient.post('/eventos', evento);
  return data;
}

/**
 * Actualiza la configuración general de un evento en configuración (Criterio 2).
 * Endpoint: PUT /api/v1/eventos/{id}
 * @param {number} id
 * @param {Object} evento - Mismos campos que al crear (reemplaza la configuración completa).
 */
export async function actualizarEvento(id, evento) {
  const { data } = await httpClient.put(`/eventos/${id}`, evento);
  return data;
}

/**
 * Crea una nueva edición a partir de un evento existente (Criterio 3).
 * Endpoint: POST /api/v1/eventos/{id}/ediciones
 * @param {number} origenId - Evento base o edición que sirve de plantilla.
 * @param {Object} edicion - { nombre, fechaInicio, fechaFin, semestre }
 */
export async function crearEdicion(origenId, edicion) {
  const { data } = await httpClient.post(`/eventos/${origenId}/ediciones`, edicion);
  return data;
}

/**
 * Lista el evento base y sus ediciones en orden cronológico (Criterio 4).
 * Endpoint: GET /api/v1/eventos/{id}/ediciones
 * @param {number} id - ID del evento base o de cualquiera de sus ediciones.
 * @returns {Promise<{eventoBaseId: number, nombreEventoBase: string, totalEdiciones: number, ediciones: Array<Object>}>}
 */
export async function listarEdiciones(id) {
  const { data } = await httpClient.get(`/eventos/${id}/ediciones`);
  return data;
}

/**
 * Publica un evento o edición que se encuentra en configuración (pasa a habilitado).
 * Endpoint: POST /api/v1/eventos/{id}/publicar
 * @param {number} id
 */
export async function publicarEvento(id) {
  const { data } = await httpClient.post(`/eventos/${id}/publicar`);
  return data;
}

/**
 * Elimina un evento o edición. Se llama solo después de que el usuario confirma en la
 * interfaz, por eso siempre envía confirmar=true (Criterio 5).
 * Endpoint: DELETE /api/v1/eventos/{id}?confirmar=true
 * @param {number} id
 */
export async function eliminarEvento(id) {
  const { data } = await httpClient.delete(`/eventos/${id}`, { params: { confirmar: true } });
  return data;
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const eventoService = {
  listarEventos,
  obtenerEvento,
  crearEvento,
  actualizarEvento,
  crearEdicion,
  listarEdiciones,
  publicarEvento,
  eliminarEvento,
};
