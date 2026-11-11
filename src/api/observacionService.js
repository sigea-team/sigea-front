import { httpClient } from './httpClient';

/**
 * @file observacionService.js
 * @description Cliente de la API de observaciones y ajustes requeridos a las propuestas y de la aprobación de su
 * versión definitiva (HU-19: RF28, RF29). Usa el `httpClient` compartido, que agrega el token JWT.
 * Base: /api/v1/propuestas/{id}/observaciones y /api/v1/propuestas/{id}/version-definitiva
 * @module api/observacionService
 */

/**
 * Observaciones de todas las versiones de la propuesta, con los ajustes pendientes y si su versión actual se
 * puede aprobar como definitiva. La consultan el administrador, los evaluadores asignados y los autores.
 * Endpoint: GET /api/v1/propuestas/{propuestaId}/observaciones
 * @param {number} propuestaId
 * @returns {Promise<{ propuestaId: number, titulo: string, estadoPropuesta: string, versionActual: number,
 *   versionDefinitiva: number|null, fechaDefinitiva: string|null, ajustesPendientes: number,
 *   ajustesPorAtender: number, puedeAprobarse: boolean, motivoNoAprobable: string|null,
 *   observaciones: Array<Object> }>}
 */
export async function listarObservaciones(propuestaId) {
  const { data } = await httpClient.get(`/propuestas/${propuestaId}/observaciones`);
  return data;
}

/**
 * Registra observaciones y ajustes requeridos sobre la versión actual y notifica a los autores (Criterio 1).
 * - 400: sin observaciones o con descripción vacía.
 * - 403: no es evaluador asignado ni administrador.
 * - 409 PROPUESTA_NO_EVALUADA / OPERACION_NO_PERMITIDA / PROPUESTA_BLOQUEADA.
 * Endpoint: POST /api/v1/propuestas/{propuestaId}/observaciones
 * @param {number} propuestaId
 * @param {Array<{ descripcion: string, requiereAjuste: boolean }>} observaciones
 * @returns {Promise<Object>} Situación de las observaciones (igual que {@link listarObservaciones}).
 */
export async function registrarObservaciones(propuestaId, observaciones) {
  const { data } = await httpClient.post(`/propuestas/${propuestaId}/observaciones`, {
    observaciones: observaciones.map((o) => ({
      descripcion: (o.descripcion || '').trim(),
      requiereAjuste: o.requiereAjuste !== false,
    })),
  });
  return data;
}

/**
 * Da por resuelta una observación. Un ajuste solo se resuelve si el autor ya subió una versión que lo atiende
 * (Criterio 2).
 * Endpoint: PATCH /api/v1/propuestas/{propuestaId}/observaciones/{observacionId}/resolver
 * @param {number} propuestaId
 * @param {number} observacionId
 * @returns {Promise<Object>} La observación resuelta.
 */
export async function resolverObservacion(propuestaId, observacionId) {
  const { data } = await httpClient.patch(`/propuestas/${propuestaId}/observaciones/${observacionId}/resolver`);
  return data;
}

/**
 * Aprueba la versión actual como definitiva (Criterio 3). Si quedan ajustes sin resolver responde 409
 * OBSERVACIONES_PENDIENTES (o AJUSTES_SIN_REGISTRAR) con la lista `pendientes` (Criterio 4).
 * Endpoint: POST /api/v1/propuestas/{propuestaId}/version-definitiva
 * @param {number} propuestaId
 * @returns {Promise<{ propuestaId: number, numeroVersion: number, versionDefinitivaAnterior: number|null,
 *   fechaDefinitiva: string, aprobadaPor: string, ajustesResueltos: number, mensaje: string }>}
 */
export async function aprobarVersionDefinitiva(propuestaId) {
  const { data } = await httpClient.post(`/propuestas/${propuestaId}/version-definitiva`);
  return data;
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const observacionService = {
  listarObservaciones,
  registrarObservaciones,
  resolverObservacion,
  aprobarVersionDefinitiva,
};
