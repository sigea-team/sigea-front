import { httpClient } from './httpClient';

/**
 * @file historialParticipacionService.js
 * @description Cliente de la API del historial de participación de una persona (HU-27, Criterios 1 a 3).
 * Consulta eventos, actividades y roles (participante, ponente, conferencista, autor) con filtros
 * opcionales por semestre, fechas, tipo de evento y tipo de actividad.
 * Base: /api/v1/historial-participacion
 * @module api/historialParticipacionService
 */

/**
 * Limpia y empaqueta los parámetros de filtro de periodo.
 * @param {Object} [filtros={}]
 * @returns {Object}
 */
function prepararFiltros(filtros = {}) {
  const params = {};
  if (filtros.semestre && filtros.semestre.trim()) params.semestre = filtros.semestre.trim();
  if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde;
  if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta;
  if (filtros.tipoEventoId) params.tipoEventoId = filtros.tipoEventoId;
  if (filtros.tipoActividad && filtros.tipoActividad.trim()) params.tipoActividad = filtros.tipoActividad.trim();
  return params;
}

/**
 * Consulta el historial de participación de una persona por su ID.
 * Endpoint: GET /api/v1/historial-participacion/personas/{personaId}
 * @param {number|string} personaId
 * @param {Object} [filtros={}]
 * @returns {Promise<Object>} HistorialParticipacionResponse
 */
export async function consultarPorPersonaId(personaId, filtros = {}) {
  const params = prepararFiltros(filtros);
  const { data } = await httpClient.get(`/historial-participacion/personas/${personaId}`, { params });
  return data;
}

/**
 * Consulta el historial buscando a la persona por número de documento o por correo electrónico.
 * Endpoint: GET /api/v1/historial-participacion/personas
 * @param {{ documento?: string, correo?: string, [key: string]: any }} paramsBusqueda
 * @returns {Promise<Object>} HistorialParticipacionResponse
 */
export async function consultarPorIdentificacion(paramsBusqueda = {}) {
  const params = prepararFiltros(paramsBusqueda);
  if (paramsBusqueda.documento && paramsBusqueda.documento.trim()) {
    params.documento = paramsBusqueda.documento.trim();
  }
  if (paramsBusqueda.correo && paramsBusqueda.correo.trim()) {
    params.correo = paramsBusqueda.correo.trim();
  }
  const { data } = await httpClient.get('/historial-participacion/personas', { params });
  return data;
}

export const historialParticipacionService = {
  consultarPorPersonaId,
  consultarPorIdentificacion,
};
