import { httpClient } from './httpClient';
import { actividadService } from './actividadService';

/**
 * @file encuestaService.js
 * @description Cliente de la API de encuestas de satisfacción (HU-25: RF46, CU-22). Usa el `httpClient` compartido,
 * que agrega el token JWT.
 * - Organizador: /api/v1/eventos/{eventoId}/encuestas (configurar, publicar, cerrar y consultar resultados).
 * - Participante: /api/v1/encuestas (encuestas habilitadas para quien asistió y envío de respuestas).
 * @module api/encuestaService
 */

const base = (eventoId) => `/eventos/${eventoId}/encuestas`;

// ── Organizador ──

/**
 * Encuestas del evento con sus preguntas, habilitados (asistentes) y respuestas recibidas.
 * Endpoint: GET /api/v1/eventos/{eventoId}/encuestas
 * @param {number} eventoId
 * @returns {Promise<Array<Object>>}
 */
export async function listarEncuestas(eventoId) {
  const { data } = await httpClient.get(base(eventoId));
  return Array.isArray(data) ? data : [];
}

/**
 * Crea la encuesta en borrador (Criterio 1). Sin `actividadId` es la encuesta general del evento.
 * - 400 VALIDACION_FALLIDA / ENCUESTA_CONFIGURACION_INVALIDA con `erroresValidacion` por campo
 *   (por ejemplo, `preguntas[1].opciones`).
 * Endpoint: POST /api/v1/eventos/{eventoId}/encuestas
 * @param {number} eventoId
 * @param {Object} solicitud - Ver `aEncuestaRequest` en encuestaUtils.
 * @returns {Promise<Object>} La encuesta creada.
 */
export async function crearEncuesta(eventoId, solicitud) {
  const { data } = await httpClient.post(base(eventoId), solicitud);
  return data;
}

/**
 * Reemplaza la configuración y todas las preguntas de una encuesta en borrador.
 * - 409 ENCUESTA_NO_EDITABLE si ya fue publicada o cerrada.
 * Endpoint: PUT /api/v1/eventos/{eventoId}/encuestas/{encuestaId}
 */
export async function actualizarEncuesta(eventoId, encuestaId, solicitud) {
  const { data } = await httpClient.put(`${base(eventoId)}/${encuestaId}`, solicitud);
  return data;
}

/**
 * Elimina una encuesta sin respuestas (409 ENCUESTA_NO_EDITABLE si ya tiene).
 * Endpoint: DELETE /api/v1/eventos/{eventoId}/encuestas/{encuestaId}
 */
export async function eliminarEncuesta(eventoId, encuestaId) {
  await httpClient.delete(`${base(eventoId)}/${encuestaId}`);
}

/**
 * Publica la encuesta: queda habilitada para quienes asistieron y se les avisa en la campana (Criterio 1).
 * - 409 ENCUESTA_INCOMPLETA (sin preguntas o fecha de cierre vencida), EVENTO_NO_DISPONIBLE,
 *   ACTIVIDAD_NO_DISPONIBLE o ENCUESTA_ESTADO_INVALIDO.
 * Endpoint: POST /api/v1/eventos/{eventoId}/encuestas/{encuestaId}/publicar
 */
export async function publicarEncuesta(eventoId, encuestaId) {
  const { data } = await httpClient.post(`${base(eventoId)}/${encuestaId}/publicar`);
  return data;
}

/**
 * Cierra una encuesta publicada: deja de recibir respuestas y conserva los resultados.
 * Endpoint: POST /api/v1/eventos/{eventoId}/encuestas/{encuestaId}/cerrar
 */
export async function cerrarEncuesta(eventoId, encuestaId) {
  const { data } = await httpClient.post(`${base(eventoId)}/${encuestaId}/cerrar`);
  return data;
}

/**
 * Resultados consolidados por pregunta (Criterio 4): promedio y distribución de la escala, conteo por opción,
 * textos libres, habilitados, respuestas y tasa de respuesta.
 * Endpoint: GET /api/v1/eventos/{eventoId}/encuestas/{encuestaId}/resultados
 */
export async function obtenerResultados(eventoId, encuestaId) {
  const { data } = await httpClient.get(`${base(eventoId)}/${encuestaId}/resultados`);
  return data;
}

/**
 * Quién respondió y qué respondió, solo en encuestas identificadas (409 ENCUESTA_ANONIMA en las anónimas).
 * Endpoint: GET /api/v1/eventos/{eventoId}/encuestas/{encuestaId}/respuestas
 */
export async function listarRespuestasPorParticipante(eventoId, encuestaId) {
  const { data } = await httpClient.get(`${base(eventoId)}/${encuestaId}/respuestas`);
  return Array.isArray(data) ? data : [];
}

/**
 * Actividades del evento, para elegir a cuál se aplica la encuesta.
 * Endpoint: GET /api/v1/eventos/{eventoId}/actividades
 */
export async function listarActividadesEvento(eventoId) {
  return actividadService.listarActividades(eventoId);
}

// ── Participante ──

/**
 * Encuestas de los eventos y actividades a los que asistió el usuario que todavía puede responder, y las que ya
 * respondió (Criterios 1 y 3).
 * Endpoint: GET /api/v1/encuestas/mias
 */
export async function listarMisEncuestas() {
  const { data } = await httpClient.get('/encuestas/mias');
  return Array.isArray(data) ? data : [];
}

/**
 * Formulario de la encuesta con sus preguntas. 403 ENCUESTA_NO_HABILITADA si no registró asistencia (Criterio 3).
 * Endpoint: GET /api/v1/encuestas/{encuestaId}
 */
export async function obtenerFormulario(encuestaId) {
  const { data } = await httpClient.get(`/encuestas/${encuestaId}`);
  return data;
}

/**
 * Envía las respuestas (Criterio 2). Se guardan anónimas o identificadas según la configuración de la encuesta.
 * - 400 RESPUESTAS_INVALIDAS con `erroresValidacion` por pregunta (clave `pregunta_<id>`).
 * - 403 ENCUESTA_NO_HABILITADA; 409 ENCUESTA_CERRADA o ENCUESTA_YA_RESPONDIDA.
 * Endpoint: POST /api/v1/encuestas/{encuestaId}/respuestas
 * @param {number} encuestaId
 * @param {Array<{ preguntaId: number, valorEscala?: number, opcionId?: number, texto?: string }>} respuestas
 */
export async function responderEncuesta(encuestaId, respuestas) {
  const { data } = await httpClient.post(`/encuestas/${encuestaId}/respuestas`, { respuestas });
  return data;
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const encuestaService = {
  listarEncuestas,
  crearEncuesta,
  actualizarEncuesta,
  eliminarEncuesta,
  publicarEncuesta,
  cerrarEncuesta,
  obtenerResultados,
  listarRespuestasPorParticipante,
  listarActividadesEvento,
  listarMisEncuestas,
  obtenerFormulario,
  responderEncuesta,
};
