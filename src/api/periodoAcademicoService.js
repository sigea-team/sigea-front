import { httpClient } from './httpClient';

/**
 * @file periodoAcademicoService.js
 * @description Cliente de la API para consultas por periodo académico e indicadores (HU-27, Criterios 3, 4 y 5).
 * Base: /api/v1/periodos-academicos
 * @module api/periodoAcademicoService
 */

/**
 * Limpia y prepara los parámetros del filtro.
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
 * Lista los semestres académicos que tienen eventos registrados, del más reciente al más antiguo.
 * Endpoint: GET /api/v1/periodos-academicos/semestres
 * @returns {Promise<Array<string>>}
 */
export async function listarSemestres() {
  const { data } = await httpClient.get('/periodos-academicos/semestres');
  return Array.isArray(data) ? data : [];
}

/**
 * Consulta eventos y actividades por periodo académico y filtros (Criterio 3 y 4).
 * Endpoint: GET /api/v1/periodos-academicos/eventos
 * @param {Object} [filtros={}]
 * @returns {Promise<Object>} ConsultaPeriodoResponse
 */
export async function consultarEventos(filtros = {}) {
  const params = prepararFiltros(filtros);
  const { data } = await httpClient.get('/periodos-academicos/eventos', { params });
  return data;
}

/**
 * Calcula los indicadores del programa para el periodo y filtros dados (Criterio 3 y 4).
 * Endpoint: GET /api/v1/periodos-academicos/indicadores
 * @param {Object} [filtros={}]
 * @returns {Promise<Object>} IndicadoresPeriodoResponse
 */
export async function calcularIndicadores(filtros = {}) {
  const params = prepararFiltros(filtros);
  const { data } = await httpClient.get('/periodos-academicos/indicadores', { params });
  return data;
}

/**
 * Compara los indicadores de dos semestres de forma comparativa con diferencias, variación % y tendencias (Criterio 5).
 * Endpoint: GET /api/v1/periodos-academicos/comparacion
 * @param {string} semestreA - Semestre base (ej. '2025-2')
 * @param {string} semestreB - Semestre a comparar (ej. '2026-1')
 * @param {Object} [filtrosExtras={}] - tipoEventoId, tipoActividad
 * @returns {Promise<Object>} ComparacionSemestresResponse
 */
export async function compararSemestres(semestreA, semestreB, filtrosExtras = {}) {
  const params = {
    semestreA: semestreA?.trim(),
    semestreB: semestreB?.trim(),
  };
  if (filtrosExtras.tipoEventoId) params.tipoEventoId = filtrosExtras.tipoEventoId;
  if (filtrosExtras.tipoActividad && filtrosExtras.tipoActividad.trim()) {
    params.tipoActividad = filtrosExtras.tipoActividad.trim();
  }
  const { data } = await httpClient.get('/periodos-academicos/comparacion', { params });
  return data;
}

export const periodoAcademicoService = {
  listarSemestres,
  consultarEventos,
  calcularIndicadores,
  compararSemestres,
};
