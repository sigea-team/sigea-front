import { httpClient } from './httpClient';

/**
 * @file asignacionService.js
 * @description Cliente de la API de asignación de propuestas a evaluadores (HU-16: RF24).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Base: /api/v1/asignaciones
 * @module api/asignacionService
 */

/**
 * Propuestas de una convocatoria con el resumen de sus asignaciones (Criterio 1).
 * Endpoint: GET /api/v1/asignaciones/convocatorias/{convocatoriaId}/propuestas
 * @param {number} convocatoriaId
 * @returns {Promise<Array<Object>>}
 */
export async function listarPropuestasConvocatoria(convocatoriaId) {
  const { data } = await httpClient.get(`/asignaciones/convocatorias/${convocatoriaId}/propuestas`);
  return Array.isArray(data) ? data : [];
}

/**
 * Evaluadores que tienen asignada actualmente la propuesta.
 * Endpoint: GET /api/v1/asignaciones/propuestas/{propuestaId}
 * @param {number} propuestaId
 * @returns {Promise<Array<Object>>}
 */
export async function listarAsignaciones(propuestaId) {
  const { data } = await httpClient.get(`/asignaciones/propuestas/${propuestaId}`);
  return Array.isArray(data) ? data : [];
}

/**
 * Evaluadores del comité de la convocatoria con su carga, si ya tienen la propuesta y su nivel de
 * conflicto de interés: NINGUNO, ADVERTENCIA o BLOQUEANTE (Criterio 2).
 * Endpoint: GET /api/v1/asignaciones/propuestas/{propuestaId}/evaluadores-disponibles
 * @param {number} propuestaId
 * @returns {Promise<Array<Object>>}
 */
export async function listarEvaluadoresDisponibles(propuestaId) {
  const { data } = await httpClient.get(`/asignaciones/propuestas/${propuestaId}/evaluadores-disponibles`);
  return Array.isArray(data) ? data : [];
}

/**
 * Historial de asignaciones y reasignaciones de la propuesta (Criterio 3).
 * Endpoint: GET /api/v1/asignaciones/propuestas/{propuestaId}/historial
 * @param {number} propuestaId
 * @returns {Promise<Array<Object>>}
 */
export async function listarHistorial(propuestaId) {
  const { data } = await httpClient.get(`/asignaciones/propuestas/${propuestaId}/historial`);
  return Array.isArray(data) ? data : [];
}

/**
 * Asigna la propuesta a uno o más evaluadores (Criterio 1).
 * - 409 CONFLICTO_INTERES: algún evaluador es autor de la propuesta (Criterio 2, se impide).
 * - 409 CONFIRMACION_REQUERIDA: posible conflicto; se reintenta con confirmarConflicto = true (Criterio 2).
 * - 409 ASIGNACION_DUPLICADA: la propuesta ya estaba asignada a ese evaluador.
 * Endpoint: POST /api/v1/asignaciones/propuestas/{propuestaId}
 * @param {number} propuestaId
 * @param {Array<number>} comiteEvaluadorIds
 * @param {boolean} [confirmarConflicto=false]
 * @returns {Promise<Array<Object>>} Asignaciones creadas.
 */
export async function asignarEvaluadores(propuestaId, comiteEvaluadorIds, confirmarConflicto = false) {
  const { data } = await httpClient.post(`/asignaciones/propuestas/${propuestaId}`, {
    comiteEvaluadorIds,
    confirmarConflicto,
  });
  return data;
}

/**
 * Reasigna una asignación a otro evaluador; el cambio queda en el historial (Criterio 3).
 * Endpoint: PUT /api/v1/asignaciones/{asignacionId}/reasignar
 * @param {number} asignacionId
 * @param {{ comiteEvaluadorId: number, motivo?: string, confirmarConflicto?: boolean }} datos
 * @returns {Promise<Object>} Asignación actualizada.
 */
export async function reasignar(asignacionId, { comiteEvaluadorId, motivo, confirmarConflicto = false }) {
  const { data } = await httpClient.put(`/asignaciones/${asignacionId}/reasignar`, {
    comiteEvaluadorId,
    motivo: motivo?.trim() || null,
    confirmarConflicto,
  });
  return data;
}

/**
 * Bandeja del evaluador autenticado (Criterio 1). Por defecto solo pendientes y en proceso.
 * Endpoint: GET /api/v1/asignaciones/mis-asignaciones?incluirCompletadas=
 * @param {boolean} [incluirCompletadas=false]
 * @returns {Promise<Array<Object>>}
 */
export async function miBandeja(incluirCompletadas = false) {
  const { data } = await httpClient.get('/asignaciones/mis-asignaciones', { params: { incluirCompletadas } });
  return Array.isArray(data) ? data : [];
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const asignacionService = {
  listarPropuestasConvocatoria,
  listarAsignaciones,
  listarEvaluadoresDisponibles,
  listarHistorial,
  asignarEvaluadores,
  reasignar,
  miBandeja,
};
