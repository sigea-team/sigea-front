import { httpClient } from './httpClient';

/**
 * @file rubricaService.js
 * @description Cliente de la API de la rúbrica de evaluación de una convocatoria (HU-15: RF22).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Base: /api/v1/convocatorias/{convocatoriaId}/rubrica
 * @module api/rubricaService
 */

/**
 * Rúbrica activa de la convocatoria con sus criterios, pesos y escalas.
 * Devuelve null si la convocatoria todavía no tiene rúbrica (el backend responde 404).
 * Endpoint: GET /api/v1/convocatorias/{convocatoriaId}/rubrica
 * @param {number} convocatoriaId
 * @returns {Promise<Object|null>}
 */
export async function obtenerRubrica(convocatoriaId) {
  try {
    const { data } = await httpClient.get(`/convocatorias/${convocatoriaId}/rubrica`);
    return data;
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

/**
 * Impacto que tendría modificar la rúbrica activa (Criterio 4).
 * Endpoint: GET /api/v1/convocatorias/{convocatoriaId}/rubrica/impacto
 * @param {number} convocatoriaId
 * @returns {Promise<{ rubricaId: number|null, calificacionesRegistradas: number, asignacionesAfectadas: number,
 *   propuestasAfectadas: number, requiereConfirmacion: boolean }>}
 */
export async function obtenerImpacto(convocatoriaId) {
  const { data } = await httpClient.get(`/convocatorias/${convocatoriaId}/rubrica/impacto`);
  return data;
}

/**
 * Crea o reemplaza la rúbrica de la convocatoria (Criterios 1, 2 y 4).
 * - 400 RUBRICA_INVALIDA: los pesos no suman 100 %, hay criterios repetidos o una escala inválida.
 * - 409 RUBRICA_EN_USO: la rúbrica ya tiene calificaciones; se reintenta con confirmar = true.
 * Endpoint: PUT /api/v1/convocatorias/{convocatoriaId}/rubrica?confirmar=
 * @param {number} convocatoriaId
 * @param {{ nombre: string, criterios: Array<{ nombre: string, pesoPorcentual: number,
 *   escalaMinima: number, escalaMaxima: number }> }} rubrica
 * @param {boolean} [confirmar=false]
 * @returns {Promise<Object>} Rúbrica guardada (incluye asignacionesReabiertas).
 */
export async function configurarRubrica(convocatoriaId, rubrica, confirmar = false) {
  const { data } = await httpClient.put(`/convocatorias/${convocatoriaId}/rubrica`, rubrica, {
    params: { confirmar },
  });
  return data;
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const rubricaService = {
  obtenerRubrica,
  obtenerImpacto,
  configurarRubrica,
};
