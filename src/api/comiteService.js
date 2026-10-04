/**
 * @file comiteService.js
 * @description Cliente de la API del comité organizador de un evento (HU-06: RF05).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Base: /api/v1/eventos/{eventoId}/comite
 * @module api/comiteService
 */

import { httpClient } from './httpClient';

/**
 * Lista el comité organizador de un evento.
 * Endpoint: GET /api/v1/eventos/{eventoId}/comite?incluirHistorial=
 * @param {number} eventoId
 * @param {boolean} [incluirHistorial=false] - true: también devuelve los miembros retirados (Criterio 3).
 * @returns {Promise<Array<Object>>}
 */
export async function listarComite(eventoId, incluirHistorial = false) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/comite`, { params: { incluirHistorial } });
  return data;
}

/**
 * Agrega una persona al comité con su rol (Criterio 1).
 * Si ya es miembro vigente, el backend responde 409 MIEMBRO_COMITE_DUPLICADO (Criterio 2).
 * Endpoint: POST /api/v1/eventos/{eventoId}/comite
 * @param {number} eventoId
 * @param {{ numeroDocumento?: string, personaId?: number, rolComite: string }} miembro
 */
export async function agregarMiembro(eventoId, miembro) {
  const { data } = await httpClient.post(`/eventos/${eventoId}/comite`, miembro);
  return data;
}

/**
 * Retira a un miembro de la lista vigente; el registro se conserva en el historial (Criterio 3).
 * Endpoint: DELETE /api/v1/eventos/{eventoId}/comite/{miembroId}
 * @param {number} eventoId
 * @param {number} miembroId - ID de la participación (no de la persona).
 */
export async function retirarMiembro(eventoId, miembroId) {
  const { data } = await httpClient.delete(`/eventos/${eventoId}/comite/${miembroId}`);
  return data;
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const comiteService = {
  listarComite,
  agregarMiembro,
  retirarMiembro,
};
