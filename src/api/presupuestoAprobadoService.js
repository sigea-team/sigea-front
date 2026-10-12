/**
 * @file presupuestoAprobadoService.js
 * @description Cliente de la API para el registro, actualización y consulta del presupuesto aprobado
 * formalmente para un evento (HU-08: RF07).
 * Conecta con el backend Spring Boot: PresupuestoAprobadoController (/api/v1/eventos/{eventoId}/presupuesto-aprobado).
 * @module api/presupuestoAprobadoService
 */

import { httpClient } from './httpClient';

/**
 * Consulta el resumen presupuestal comparativo del evento:
 * preliminar proyectado, versión oficial vigente (si existe) e historial de versiones.
 * Endpoint: GET /api/v1/eventos/{eventoId}/presupuesto-aprobado/resumen
 *
 * @param {number} eventoId
 * @returns {Promise<{
 *   eventoId: number,
 *   eventoNombre: string,
 *   tienePreliminar: boolean,
 *   totalPreliminar: number,
 *   cantidadRubrosPreliminares: number,
 *   aprobadoVigente: Object|null,
 *   versiones: Array<Object>,
 *   editable: boolean
 * }>}
 */
export async function consultarPresupuestoAprobado(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/presupuesto-aprobado/resumen`);
  const totalPreliminar = Number(data.totalPreliminarProyectado || 0);
  const cantidadRubros = Number(data.cantidadRubrosPreliminares || 0);

  return {
    eventoId: data.eventoId,
    eventoNombre: data.eventoNombre,
    tienePreliminar: Boolean(totalPreliminar > 0 || cantidadRubros > 0),
    totalPreliminar,
    cantidadRubrosPreliminares: cantidadRubros,
    aprobadoVigente: data.presupuestoOficial || null,
    versiones: Array.isArray(data.historialVersiones) ? data.historialVersiones : [],
    editable: true,
  };
}

/**
 * Registra o actualiza el presupuesto aprobado formalmente para un evento (Criterios 1, 2 y 3).
 * El backend maneja el guardado inicial (Criterio 1) y en caso de actualización pasa la
 * versión previa a histórica y guarda la nueva como versión oficial (Criterio 2).
 * Exige evidencia documental obligatoria (Criterio 3).
 * Endpoint: POST /api/v1/eventos/{eventoId}/presupuesto-aprobado
 *
 * @param {number} eventoId
 * @param {Object} payload
 * @param {number} payload.valorTotalAprobado - Monto oficial aprobado
 * @param {string} payload.evidenciaUrl - Enlace o nombre de la evidencia documental (máx. 255)
 * @param {number} [payload.aprobadoPorId] - Opcional; si es nulo el backend lo infiere del token JWT
 * @returns {Promise<Object>} Registro del presupuesto aprobado guardado como versión oficial
 */
export async function registrarPresupuestoAprobado(eventoId, payload) {
  const requestBody = {
    valorTotalAprobado: Number(payload.valorTotalAprobado),
    evidenciaUrl: (payload.evidenciaUrl || payload.evidenciaNombre || '').trim(),
    aprobadoPorId: payload.aprobadoPorId || null,
  };

  const { data } = await httpClient.post(`/eventos/${eventoId}/presupuesto-aprobado`, requestBody);
  return data;
}

/**
 * Actualiza el presupuesto aprobado conservando la versión previa en el historial (Criterio 2).
 * En el backend, registrarOActualizar gestiona la actualización mediante POST.
 * Endpoint: POST /api/v1/eventos/{eventoId}/presupuesto-aprobado
 *
 * @param {number} eventoId
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function actualizarPresupuestoAprobado(eventoId, payload) {
  return registrarPresupuestoAprobado(eventoId, payload);
}

/**
 * Obtiene el historial completo de versiones de presupuestos aprobados del evento (Criterio 2).
 * Endpoint: GET /api/v1/eventos/{eventoId}/presupuesto-aprobado/historial
 *
 * @param {number} eventoId
 * @returns {Promise<Array<Object>>}
 */
export async function consultarHistorialPresupuestoAprobado(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/presupuesto-aprobado/historial`);
  return Array.isArray(data) ? data : [];
}

/** Cliente de la API para inyección o pruebas */
export const presupuestoAprobadoService = {
  consultarPresupuestoAprobado,
  registrarPresupuestoAprobado,
  actualizarPresupuestoAprobado,
  consultarHistorialPresupuestoAprobado,
};
