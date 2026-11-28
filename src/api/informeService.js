import { httpClient } from './httpClient';
import {
  nombreArchivoDeCabecera,
  nombreRespaldo,
  normalizarInforme,
  normalizarTipos,
} from '../features/informes/informeUtils';

/**
 * @file informeService.js
 * @description Cliente de la API de informes parametrizables (HU-30: CU-26, RF52, RF53). Usa el `httpClient`
 * compartido, que agrega el token JWT. Todos los endpoints exigen `REPORTES_VER`, `EVENTOS_EDITAR` o administrador
 * (403 si no).
 * @module api/informeService
 */

/**
 * Tipos de información disponibles, con la fecha a la que se aplica el rango, si admiten el filtro de tipo de
 * actividad y sus columnas.
 * Endpoint: GET /api/v1/informes/tipos
 * @returns {Promise<Array<{ codigo: string, titulo: string, descripcion: string, campoFecha: string,
 *   admiteTipoActividad: boolean, columnas: Array<{ clave: string, titulo: string, tipo: string, sumable: boolean }> }>>}
 */
export async function listarTipos() {
  const { data } = await httpClient.get('/informes/tipos');
  return normalizarTipos(data);
}

/**
 * Genera el informe con los parámetros indicados (Criterio 1). Si los filtros no arrojan resultados llega con
 * `hayDatos=false` y `mensaje` (Criterio 2), sin error.
 * - 400 si los parámetros no son válidos; 404 si el evento o el tipo de evento no existen.
 * - 422 `INFORME_DEMASIADO_GRANDE` si supera el máximo de registros.
 * Endpoint: POST /api/v1/informes/generar
 * @param {{ tipo: string, eventoId?: number, semestre?: string, tipoEventoId?: number, fechaDesde?: string,
 *   fechaHasta?: string, tipoActividad?: string, columnas?: string[] }} parametros
 */
export async function generarInforme(parametros) {
  const { data } = await httpClient.post('/informes/generar', parametros);
  return normalizarInforme(data);
}

/**
 * Exporta el informe a PDF o Excel (Criterio 3). Se pide como `blob` porque el endpoint exige el token. Si falla,
 * axios entrega el cuerpo del error también como Blob: se convierte a JSON para leer `codigo` y `message`
 * (`INFORME_SIN_DATOS`, `EXPORTACION_INFORME_FALLIDA`, Criterio 4).
 * Endpoint: POST /api/v1/informes/exportar?formato=pdf|excel
 * @param {Object} parametros - Los mismos del informe generado.
 * @param {'pdf'|'excel'} formato
 * @returns {Promise<{ archivo: Blob, nombre: string }>}
 */
export async function exportarInforme(parametros, formato) {
  try {
    const respuesta = await httpClient.post('/informes/exportar', parametros, {
      params: { formato },
      responseType: 'blob',
      // Un informe grande puede tardar más que las demás peticiones.
      timeout: 120000,
    });
    const archivo = respuesta.data;
    if (!archivo || (typeof archivo.size === 'number' && archivo.size === 0)) {
      const err = new Error('El servidor devolvió un archivo vacío.');
      err.response = { status: 500, data: { codigo: 'EXPORTACION_INFORME_FALLIDA', message: err.message } };
      throw err;
    }
    const nombre = nombreArchivoDeCabecera(
      respuesta.headers?.['content-disposition'],
      nombreRespaldo(parametros?.tipo, formato)
    );
    return { archivo, nombre };
  } catch (err) {
    const datos = err?.response?.data;
    if (datos && typeof Blob !== 'undefined' && datos instanceof Blob) {
      try {
        err.response.data = JSON.parse(await datos.text());
      } catch {
        err.response.data = {};
      }
    }
    throw err;
  }
}

/** Agrupa las funciones para poder inyectar una API simulada en Storybook. */
export const informeService = {
  listarTipos,
  generarInforme,
  exportarInforme,
};
