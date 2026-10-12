/**
 * @file presupuestoAprobadoService.js
 * @description Cliente de la API para el registro y actualización del presupuesto aprobado
 * formalmente para un evento (HU-08: RF07).
 * Usa el httpClient compartido con token JWT.
 * Base: /api/v1/eventos/{eventoId}/presupuesto-aprobado
 * @module api/presupuestoAprobadoService
 */

import { httpClient } from './httpClient';

/**
 * Consulta la versión oficial vigente del presupuesto aprobado de un evento y su resumen preliminar.
 * Endpoint: GET /api/v1/eventos/{eventoId}/presupuesto-aprobado
 *
 * @param {number} eventoId
 * @returns {Promise<{
 *   tienePreliminar: boolean,
 *   totalPreliminar: number,
 *   aprobadoVigente: Object|null,
 *   versiones: Array<Object>,
 *   editable: boolean
 * }>}
 */
export async function consultarPresupuestoAprobado(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/presupuesto-aprobado`);
  return data;
}

/**
 * Registra formalmente por primera vez el presupuesto aprobado del evento (Criterio 1).
 * Exige evidencia de aprobación (Criterio 3).
 * Endpoint: POST /api/v1/eventos/{eventoId}/presupuesto-aprobado
 *
 * @param {number} eventoId
 * @param {FormData|Object} payload
 * @returns {Promise<Object>} Registro del presupuesto aprobado guardado como versión oficial
 */
export async function registrarPresupuestoAprobado(eventoId, payload) {
  const esFormData = payload instanceof FormData;
  const config = esFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
  const { data } = await httpClient.post(`/eventos/${eventoId}/presupuesto-aprobado`, payload, config);
  return data;
}

/**
 * Registra una actualización del presupuesto aprobado, conservando la versión anterior
 * en el historial de cambios (Criterio 2).
 * Endpoint: PUT /api/v1/eventos/{eventoId}/presupuesto-aprobado
 *
 * @param {number} eventoId
 * @param {FormData|Object} payload
 * @returns {Promise<Object>} Nueva versión oficial registrada con su historial actualizado
 */
export async function actualizarPresupuestoAprobado(eventoId, payload) {
  const esFormData = payload instanceof FormData;
  const config = esFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined;
  const { data } = await httpClient.put(`/eventos/${eventoId}/presupuesto-aprobado`, payload, config);
  return data;
}

/**
 * Obtiene el historial cronológico de todas las versiones del presupuesto aprobado del evento (Criterio 2).
 * Endpoint: GET /api/v1/eventos/{eventoId}/presupuesto-aprobado/historial
 *
 * @param {number} eventoId
 * @returns {Promise<Array<Object>>}
 */
export async function consultarHistorialPresupuestoAprobado(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/presupuesto-aprobado/historial`);
  return data;
}

/** Cliente agrupado para inyección de dependencias o Storybook */
export const presupuestoAprobadoService = {
  consultarPresupuestoAprobado,
  registrarPresupuestoAprobado,
  actualizarPresupuestoAprobado,
  consultarHistorialPresupuestoAprobado,
};
