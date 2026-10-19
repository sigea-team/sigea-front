/**
 * @file parametroEventoService.js
 * @description Cliente de la API de parámetros del evento (HU-05: RF06 + RF07):
 * tipos de actividad y líneas temáticas. Ambos son sub-recursos del evento.
 * Usa el `httpClient` compartido, que agrega el token JWT en cada petición.
 * Base: /api/v1/eventos/{eventoId}/tipos-actividad y /api/v1/eventos/{eventoId}/lineas-tematicas
 * @module api/parametroEventoService
 */

import { httpClient } from './httpClient';

/** Segmento de URL de cada catálogo. */
const RUTAS = {
  tipos: 'tipos-actividad',
  lineas: 'lineas-tematicas',
};

const base = (catalogo, eventoId) => `/eventos/${eventoId}/${RUTAS[catalogo]}`;

/**
 * Lista los elementos del catálogo, ordenados por nombre.
 * Endpoint: GET /api/v1/eventos/{eventoId}/{catalogo}
 * @param {'tipos'|'lineas'} catalogo
 * @param {number} eventoId
 * @returns {Promise<Array<{id: number, eventoId: number, nombre: string, descripcion: string|null}>>}
 */
export async function listar(catalogo, eventoId) {
  const { data } = await httpClient.get(base(catalogo, eventoId));
  return data;
}

/**
 * Crea un elemento (Criterio 1). Si el nombre ya existe → 409 PARAMETRO_DUPLICADO (Criterio 3).
 * Endpoint: POST /api/v1/eventos/{eventoId}/{catalogo}
 * @param {'tipos'|'lineas'} catalogo
 * @param {number} eventoId
 * @param {{nombre: string, descripcion: string|null}} datos
 */
export async function crear(catalogo, eventoId, datos) {
  const { data } = await httpClient.post(base(catalogo, eventoId), datos);
  return data;
}

/**
 * Actualiza nombre y descripción de un elemento.
 * Endpoint: PUT /api/v1/eventos/{eventoId}/{catalogo}/{id}
 */
export async function actualizar(catalogo, eventoId, id, datos) {
  const { data } = await httpClient.put(`${base(catalogo, eventoId)}/${id}`, datos);
  return data;
}

/**
 * Consulta cuántas actividades y propuestas usan el elemento, para advertir del impacto
 * antes de eliminar (Criterio 2).
 * Endpoint: GET /api/v1/eventos/{eventoId}/{catalogo}/{id}/uso
 * @returns {Promise<{id: number, nombre: string, actividades: number, propuestas: number, eliminable: boolean}>}
 */
export async function consultarUso(catalogo, eventoId, id) {
  const { data } = await httpClient.get(`${base(catalogo, eventoId)}/${id}/uso`);
  return data;
}

/**
 * Elimina un elemento sin uso. Si está en uso → 409 PARAMETRO_EN_USO (Criterio 2).
 * Endpoint: DELETE /api/v1/eventos/{eventoId}/{catalogo}/{id}
 */
export async function eliminar(catalogo, eventoId, id) {
  await httpClient.delete(`${base(catalogo, eventoId)}/${id}`);
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const parametroEventoService = {
  listar,
  crear,
  actualizar,
  consultarUso,
  eliminar,
};
