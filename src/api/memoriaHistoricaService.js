import { httpClient } from './httpClient';

/**
 * @file memoriaHistoricaService.js
 * @description Cliente de la API de la memoria histórica de los eventos (HU-28: RF55, CU-32). Usa el `httpClient`
 * compartido, que agrega el token JWT.
 * - Cierre formal: /api/v1/eventos/{eventoId}/memoria-historica (revisión previa, cierre y consulta).
 * - Listado: /api/v1/memoria-historica.
 * - Eliminación con autorización especial: /api/v1/eventos/{eventoId}/memoria-historica/eliminacion.
 * @module api/memoriaHistoricaService
 */

const base = (eventoId) => `/eventos/${eventoId}/memoria-historica`;

/**
 * Revisión previa al cierre formal: si ya está en la memoria, si se puede cerrar y los procesos pendientes
 * (CU-32, flujo alterno).
 * Endpoint: GET /api/v1/eventos/{eventoId}/memoria-historica/cierre
 * @param {number} eventoId
 * @returns {Promise<{ eventoId: number, nombre: string, estado: string, fechaFin: string, consolidada: boolean,
 *   fechaConsolidacion: string|null, puedeCerrarse: boolean, motivoNoCerrable: string|null,
 *   pendientes: Array<{ codigo: string, cantidad: number, descripcion: string }> }>}
 */
export async function revisarCierre(eventoId) {
  const { data } = await httpClient.get(`${base(eventoId)}/cierre`);
  return data;
}

/**
 * Cierra formalmente el evento y consolida su memoria histórica (Criterio 1). Desde ese momento la información del
 * evento es solo de consulta.
 * - 409 CIERRE_CON_PENDIENTES con `pendientes` si hay procesos pendientes y no se confirmó.
 * - 409 EVENTO_NO_FINALIZADO o MEMORIA_YA_CONSOLIDADA.
 * Endpoint: POST /api/v1/eventos/{eventoId}/memoria-historica
 * @param {number} eventoId
 * @param {{ confirmarPendientes?: boolean, resumen?: string|null }} solicitud
 * @returns {Promise<Object>} La memoria consolidada.
 */
export async function cerrarFormalmente(eventoId, solicitud) {
  const { data } = await httpClient.post(base(eventoId), solicitud);
  return data;
}

/**
 * Memoria histórica de un evento, solo consulta (Criterio 2). 404 MEMORIA_NO_ENCONTRADA si no se ha cerrado
 * formalmente.
 * Endpoint: GET /api/v1/eventos/{eventoId}/memoria-historica
 * @param {number} eventoId
 * @returns {Promise<Object>} Incluye `contenido` (objeto con la información consolidada) e `indicadores`.
 */
export async function obtenerMemoria(eventoId) {
  const { data } = await httpClient.get(base(eventoId));
  return data;
}

/**
 * Eventos de la memoria histórica, del más reciente al más antiguo, con sus indicadores principales.
 * Endpoint: GET /api/v1/memoria-historica?semestre=&familiaEventoId=&texto=
 * @param {{ semestre?: string, familiaEventoId?: number, texto?: string }} [filtros]
 * @returns {Promise<Array<Object>>}
 */
export async function listarMemorias(filtros = {}) {
  const params = {};
  if (filtros.semestre) params.semestre = filtros.semestre;
  if (filtros.familiaEventoId) params.familiaEventoId = filtros.familiaEventoId;
  if (filtros.texto) params.texto = filtros.texto;
  const { data } = await httpClient.get('/memoria-historica', { params });
  return Array.isArray(data) ? data : [];
}

/**
 * Elimina un evento de la memoria histórica con autorización especial (Criterio 3). Exige el permiso
 * MEMORIA_HISTORICA_ELIMINAR, el nombre exacto del evento y un motivo; queda en la auditoría.
 * - 400 CONFIRMACION_INVALIDA si el nombre no coincide; 409 ELIMINACION_NO_PERMITIDA.
 * Endpoint: POST /api/v1/eventos/{eventoId}/memoria-historica/eliminacion
 * @param {number} eventoId
 * @param {{ nombreEvento: string, motivo: string }} solicitud
 */
export async function eliminarConAutorizacion(eventoId, solicitud) {
  const { data } = await httpClient.post(`${base(eventoId)}/eliminacion`, solicitud);
  return data;
}

export const memoriaHistoricaService = {
  revisarCierre,
  cerrarFormalmente,
  obtenerMemoria,
  listarMemorias,
  eliminarConAutorizacion,
};
