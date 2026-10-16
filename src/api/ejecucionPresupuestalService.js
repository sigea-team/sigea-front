/**
 * @file ejecucionPresupuestalService.js
 * @description Cliente de la API de gastos ejecutados y ejecución presupuestal de un evento
 * (HU-09: RF11 + RF12). Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Conecta con el backend Spring Boot: EjecucionPresupuestalController
 * (/api/v1/eventos/{eventoId}/ejecucion-presupuestal).
 * @module api/ejecucionPresupuestalService
 */

import { httpClient } from './httpClient';

/**
 * Indicador de ejecución del evento y de cada rubro vigente. Sin gastos devuelve 0 % (Criterio 4).
 * Endpoint: GET /api/v1/eventos/{eventoId}/ejecucion-presupuestal
 * @param {number} eventoId
 * @returns {Promise<{
 *   eventoId: number,
 *   eventoNombre: string,
 *   tienePresupuestoAprobado: boolean,
 *   valorTotalAprobado: number,
 *   totalPresupuestadoRubros: number,
 *   totalEjecutado: number,
 *   saldoDisponible: number,
 *   porcentajeEjecucion: number,
 *   cantidadGastos: number,
 *   rubros: Array<{rubroId: number, nombre: string, presupuestado: number, ejecutado: number,
 *     disponible: number, porcentajeEjecucion: number, excedido: boolean, cantidadGastos: number}>
 * }>}
 */
export async function consultarEjecucion(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/ejecucion-presupuestal`);
  return data;
}

/**
 * Registra un gasto contra un rubro y devuelve el acumulado del rubro y el % del evento recalculados
 * (Criterio 1). Un gasto que supera el disponible del rubro se registra igual y la respuesta lo advierte (Criterio 2).
 * Sin valor o con valor negativo → 400 con erroresValidacion (Criterio 3).
 * Endpoint: POST /api/v1/eventos/{eventoId}/ejecucion-presupuestal/gastos
 * @param {number} eventoId
 * @param {{ rubroId: number, valor: number, fechaGasto: string, soporteUrl?: string, descripcion?: string }} gasto
 * @returns {Promise<{gasto: Object, rubro: Object, valorTotalAprobado: number, totalEjecutado: number,
 *   porcentajeEjecucion: number, excedioDisponible: boolean, advertencia: string|null}>}
 */
export async function registrarGasto(eventoId, gasto) {
  const { data } = await httpClient.post(`/eventos/${eventoId}/ejecucion-presupuestal/gastos`, gasto);
  return data;
}

/**
 * Gastos del evento (o de un rubro), del más reciente al más antiguo.
 * Endpoint: GET /api/v1/eventos/{eventoId}/ejecucion-presupuestal/gastos?rubroId=
 * @param {number} eventoId
 * @param {number} [rubroId] - Filtra por rubro.
 * @returns {Promise<Array<Object>>}
 */
export async function listarGastos(eventoId, rubroId) {
  const params = rubroId ? { rubroId } : undefined;
  const { data } = await httpClient.get(`/eventos/${eventoId}/ejecucion-presupuestal/gastos`, { params });
  return Array.isArray(data) ? data : [];
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const ejecucionPresupuestalService = {
  consultarEjecucion,
  registrarGasto,
  listarGastos,
};
