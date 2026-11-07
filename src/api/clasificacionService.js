import { httpClient } from './httpClient';

/**
 * @file clasificacionService.js
 * @description Cliente de la API de clasificación de propuestas según su resultado (HU-18: RF27).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Base: /api/v1/clasificaciones
 * @module api/clasificacionService
 */

/**
 * Propuestas de la convocatoria agrupadas por resultado, con los umbrales vigentes y los totales por grupo.
 * Endpoint: GET /api/v1/clasificaciones/convocatorias/{convocatoriaId}
 * @param {number} convocatoriaId
 * @returns {Promise<{ convocatoriaId: number, umbralAceptacion: number, umbralAjustes: number,
 *   totales: Record<string, number>, propuestas: Array<Object> }>}
 */
export async function listarPorConvocatoria(convocatoriaId) {
  const { data } = await httpClient.get(`/clasificaciones/convocatorias/${convocatoriaId}`);
  return data;
}

/**
 * Define los umbrales de clasificación de la convocatoria (Criterio 1).
 * - 400 VALIDACION_FALLIDA / SOLICITUD_INVALIDA: fuera de 0 - 10 o el de ajustes mayor que el de aprobación.
 * Endpoint: PUT /api/v1/clasificaciones/convocatorias/{convocatoriaId}/umbrales
 * @param {number} convocatoriaId
 * @param {{ umbralAceptacion: number, umbralAjustes: number }} umbrales
 * @returns {Promise<{ convocatoriaId: number, umbralAceptacion: number, umbralAjustes: number,
 *   propuestasPorReaplicar: number }>}
 */
export async function configurarUmbrales(convocatoriaId, { umbralAceptacion, umbralAjustes }) {
  const { data } = await httpClient.put(`/clasificaciones/convocatorias/${convocatoriaId}/umbrales`, {
    umbralAceptacion,
    umbralAjustes,
  });
  return data;
}

/**
 * Clasifica todas las propuestas evaluadas de la convocatoria (Criterios 1 y 3). Las que no tienen la
 * evaluación completa vuelven en `omitidas` con el motivo.
 * Endpoint: POST /api/v1/clasificaciones/convocatorias/{convocatoriaId}/aplicar
 * @param {number} convocatoriaId
 * @returns {Promise<{ convocatoriaId: number, clasificadas: Array<Object>,
 *   omitidas: Array<{ propuestaId: number, titulo: string, motivo: string }> }>}
 */
export async function aplicarConvocatoria(convocatoriaId) {
  const { data } = await httpClient.post(`/clasificaciones/convocatorias/${convocatoriaId}/aplicar`);
  return data;
}

/**
 * Clasifica una propuesta según los umbrales (Criterios 1 y 3).
 * - 409 PROPUESTA_NO_EVALUADA: la evaluación no está completa.
 * Endpoint: POST /api/v1/clasificaciones/propuestas/{propuestaId}/aplicar
 * @param {number} propuestaId
 * @returns {Promise<Object>} Situación de clasificación de la propuesta.
 */
export async function aplicarPropuesta(propuestaId) {
  const { data } = await httpClient.post(`/clasificaciones/propuestas/${propuestaId}/aplicar`);
  return data;
}

/**
 * Ajusta manualmente la clasificación con un motivo, que queda en el historial (Criterio 2).
 * - 400 VALIDACION_FALLIDA / SOLICITUD_INVALIDA: sin motivo o la propuesta ya tiene esa clasificación.
 * - 409 PROPUESTA_NO_EVALUADA: la evaluación no está completa (Criterio 3).
 * Endpoint: PUT /api/v1/clasificaciones/propuestas/{propuestaId}
 * @param {number} propuestaId
 * @param {{ clasificacion: 'aprobada'|'aprobada_con_ajustes'|'rechazada', motivo: string }} ajuste
 * @returns {Promise<Object>} Situación de clasificación de la propuesta.
 */
export async function ajustarClasificacion(propuestaId, { clasificacion, motivo }) {
  const { data } = await httpClient.put(`/clasificaciones/propuestas/${propuestaId}`, {
    clasificacion,
    motivo: motivo?.trim() ?? '',
  });
  return data;
}

/**
 * Historial de clasificaciones de la propuesta, del más reciente al más antiguo (Criterio 2).
 * Endpoint: GET /api/v1/clasificaciones/propuestas/{propuestaId}/historial
 * @param {number} propuestaId
 * @returns {Promise<Array<Object>>}
 */
export async function listarHistorial(propuestaId) {
  const { data } = await httpClient.get(`/clasificaciones/propuestas/${propuestaId}/historial`);
  return Array.isArray(data) ? data : [];
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const clasificacionService = {
  listarPorConvocatoria,
  configurarUmbrales,
  aplicarConvocatoria,
  aplicarPropuesta,
  ajustarClasificacion,
  listarHistorial,
};
