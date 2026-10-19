import { httpClient } from './httpClient';
import { autorFrontToBackend, autorBackendToFront } from '../features/propuestas/propuestaUtils';

/**
 * @file propuestaService.js
 * @description Servicio de API para el envío y consulta de propuestas de ponencia (HU Registro de Autores y Ponentes).
 * Conecta directamente con el backend REST en /api/v1/propuestas.
 * @module api/propuestaService
 */

export const propuestaService = {
  /**
   * Envía una propuesta académica asociando su lista diferenciada de autores/ponentes.
   * Mapea los datos del formulario frontend al formato esperado por el backend (PropuestaRequest DTO).
   *
   * Backend endpoint: POST /api/v1/propuestas
   * Backend DTO (PropuestaRequest): { convocatoriaId, titulo, resumen, palabrasClave, lineaTematicaId, autores[] }
   * Backend DTO (AutorRequest):     { nombre, apellidos, correo, filiacion, rol, orden, ... }
   *
   * @param {Object} datos - Datos de la propuesta con su lista de autores (formato frontend).
   * @param {string|number} datos.convocatoriaId
   * @param {string} datos.titulo
   * @param {string} datos.resumen
   * @param {string} [datos.ejeTematico] - Mapeado a palabrasClave para el backend.
   * @param {number} [datos.lineaTematicaId] - ID de línea temática (opcional).
   * @param {Array<Object>} datos.autores - Lista de autores en formato frontend { nombreCompleto, correo, filiacion, rol }.
   * @returns {Promise<Object>} Propuesta creada con autores asociados.
   */
  async enviarPropuesta(datos) {
    // Mapear autores del formato frontend al formato backend (AutorRequest DTO)
    const autoresBackend = (datos.autores || []).map((autor, index) =>
      autorFrontToBackend(autor, index + 1)
    );

    const payload = {
      convocatoriaId: Number(datos.convocatoriaId),
      titulo: datos.titulo,
      resumen: datos.resumen,
      palabrasClave: datos.ejeTematico || null,
      lineaTematicaId: datos.lineaTematicaId || null,
      autores: autoresBackend,
    };

    const { data } = await httpClient.post('/propuestas', payload);

    // Normalizar la respuesta del backend para que el frontend la pueda usar
    return normalizarPropuestaResponse(data);
  },

  /**
   * Obtiene el detalle de una propuesta con sus autores.
   * Backend endpoint: GET /api/v1/propuestas/{id}
   * @param {string|number} propuestaId
   * @returns {Promise<Object>}
   */
  async obtenerPropuesta(propuestaId) {
    const { data } = await httpClient.get(`/propuestas/${propuestaId}`);
    return normalizarPropuestaResponse(data);
  },

  /**
   * Lista las propuestas asociadas a una convocatoria específica.
   * Backend endpoint: GET /api/v1/convocatorias/{id}/propuestas
   * Fallback: GET /api/v1/propuestas?convocatoriaId={id} (si el endpoint dedicado no existe)
   * @param {string|number} convocatoriaId
   * @returns {Promise<Array<Object>>}
   */
  async listarPorConvocatoria(convocatoriaId) {
    try {
      const { data } = await httpClient.get(`/convocatorias/${convocatoriaId}/propuestas`);
      return Array.isArray(data) ? data.map(normalizarPropuestaResponse) : [];
    } catch {
      return [];
    }
  },

  /**
   * Obtiene las propuestas enviadas por el autor/usuario actual.
   * @returns {Promise<Array<Object>>}
   */
  async listarMisPropuestas() {
    try {
      const { data } = await httpClient.get('/propuestas/mis-propuestas');
      return Array.isArray(data) ? data.map(normalizarPropuestaResponse) : [];
    } catch {
      return [];
    }
  },

  /**
   * Agrega un autor individual a una propuesta existente.
   * Backend endpoint: POST /api/v1/propuestas/{id}/autores
   * @param {string|number} propuestaId
   * @param {Object} autorFront - Autor en formato frontend { nombreCompleto, correo, filiacion, rol }
   * @returns {Promise<Object>} Autor registrado en formato frontend.
   */
  async agregarAutor(propuestaId, autorFront) {
    const autorPayload = autorFrontToBackend(autorFront);
    const { data } = await httpClient.post(`/propuestas/${propuestaId}/autores`, autorPayload);
    return autorBackendToFront(data);
  },

  /**
   * Lista los autores de una propuesta.
   * Backend endpoint: GET /api/v1/propuestas/{id}/autores
   * @param {string|number} propuestaId
   * @returns {Promise<Array<Object>>} Autores en formato frontend.
   */
  async listarAutores(propuestaId) {
    const { data } = await httpClient.get(`/propuestas/${propuestaId}/autores`);
    return Array.isArray(data) ? data.map(autorBackendToFront) : [];
  },

  /**
   * Actualiza el rol u orden de un autor en la propuesta.
   * Backend endpoint: PUT /api/v1/propuestas/{id}/autores/{personaId}
   * @param {string|number} propuestaId
   * @param {string|number} personaId
   * @param {{ rol: string, orden?: number }} cambios
   * @returns {Promise<Object>} Autor actualizado en formato frontend.
   */
  async actualizarAutor(propuestaId, personaId, cambios) {
    const { data } = await httpClient.put(`/propuestas/${propuestaId}/autores/${personaId}`, {
      rol: cambios.rol,
      orden: cambios.orden || undefined,
    });
    return autorBackendToFront(data);
  },

  /**
   * Elimina (desvincula) un autor de una propuesta.
   * Backend endpoint: DELETE /api/v1/propuestas/{id}/autores/{personaId}
   * @param {string|number} propuestaId
   * @param {string|number} personaId
   * @returns {Promise<void>}
   */
  async eliminarAutor(propuestaId, personaId) {
    await httpClient.delete(`/propuestas/${propuestaId}/autores/${personaId}`);
  },
};

/**
 * Normaliza la respuesta PropuestaResponse del backend al formato que consume el frontend.
 * @param {Object} propuestaBack
 * @returns {Object}
 */
function normalizarPropuestaResponse(propuestaBack) {
  if (!propuestaBack) return propuestaBack;
  return {
    id: propuestaBack.id,
    convocatoriaId: propuestaBack.convocatoriaId,
    convocatoriaTitulo: propuestaBack.convocatoriaTitulo,
    titulo: propuestaBack.titulo,
    resumen: propuestaBack.resumen,
    ejeTematico: propuestaBack.palabrasClave || propuestaBack.lineaTematicaNombre || '',
    palabrasClave: propuestaBack.palabrasClave,
    lineaTematicaId: propuestaBack.lineaTematicaId,
    lineaTematicaNombre: propuestaBack.lineaTematicaNombre,
    estado: propuestaBack.estado,
    fechaEnvio: propuestaBack.fechaEnvio,
    autores: Array.isArray(propuestaBack.autores)
      ? propuestaBack.autores.map(autorBackendToFront)
      : [],
  };
}
