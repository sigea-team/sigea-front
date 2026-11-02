/**
 * @file salaService.js
 * @description Cliente de la API de salas y disponibilidad horaria (HU-20).
 * Trabaja solo con el backend real; los errores se propagan para que la vista los muestre.
 * Base: /api/v1/eventos/{eventoId}/salas y /api/v1/eventos/{eventoId}/ponentes/{personaId}/disponibilidad.
 * Toda sala pertenece a un evento (salas.evento_id es obligatorio), por eso cada operación recibe el evento.
 * @module api/salaService
 */
import { httpClient } from './httpClient';
import { listarConferencistas } from './conferencistaService';
import {
  aFranjasApi,
  aSalaRequest,
  normalizarFranjasApi,
  normalizarPonenteApi,
  normalizarSalaApi,
} from '../features/salas/salaUtils';

/** Error para funciones que la interfaz ofrece pero el backend todavía no implementa. */
function noDisponible(funcion) {
  const err = new Error(`${funcion} aún no está disponible: el backend no tiene este servicio.`);
  err.codigo = 'NO_DISPONIBLE';
  return err;
}

/** Convierte la respuesta de actualización de disponibilidad al formato de la interfaz. */
function normalizarActualizacion(data) {
  return {
    disponibilidad: normalizarFranjasApi(data?.disponibilidades),
    conflictos: Array.isArray(data?.conflictos) ? data.conflictos : [],
    tieneConflictos: Boolean(data?.tieneConflictos),
  };
}

export const salaService = {
  /** El backend todavía no tiene endpoints de actividades (programación). */
  soportaActividades: false,

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
   * Detalle de una sala.
   * GET /api/v1/eventos/{eventoId}/salas/{salaId}
   */
  async obtenerSala(eventoId, salaId) {
    const { data } = await httpClient.get(`/eventos/${eventoId}/salas/${salaId}`);
    return normalizarSalaApi(data);
  },

  /**
   * Registra una sala en el evento, con su disponibilidad inicial.
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

  /** Sin backend todavía: no hay actividades que listar. */
  async listarActividades() {
    return [];
  },

  async programarActividad() {
    throw noDisponible('La programación de actividades');
  },

  async eliminarActividad() {
    throw noDisponible('La eliminación de actividades');
  },
};
