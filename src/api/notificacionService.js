/**
 * @file notificacionService.js
 * @description Servicio API de las notificaciones del usuario autenticado (campana del Topbar, HU-11).
 * Endpoints: /api/v1/notificaciones (solo devuelven las notificaciones propias del usuario).
 * @module api/notificacionService
 */

import { httpClient } from './httpClient';

/**
 * Lista las notificaciones del usuario, de la más reciente a la más antigua.
 * @param {{ soloNoLeidas?: boolean, limite?: number }} [opciones]
 * @returns {Promise<Array<Object>>}
 */
export async function listarNotificaciones({ soloNoLeidas = false, limite = 20 } = {}) {
  const { data } = await httpClient.get('/notificaciones', { params: { soloNoLeidas, limite } });
  return Array.isArray(data) ? data : [];
}

/**
 * Cantidad de notificaciones sin leer (número de la campana).
 * @returns {Promise<number>}
 */
export async function contarNoLeidas() {
  const { data } = await httpClient.get('/notificaciones/no-leidas/conteo');
  return Number(data?.noLeidas) || 0;
}

/**
 * Marca una notificación como leída.
 * @param {number|string} id
 * @returns {Promise<Object>} Notificación actualizada.
 */
export async function marcarComoLeida(id) {
  const { data } = await httpClient.patch(`/notificaciones/${id}/leida`);
  return data;
}

/**
 * Marca como leídas todas las notificaciones pendientes del usuario.
 * @returns {Promise<number>} Cantidad de notificaciones actualizadas.
 */
export async function marcarTodasComoLeidas() {
  const { data } = await httpClient.patch('/notificaciones/leidas');
  return Number(data?.actualizadas) || 0;
}

export const notificacionService = {
  listarNotificaciones,
  contarNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
};
