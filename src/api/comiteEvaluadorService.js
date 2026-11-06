import { httpClient } from './httpClient';

/**
 * @file comiteEvaluadorService.js
 * @description Cliente de la API del comité evaluador de una convocatoria (HU-15: RF23).
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Base: /api/v1/convocatorias/{convocatoriaId}/comite-evaluador
 * @module api/comiteEvaluadorService
 */

/**
 * Evaluadores del comité con su área, si tienen cuenta y cuántas propuestas tienen asignadas.
 * Endpoint: GET /api/v1/convocatorias/{convocatoriaId}/comite-evaluador
 * @param {number} convocatoriaId
 * @returns {Promise<Array<Object>>}
 */
export async function listarEvaluadores(convocatoriaId) {
  const { data } = await httpClient.get(`/convocatorias/${convocatoriaId}/comite-evaluador`);
  return Array.isArray(data) ? data : [];
}

/**
 * Registra un evaluador por su correo con su área de experticia (Criterio 3).
 * - 409 EVALUADOR_DUPLICADO: el correo ya está en el comité (Criterio 4).
 * - 400 SOLICITUD_INVALIDA: el correo no está registrado y faltan los datos de la persona.
 * - 409 DATOS_PERSONA_DUPLICADOS: el documento de la persona nueva pertenece a otra persona.
 * Endpoint: POST /api/v1/convocatorias/{convocatoriaId}/comite-evaluador
 * @param {number} convocatoriaId
 * @param {Object} evaluador - { correo, areaExperticia, tipoDocumento?, numeroDocumento?, nombres?, apellidos?, telefono? }
 * @returns {Promise<Object>} Evaluador registrado.
 */
export async function registrarEvaluador(convocatoriaId, evaluador) {
  const { data } = await httpClient.post(`/convocatorias/${convocatoriaId}/comite-evaluador`, evaluador);
  return data;
}

/**
 * Cambia el área de experticia de un evaluador.
 * Endpoint: PUT /api/v1/convocatorias/{convocatoriaId}/comite-evaluador/{comiteEvaluadorId}
 * @param {number} convocatoriaId
 * @param {number} comiteEvaluadorId
 * @param {string} areaExperticia
 * @returns {Promise<Object>} Evaluador actualizado.
 */
export async function actualizarEvaluador(convocatoriaId, comiteEvaluadorId, areaExperticia) {
  const { data } = await httpClient.put(`/convocatorias/${convocatoriaId}/comite-evaluador/${comiteEvaluadorId}`, {
    areaExperticia,
  });
  return data;
}

/**
 * Retira a un evaluador del comité. Si tiene propuestas asignadas responde 409 OPERACION_NO_PERMITIDA.
 * Endpoint: DELETE /api/v1/convocatorias/{convocatoriaId}/comite-evaluador/{comiteEvaluadorId}
 * @param {number} convocatoriaId
 * @param {number} comiteEvaluadorId
 */
export async function retirarEvaluador(convocatoriaId, comiteEvaluadorId) {
  await httpClient.delete(`/convocatorias/${convocatoriaId}/comite-evaluador/${comiteEvaluadorId}`);
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const comiteEvaluadorService = {
  listarEvaluadores,
  registrarEvaluador,
  actualizarEvaluador,
  retirarEvaluador,
};
