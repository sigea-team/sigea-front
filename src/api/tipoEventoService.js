/**
 * @file tipoEventoService.js
 * @description Cliente de la API del catálogo global de tipos de evento (congreso, seminario,
 * taller, etc.). El formulario de eventos lo usa para llenar el combobox de tipo, y la ventana
 * "Tipos de evento" para administrar el catálogo.
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Base: /api/v1/tipos-evento
 * @module api/tipoEventoService
 */

import { httpClient } from './httpClient';

/**
 * Lista el catálogo ordenado por nombre.
 * Endpoint: GET /api/v1/tipos-evento
 * @returns {Promise<Array<{id: number, nombre: string, descripcion: string|null}>>}
 */
export async function listarTiposEvento() {
  const { data } = await httpClient.get('/tipos-evento');
  return data;
}

/**
 * Crea un tipo. Si el nombre ya existe → 409 PARAMETRO_DUPLICADO.
 * Endpoint: POST /api/v1/tipos-evento
 * @param {{nombre: string, descripcion: string|null}} datos
 */
export async function crearTipoEvento(datos) {
  const { data } = await httpClient.post('/tipos-evento', datos);
  return data;
}

/**
 * Actualiza nombre y descripción. Los eventos que lo usan muestran el nombre nuevo.
 * Endpoint: PUT /api/v1/tipos-evento/{id}
 */
export async function actualizarTipoEvento(id, datos) {
  const { data } = await httpClient.put(`/tipos-evento/${id}`, datos);
  return data;
}

/**
 * Consulta cuántos eventos usan el tipo, para advertir antes de eliminar.
 * Endpoint: GET /api/v1/tipos-evento/{id}/uso
 * @returns {Promise<{id: number, nombre: string, eventos: number, eliminable: boolean}>}
 */
export async function consultarUsoTipoEvento(id) {
  const { data } = await httpClient.get(`/tipos-evento/${id}/uso`);
  return data;
}

/**
 * Elimina un tipo que ningún evento usa. Si está en uso → 409 PARAMETRO_EN_USO.
 * Endpoint: DELETE /api/v1/tipos-evento/{id}
 */
export async function eliminarTipoEvento(id) {
  await httpClient.delete(`/tipos-evento/${id}`);
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const tipoEventoService = {
  listar: listarTiposEvento,
  crear: crearTipoEvento,
  actualizar: actualizarTipoEvento,
  consultarUso: consultarUsoTipoEvento,
  eliminar: eliminarTipoEvento,
};
