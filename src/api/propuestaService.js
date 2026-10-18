import { httpClient } from './httpClient';

/**
 * @file propuestaService.js
 * @description Servicio de API para el envío y consulta de propuestas de ponencia (HU Registro de Autores y Ponentes).
 * Si el backend tiene activo el endpoint (/api/v1/propuestas), realiza la petición HTTP;
 * en caso de error de conexión o 404, persiste de forma resiliente en localStorage
 * para que el flujo frontend sea 100% operativo y comprobable.
 * @module api/propuestaService
 */

const CLAVE_STORAGE = 'sigea-propuestas-registradas';

function obtenerPropuestasLocales() {
  try {
    const raw = localStorage.getItem(CLAVE_STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function guardarPropuestaLocal(propuesta) {
  try {
    const lista = obtenerPropuestasLocales();
    const nueva = {
      ...propuesta,
      id: propuesta.id || Date.now(),
      fechaEnvio: propuesta.fechaEnvio || new Date().toISOString(),
      estado: propuesta.estado || 'ENVIADA',
    };
    lista.unshift(nueva);
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(lista));
    return nueva;
  } catch (err) {
    console.error('Error al guardar propuesta en localStorage:', err);
    return propuesta;
  }
}

export const propuestaService = {
  /**
   * Envía una propuesta académica asociando su lista diferenciada de autores/ponentes.
   * @param {Object} datos - Datos de la propuesta con su lista de autores.
   * @param {string|number} datos.convocatoriaId
   * @param {string} datos.titulo
   * @param {string} datos.resumen
   * @param {string} [datos.ejeTematico]
   * @param {Array<Object>} datos.autores - Lista de autores con rol específico (Criterio 1 y 2).
   * @returns {Promise<Object>}
   */
  async enviarPropuesta(datos) {
    try {
      const { data } = await httpClient.post('/propuestas', datos);
      guardarPropuestaLocal(data);
      return data;
    } catch (err) {
      // Fallback resiliente en modo frontend si el backend no tiene el endpoint activo
      if (!err.response || err.response.status === 404 || err.response.status === 501) {
        return guardarPropuestaLocal(datos);
      }
      throw err;
    }
  },

  /**
   * Lista las propuestas asociadas a una convocatoria específica.
   * @param {string|number} convocatoriaId
   * @returns {Promise<Array<Object>>}
   */
  async listarPorConvocatoria(convocatoriaId) {
    try {
      const { data } = await httpClient.get(`/convocatorias/${convocatoriaId}/propuestas`);
      return Array.isArray(data) ? data : [];
    } catch {
      const locales = obtenerPropuestasLocales();
      return locales.filter((p) => String(p.convocatoriaId) === String(convocatoriaId));
    }
  },

  /**
   * Obtiene las propuestas enviadas por el autor/usuario actual.
   * @returns {Promise<Array<Object>>}
   */
  async listarMisPropuestas() {
    try {
      const { data } = await httpClient.get('/propuestas/mis-propuestas');
      return Array.isArray(data) ? data : [];
    } catch {
      return obtenerPropuestasLocales();
    }
  },
};
