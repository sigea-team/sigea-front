/**
 * @file salaService.js
 * @description Cliente de la API de salas y disponibilidad horaria (HU-20) y programación (HU-21).
 * Trabaja solo con el backend real; los errores se propagan para que la vista los muestre.
 * Base: /api/v1/eventos/{eventoId}/salas, /api/v1/eventos/{eventoId}/ponentes/{personaId}/disponibilidad
 * y /api/v1/eventos/{eventoId}/actividades.
 * @module api/salaService
 */
import { httpClient } from './httpClient';
import { listarConferencistas } from './conferencistaService';
import { actividadService } from './actividadService';
import {
  aFranjasApi,
  aSalaRequest,
  normalizarFranjasApi,
  normalizarPonenteApi,
  normalizarSalaApi,
} from '../features/salas/salaUtils';

/** Convierte la respuesta de actualización de disponibilidad al formato de la interfaz. */
function normalizarActualizacion(data) {
  return {
    disponibilidad: normalizarFranjasApi(data?.disponibilidades),
    conflictos: Array.isArray(data?.conflictos) ? data.conflictos : [],
    tieneConflictos: Boolean(data?.tieneConflictos),
  };
}

export const salaService = {
  /** Soporta programación y consumo de actividades mediante ActividadController (HU-21). */
  soportaActividades: true,

  /**
   * Lista las salas de un evento.
   * GET /api/v1/eventos/{eventoId}/salas
   * @param {number|string} eventoId
   */
  async listarSalas(eventoId) {
    if (!eventoId) return [];
    const { data } = await httpClient.get(`/eventos/${eventoId}/salas`);
    return (Array.isArray(data) ? data : []).map(normalizarSalaApi);
  },

  /**
   * Consulta todas las salas registradas a través de los eventos del sistema.
   * Permite reutilizarlas en el catálogo institucional para añadir a un evento.
   */
  async listarTodasLasSalas(eventos = []) {
    if (!eventos || eventos.length === 0) return [];
    const resultados = await Promise.allSettled(
      eventos.map((e) => this.listarSalas(e.id))
    );
    const todas = [];
    const idsVistos = new Set();
    resultados.forEach((res) => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        res.value.forEach((sala) => {
          if (!idsVistos.has(sala.id)) {
            idsVistos.add(sala.id);
            todas.push(sala);
          }
        });
      }
    });
    return todas;
  },

  /**
   * Detalle de una sala.
   * GET /api/v1/eventos/{eventoId}/salas/{salaId}
   */
  async obtenerSala(eventoId, salaId) {
    const { data } = await httpClient.get(`/eventos/${eventoId}/salas/${salaId}`);
    return normalizarSalaApi(data);
  },

  /**
   * Registra una sala en el evento, con su disponibilidad inicial (Criterio 1).
   * POST /api/v1/eventos/{eventoId}/salas
   */
  async crearSala(eventoId, datos = {}) {
    if (!eventoId) throw new Error('Selecciona un evento antes de registrar la sala.');
    const { data } = await httpClient.post(`/eventos/${eventoId}/salas`, aSalaRequest(datos));
    return normalizarSalaApi(data);
  },

  /**
   * Actualiza nombre, ubicación, tipo, aforo y disponibilidad de una sala.
   * PUT /api/v1/eventos/{eventoId}/salas/{salaId}
   */
  async actualizarSala(eventoId, salaId, datos) {
    const { data } = await httpClient.put(`/eventos/${eventoId}/salas/${salaId}`, aSalaRequest(datos));
    return normalizarSalaApi(data);
  },

  /**
   * Elimina una sala.
   * DELETE /api/v1/eventos/{eventoId}/salas/{salaId}
   */
  async eliminarSala(eventoId, salaId) {
    await httpClient.delete(`/eventos/${eventoId}/salas/${salaId}`);
  },

  /**
   * Reemplaza las franjas de disponibilidad de una sala. Devuelve también las actividades en conflicto.
   * PUT /api/v1/eventos/{eventoId}/salas/{salaId}/disponibilidad (cuerpo: arreglo de franjas)
   * @returns {Promise<{ disponibilidad: Array, conflictos: Array, tieneConflictos: boolean }>}
   */
  async guardarDisponibilidadSala(eventoId, salaId, franjas) {
    const { data } = await httpClient.put(`/eventos/${eventoId}/salas/${salaId}/disponibilidad`, aFranjasApi(franjas));
    return normalizarActualizacion(data);
  },

  /**
   * Ponentes del evento (sus conferencistas) con su disponibilidad horaria.
   * GET /api/v1/eventos/{eventoId}/conferencistas y GET .../ponentes/{personaId}/disponibilidad por cada uno.
   */
  async listarPonentesEvento(eventoId) {
    if (!eventoId) return [];
    const conferencistas = await listarConferencistas(eventoId);
    const lista = Array.isArray(conferencistas) ? conferencistas : [];
    const disponibilidades = await Promise.all(
      lista.map((c) =>
        httpClient
          .get(`/eventos/${eventoId}/ponentes/${c.personaId}/disponibilidad`)
          .then((r) => (Array.isArray(r.data) ? r.data : []))
      )
    );
    return lista.map((c, i) => normalizarPonenteApi(c, disponibilidades[i]));
  },

  /**
   * Reemplaza la disponibilidad de un ponente en el evento.
   * PUT /api/v1/eventos/{eventoId}/ponentes/{personaId}/disponibilidad (cuerpo: arreglo de franjas)
   */
  async guardarDisponibilidadPonente(eventoId, personaId, franjas) {
    const { data } = await httpClient.put(
      `/eventos/${eventoId}/ponentes/${personaId}/disponibilidad`,
      aFranjasApi(franjas)
    );
    return normalizarActualizacion(data);
  },

  /**
   * Conectado con ActividadController (GET /api/v1/eventos/{eventoId}/actividades).
   */
  async listarActividades(eventoId, fecha = null) {
    if (!eventoId) return [];
    return actividadService.listarActividades(eventoId, fecha);
  },

  /**
   * Conectado con ActividadController (POST /api/v1/eventos/{eventoId}/actividades).
   */
  async programarActividad(eventoId, datos) {
    return actividadService.crearActividad(eventoId, datos);
  },

  /**
   * Conectado con ActividadController (DELETE /api/v1/eventos/{eventoId}/actividades/{actividadId}).
   */
  async eliminarActividad(eventoId, actividadId) {
    return actividadService.eliminarActividad(eventoId, actividadId);
  },
};
