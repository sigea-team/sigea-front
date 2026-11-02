/**
 * @file salaService.js
 * @description Cliente de la API para la gestión y configuración de salas, espacios
 * y disponibilidad horaria de salas y ponentes (HU-20: Criterios 1 al 5).
 * Soporta catálogo general de salas independiente de eventos y asignación por evento.
 * @module api/salaService
 */

import { httpClient } from './httpClient';
import { crearSalasApiMock } from '../features/salas/mocks/salasMock';

// Instancia fallback para pruebas locales y desarrollo continuo
const mockApi = crearSalasApiMock();

export const salaService = {
  /**
   * Lista las salas.
   * Si no se especifica eventoId, consulta el catálogo general de salas institucionales.
   * Si se especifica eventoId, lista las salas asignadas/disponibles para dicho evento.
   * GET /api/v1/salas o GET /api/v1/eventos/{eventoId}/salas
   */
  async listarSalas(eventoId = null) {
    try {
      const endpoint = eventoId ? `/eventos/${eventoId}/salas` : '/salas';
      const { data } = await httpClient.get(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.listarSalas(eventoId);
      }
      throw err;
    }
  },

  /**
   * Obtiene el detalle de una sala.
   * GET /api/v1/salas/{salaId}
   */
  async obtenerSala(salaId) {
    try {
      const { data } = await httpClient.get(`/salas/${salaId}`);
      return data;
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.obtenerSala(salaId);
      }
      throw err;
    }
  },

  /**
   * Registra una sala.
   * Si eventoId es null o no se envía, la registra en el catálogo general institucional.
   * POST /api/v1/salas o POST /api/v1/eventos/{eventoId}/salas
   */
  async crearSala(eventoId = null, datos = {}) {
    try {
      const endpoint = eventoId ? `/eventos/${eventoId}/salas` : '/salas';
      const { data } = await httpClient.post(endpoint, datos);
      return data;
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.crearSala(eventoId, datos);
      }
      throw err;
    }
  },

  /**
   * Actualiza la configuración básica de una sala (nombre, ubicación, tipo, aforo).
   * PUT /api/v1/salas/{salaId}
   */
  async actualizarSala(salaId, datos) {
    try {
      const { data } = await httpClient.put(`/salas/${salaId}`, datos);
      return data;
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.actualizarSala(salaId, datos);
      }
      throw err;
    }
  },

  /**
   * Elimina una sala del sistema.
   * DELETE /api/v1/salas/{salaId}
   */
  async eliminarSala(salaId) {
    try {
      await httpClient.delete(`/salas/${salaId}`);
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.eliminarSala(salaId);
      }
      throw err;
    }
  },

  /**
   * Guarda o actualiza las franjas de disponibilidad horaria de una sala.
   * PUT /api/v1/salas/{salaId}/disponibilidad
   */
  async guardarDisponibilidadSala(salaId, franjas) {
    try {
      const { data } = await httpClient.put(`/salas/${salaId}/disponibilidad`, { franjas });
      return data;
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.guardarDisponibilidadSala(salaId, franjas);
      }
      throw err;
    }
  },

  /**
   * Lista los ponentes registrados asociados al evento para configurar su disponibilidad.
   * GET /api/v1/eventos/{eventoId}/ponentes-disponibilidad
   */
  async listarPonentesEvento(eventoId) {
    try {
      const { data } = await httpClient.get(`/eventos/${eventoId}/ponentes-disponibilidad`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.listarPonentesEvento(eventoId);
      }
      throw err;
    }
  },

  /**
   * Guarda los rangos de disponibilidad horaria de un ponente en el evento.
   * PUT /api/v1/eventos/{eventoId}/ponentes/{personaId}/disponibilidad
   */
  async guardarDisponibilidadPonente(eventoId, personaId, franjas) {
    try {
      const { data } = await httpClient.put(
        `/eventos/${eventoId}/ponentes/${personaId}/disponibilidad`,
        { franjas }
      );
      return data;
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.guardarDisponibilidadPonente(eventoId, personaId, franjas);
      }
      throw err;
    }
  },

  /**
   * Lista las actividades programadas en el evento o generales.
   * GET /api/v1/eventos/{eventoId}/actividades
   */
  async listarActividades(eventoId = null) {
    try {
      const endpoint = eventoId ? `/eventos/${eventoId}/actividades` : '/actividades';
      const { data } = await httpClient.get(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.listarActividades(eventoId);
      }
      throw err;
    }
  },

  /**
   * Registra/programa una actividad en el evento.
   * POST /api/v1/eventos/{eventoId}/actividades
   */
  async programarActividad(eventoId, datos) {
    try {
      const { data } = await httpClient.post(`/eventos/${eventoId}/actividades`, datos);
      return data;
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.programarActividad(eventoId, datos);
      }
      throw err;
    }
  },

  /**
   * Elimina una actividad.
   * DELETE /api/v1/actividades/{actividadId}
   */
  async eliminarActividad(actividadId) {
    try {
      await httpClient.delete(`/actividades/${actividadId}`);
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        return mockApi.eliminarActividad(actividadId);
      }
      throw err;
    }
  },
};
