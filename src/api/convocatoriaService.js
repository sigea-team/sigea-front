/**
 * @file convocatoriaService.js
 * @description Servicio API para la gestión de convocatorias (HU Crear convocatorias).
 * Trabaja solo con el backend; los errores se propagan para que la vista los muestre.
 * @module api/convocatoriaService
 */

import { httpClient } from './httpClient';

// Versiones anteriores guardaban convocatorias de demostración en el navegador y las mostraban como
// reales; se limpian para que no queden datos ficticios de sesiones previas.
try {
  localStorage.removeItem('sigea_convocatorias_mock');
} catch {
  // localStorage no disponible
}

/**
 * Lista las convocatorias.
 * - Administrador: todas (borradores incluidos). GET /api/v1/convocatorias
 * - Resto de usuarios: solo las publicadas, por el endpoint público. GET /api/v1/publico/convocatorias
 * Los errores se propagan para que la página los muestre (antes se caía a datos de demostración).
 * @param {boolean} [esAdmin=true]
 * @returns {Promise<Array<Object>>}
 */
export async function listarConvocatorias(esAdmin = true) {
  if (!esAdmin) {
    return listarConvocatoriasPublicadas();
  }
  const { data } = await httpClient.get('/convocatorias');
  return Array.isArray(data) ? data : [];
}

/**
 * Consulta una convocatoria por su ID.
 * Endpoint: GET /api/v1/convocatorias/{id}
 * @param {number|string} id
 */
export async function obtenerConvocatoria(id) {
  const { data } = await httpClient.get(`/convocatorias/${id}`);
  return data;
}

/**
 * Guarda una nueva convocatoria en estado BORRADOR (Criterio 1).
 * @param {Object} convocatoria
 */
export async function crearConvocatoria(convocatoria) {
  const payload = {
    eventoId: Number(convocatoria.eventoId),
    titulo: convocatoria.titulo,
    descripcion: convocatoria.descripcion,
    requisitos: convocatoria.requisitos,
    fechaApertura: convocatoria.fechaApertura,
    fechaCierre: convocatoria.fechaCierre,
  };

  const { data } = await httpClient.post('/convocatorias', payload);
  return data;
}

/**
 * Actualiza la información de una convocatoria existente sin publicarla (Criterio 3).
 * @param {number|string} id
 * @param {Object} cambios
 */
export async function actualizarConvocatoria(id, cambios) {
  const payload = {
    eventoId: Number(cambios.eventoId),
    titulo: cambios.titulo,
    descripcion: cambios.descripcion,
    requisitos: cambios.requisitos,
    fechaApertura: cambios.fechaApertura,
    fechaCierre: cambios.fechaCierre,
  };

  const { data } = await httpClient.put(`/convocatorias/${id}`, payload);
  return data;
}

/**
 * Publica una convocatoria que se encuentra en borrador.
 * Endpoint: POST /api/v1/convocatorias/{id}/publicar
 * @param {number|string} id
 */
export async function publicarConvocatoria(id) {
  // Sin captura: la página necesita el 400 CONVOCATORIA_INCOMPLETA (HU-11, Criterio 3) para avisar qué falta.
  const { data } = await httpClient.post(`/convocatorias/${id}/publicar`);
  return data;
}

/**
 * HU-11 (Criterio 2): modifica la fecha límite de una convocatoria publicada que aún no ha expirado.
 * El backend notifica el cambio (campana) a todos los usuarios activos.
 * Endpoint: PATCH /api/v1/convocatorias/{id}/fecha-cierre
 * @param {number|string} id
 * @param {string} fechaCierre - Nueva fecha y hora límite (YYYY-MM-DDTHH:mm).
 * @returns {Promise<{ convocatoria: Object, fechaCierreAnterior: string, usuariosNotificados: number }>}
 */
export async function actualizarFechaCierre(id, fechaCierre) {
  const { data } = await httpClient.patch(`/convocatorias/${id}/fecha-cierre`, { fechaCierre });
  return data;
}

/**
 * HU-11 (Criterio 1): consulta pública de convocatorias publicadas (no requiere sesión).
 * Endpoint: GET /api/v1/publico/convocatorias
 * @param {number|string} [eventoId] - Filtra por evento.
 * @returns {Promise<Array<Object>>}
 */
export async function listarConvocatoriasPublicadas(eventoId) {
  const params = eventoId ? { eventoId } : undefined;
  const { data } = await httpClient.get('/publico/convocatorias', { params });
  return Array.isArray(data) ? data : [];
}

/**
 * HU-11 (Criterio 1): detalle público de una convocatoria publicada (404 si no está publicada).
 * Endpoint: GET /api/v1/publico/convocatorias/{id}
 * @param {number|string} id
 */
export async function obtenerConvocatoriaPublicada(id) {
  const { data } = await httpClient.get(`/publico/convocatorias/${id}`);
  return data;
}

/**
 * Elimina una convocatoria en borrador.
 * @param {number|string} id
 */
export async function eliminarConvocatoria(id) {
  const { data } = await httpClient.delete(`/convocatorias/${id}`);
  return data;
}

export const convocatoriaService = {
  listarConvocatorias,
  obtenerConvocatoria,
  crearConvocatoria,
  actualizarConvocatoria,
  publicarConvocatoria,
  actualizarFechaCierre,
  listarConvocatoriasPublicadas,
  obtenerConvocatoriaPublicada,
  eliminarConvocatoria,
};
