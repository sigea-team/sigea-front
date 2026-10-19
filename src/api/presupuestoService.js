/**
 * @file presupuestoService.js
 * @description Cliente de la API del presupuesto preliminar de un evento (HU-07: RF06).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Base: /api/v1/eventos/{eventoId}/presupuesto
 * @module api/presupuestoService
 */

import { httpClient } from './httpClient';

/**
 * Presupuesto preliminar del evento: rubros con su subtotal y el total (Criterio 1).
 * Endpoint: GET /api/v1/eventos/{eventoId}/presupuesto?incluirEliminados=
 * @param {number} eventoId
 * @param {boolean} [incluirEliminados=false] - true: también lista los rubros eliminados (no suman al total).
 * @returns {Promise<{eventoId: number, eventoNombre: string, estadoEvento: string, rubros: Array<Object>,
 *   cantidadRubros: number, total: number, presupuestoAprobado: boolean, editable: boolean}>}
 */
export async function consultarPresupuesto(eventoId, incluirEliminados = false) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/presupuesto`, { params: { incluirEliminados } });
  return data;
}

/**
 * Agrega un rubro y devuelve el total actualizado (Criterio 1).
 * Nombre vacío, valor vacío o negativo → 400 con erroresValidacion (Criterio 3).
 * Nombre repetido → 409 RUBRO_DUPLICADO.
 * Endpoint: POST /api/v1/eventos/{eventoId}/presupuesto/rubros
 * @param {number} eventoId
 * @param {{ nombre: string, cantidad?: number, valorUnitarioProyectado: number, motivo?: string }} rubro
 * @returns {Promise<{rubro: Object, totalPresupuesto: number, cantidadRubros: number}>}
 */
export async function agregarRubro(eventoId, rubro) {
  const { data } = await httpClient.post(`/eventos/${eventoId}/presupuesto/rubros`, rubro);
  return data;
}

/**
 * Edita un rubro vigente; el backend recalcula el total y guarda el cambio en el historial (Criterio 2).
 * Endpoint: PUT /api/v1/eventos/{eventoId}/presupuesto/rubros/{rubroId}
 * @param {number} eventoId
 * @param {number} rubroId
 * @param {{ nombre: string, cantidad?: number, valorUnitarioProyectado: number, motivo?: string }} rubro
 * @returns {Promise<{rubro: Object, totalPresupuesto: number, cantidadRubros: number}>}
 */
export async function actualizarRubro(eventoId, rubroId, rubro) {
  const { data } = await httpClient.put(`/eventos/${eventoId}/presupuesto/rubros/${rubroId}`, rubro);
  return data;
}

/**
 * Elimina un rubro del presupuesto vigente (borrado lógico) y devuelve el total actualizado (Criterio 2).
 * Endpoint: DELETE /api/v1/eventos/{eventoId}/presupuesto/rubros/{rubroId}?motivo=
 * @param {number} eventoId
 * @param {number} rubroId
 * @param {string} [motivo] - Justificación opcional (máx. 255).
 * @returns {Promise<{rubro: Object, totalPresupuesto: number, cantidadRubros: number}>}
 */
export async function eliminarRubro(eventoId, rubroId, motivo) {
  const params = motivo ? { motivo } : undefined;
  const { data } = await httpClient.delete(`/eventos/${eventoId}/presupuesto/rubros/${rubroId}`, { params });
  return data;
}

/**
 * Historial de creaciones, ediciones y eliminaciones de rubros del evento, del más reciente al más antiguo.
 * Endpoint: GET /api/v1/eventos/{eventoId}/presupuesto/historial
 * @param {number} eventoId
 * @returns {Promise<Array<Object>>}
 */
export async function historialPresupuesto(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/presupuesto/historial`);
  return data;
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const presupuestoService = {
  consultarPresupuesto,
  agregarRubro,
  actualizarRubro,
  eliminarRubro,
  historialPresupuesto,
};
