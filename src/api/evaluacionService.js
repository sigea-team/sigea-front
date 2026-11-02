import { httpClient } from './httpClient';
import { combinarDetalleAsignacion } from '../features/evaluaciones/evaluacionUtils';
import { normalizarAsignacionBandeja } from '../features/asignaciones/asignacionUtils';

/**
 * @file evaluacionService.js
 * @description Servicio de API para la gestión de evaluaciones de propuestas académicas (HU-17).
 * Trabaja solo con los endpoints REST del backend; los errores se propagan para que la vista los muestre.
 * @module api/evaluacionService
 */

// Versiones anteriores guardaban asignaciones de demostración en el navegador; se limpian para
// que no queden datos ficticios de sesiones previas.
try {
  localStorage.removeItem('sigea-evaluaciones-local');
} catch {
  // localStorage no disponible
}

export const evaluacionService = {
  /**
   * Lista las asignaciones del evaluador autenticado con los criterios reales de la rúbrica
   * y las calificaciones ya registradas.
   * Backend: GET /api/v1/asignaciones/mis-asignaciones?incluirCompletadas=true
   *          y GET /api/v1/evaluaciones/asignaciones/{asignacionId} por cada asignación.
   *
   * @param {Object} [filtros]
   * @param {number|string} [filtros.propuestaId]
   * @param {string} [filtros.estado]
   * @returns {Promise<Array<Object>>}
   */
  async listarAsignaciones(filtros = {}) {
    const { data } = await httpClient.get('/asignaciones/mis-asignaciones', {
      params: { incluirCompletadas: true },
    });
    let asignaciones = (Array.isArray(data) ? data : []).map((a) => normalizarAsignacionBandeja(a));

    if (filtros.propuestaId) {
      asignaciones = asignaciones.filter((a) => String(a.propuestaId) === String(filtros.propuestaId));
    }
    if (filtros.estado && filtros.estado !== 'todos') {
      asignaciones = asignaciones.filter((a) => a.estado === filtros.estado);
    }

    // La bandeja no trae la rúbrica ni las calificaciones: se completan con el detalle de cada asignación.
    const detalles = await Promise.allSettled(
      asignaciones.map((a) => httpClient.get(`/evaluaciones/asignaciones/${a.asignacionId}`))
    );

    return asignaciones.map((a, i) => {
      const r = detalles[i];
      if (r.status === 'fulfilled') return combinarDetalleAsignacion(a, r.value.data);
      console.error(`[evaluacionService] No se pudo cargar el detalle de la asignación ${a.asignacionId}:`, r.reason);
      return { ...a, errorDetalle: true };
    });
  },

  /**
   * Obtiene el detalle de una asignación con los criterios de la rúbrica y sus calificaciones.
   * Backend: GET /api/v1/evaluaciones/asignaciones/{asignacionId}
   *
   * @param {number|string} asignacionId
   * @returns {Promise<Object>} AsignacionEvaluacionResponse
   */
  async obtenerAsignacion(asignacionId) {
    const { data } = await httpClient.get(`/evaluaciones/asignaciones/${asignacionId}`);
    return data;
  },

  /**
   * Registra o actualiza la evaluación de una propuesta (HU-17).
   * Backend: POST /api/v1/evaluaciones
   *
   * @param {Object} request
   * @param {number} request.asignacionId
   * @param {Array<{ criterioId: number, calificacion: number, observaciones?: string }>} request.calificaciones
   * @returns {Promise<Object>} AsignacionEvaluacionResponse
   */
  async registrarEvaluacion(request) {
    const { data } = await httpClient.post('/evaluaciones', request);
    return data;
  },

  /**
   * Consulta el resultado de evaluación ponderada de una propuesta (HU-17).
   * Backend: GET /api/v1/evaluaciones/propuestas/{propuestaId}/resultado
   *
   * @param {number|string} propuestaId
   * @returns {Promise<Object>} ResultadoEvaluacionResponse { propuestaId, puntuacionPonderada, clasificacion, completo }
   */
  async obtenerResultado(propuestaId) {
    const { data } = await httpClient.get(`/evaluaciones/propuestas/${propuestaId}/resultado`);
    return data;
  },
};
