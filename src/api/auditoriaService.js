/**
 * @file auditoriaService.js
 * @description Cliente de la API del log de auditoría de operaciones críticas (HU-03, RF56).
 * Solo expone consultas: el backend no permite crear, modificar ni eliminar registros
 * desde la API (Criterio 3).
 * @module api/auditoriaService
 */

import { httpClient } from './httpClient';

/**
 * @typedef {Object} FiltrosAuditoria
 * @property {string} [correo]  - Parte del correo del usuario que ejecutó la operación.
 * @property {string} [accion]  - Código del tipo de operación (ej. ROL_ACTUALIZADO).
 * @property {string} [desde]   - Fecha inicial inclusiva (yyyy-MM-dd).
 * @property {string} [hasta]   - Fecha final inclusiva (yyyy-MM-dd).
 * @property {number} [pagina]  - Página a consultar, desde 0.
 * @property {number} [tamano]  - Registros por página (1 a 100).
 */

/**
 * @typedef {Object} RegistroAuditoria
 * @property {number} id
 * @property {string} fechaHora          - ISO local, ej. "2026-09-28T10:15:30".
 * @property {number|null} usuarioId
 * @property {string|null} usuarioCorreo
 * @property {string} usuarioNombre      - "Sistema" cuando no hay usuario asociado.
 * @property {string} accion             - Código del tipo de operación.
 * @property {string} accionDescripcion  - Texto legible del tipo de operación.
 * @property {string} entidad            - Tabla/recurso afectado (ej. "roles").
 * @property {number|null} entidadId
 * @property {string|null} detalle       - JSON con los datos afectados.
 */

/**
 * @typedef {Object} PaginaAuditoria
 * @property {RegistroAuditoria[]} contenido
 * @property {number} pagina
 * @property {number} tamano
 * @property {number} totalElementos
 * @property {number} totalPaginas
 */

/** Elimina los parámetros vacíos para no enviarlos al backend. */
function limpiarParametros(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
  );
}

/**
 * Consulta el log de auditoría con filtros y paginación (Criterio 2).
 * Endpoint: GET /api/v1/auditoria
 *
 * @param {FiltrosAuditoria} filtros
 * @returns {Promise<PaginaAuditoria>}
 */
export async function buscarAuditoria(filtros = {}) {
  const response = await httpClient.get('/auditoria', { params: limpiarParametros(filtros) });
  return response.data;
}

/**
 * Obtiene el catálogo de tipos de operación auditables para el filtro.
 * Endpoint: GET /api/v1/auditoria/tipos-operacion
 *
 * @returns {Promise<Array<{codigo: string, modulo: string, descripcion: string}>>}
 */
export async function obtenerTiposOperacion() {
  const response = await httpClient.get('/auditoria/tipos-operacion');
  return response.data;
}

/**
 * Servicio agrupado. Las páginas lo reciben por props para poder reemplazarlo
 * por datos simulados en Storybook.
 */
export const servicioAuditoria = {
  buscar: buscarAuditoria,
  tiposOperacion: obtenerTiposOperacion,
};

/**
 * Traduce un error de Axios a un mensaje legible para el usuario.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function mensajeErrorAuditoria(error) {
  const status = error?.response?.status;
  const mensajeBackend = error?.response?.data?.message;

  if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (status === 403) {
    return 'No tienes permiso para consultar la auditoría. Se requiere el permiso AUDITORIA_VER o el rol de administrador.';
  }
  if (mensajeBackend) return mensajeBackend;
  if (error?.code === 'ECONNABORTED' || !error?.response) {
    return 'No fue posible conectar con el servidor. Verifica que el backend esté en ejecución.';
  }
  return 'Ocurrió un error inesperado al consultar la auditoría.';
}
