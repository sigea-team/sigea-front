import { httpClient } from './httpClient';

/**
 * @file indicadorEventoService.js
 * @description Cliente de la API de indicadores y dashboard de un evento (HU-29: CU-25, RF50, RF51). Usa el
 * `httpClient` compartido, que agrega el token JWT.
 * @module api/indicadorEventoService
 */

/**
 * Calcula en este momento los indicadores del evento (Criterio 1) y las series para las gráficas. El backend no
 * guarda nada: cada llamada refleja la información más reciente, así que refrescar el dashboard es volver a llamar
 * (Criterio 3). Lo que no tiene datos suficientes llega con `disponible=false` o `hayDatos=false` y su motivo, sin
 * error (Criterio 2).
 * - 403 si la sesión no tiene `REPORTES_VER`, `EVENTOS_EDITAR` ni es administrador.
 * - 404 si el evento no existe.
 * Endpoint: GET /api/v1/eventos/{eventoId}/indicadores
 * @param {number|string} eventoId
 * @returns {Promise<{ eventoId: number, nombreEvento: string, estadoEvento: string, archivado: boolean,
 *   fechaCalculo: string, hayDatos: boolean, mensaje: string|null,
 *   grupos: Array<{ codigo: string, nombre: string, hayDatos: boolean, mensaje: string|null }>,
 *   indicadores: Array<{ codigo: string, nombre: string, grupo: string, valor: number|null, unidad: string,
 *     disponible: boolean, motivo: string|null }>,
 *   series: Array<{ codigo: string, titulo: string, grafico: string, hayDatos: boolean, mensaje: string|null,
 *     medidas: Array<{ codigo: string, nombre: string, unidad: string }>,
 *     puntos: Array<{ clave: string, etiqueta: string, valores: Object<string, number|null> }> }> }>}
 */
export async function generarIndicadores(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/indicadores`);
  return data;
}

export const indicadorEventoService = {
  generarIndicadores,
};
