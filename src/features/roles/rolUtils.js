/**
 * @file rolUtils.js
 * @description Reglas puras de la administración de roles y permisos (HU-02).
 * @module features/roles/rolUtils
 */

import { PERMISO_EVALUAR } from '../../utils/permisos';

/** Nombres legibles de los módulos del catálogo de permisos. */
export const ETIQUETAS_MODULO = {
  ROLES: 'Roles y permisos',
  USUARIOS: 'Usuarios',
  EVENTOS: 'Eventos',
  CONVOCATORIAS: 'Convocatorias',
  PROPUESTAS: 'Propuestas',
  EVALUACION: 'Evaluación de propuestas',
  AGENDA: 'Agenda y actividades',
  INSCRIPCIONES: 'Inscripciones',
  ASISTENCIA: 'Asistencia',
  CERTIFICADOS: 'Certificados',
  REPORTES: 'Reportes',
  AUDITORIA: 'Auditoría',
};

/**
 * Agrupa el catálogo de permisos por módulo, ordenado por nombre de módulo y código.
 * @param {Array<{ id: number, codigo: string, modulo: string, descripcion?: string }>} permisos
 * @returns {Array<{ modulo: string, etiqueta: string, permisos: Array<Object> }>}
 */
export function agruparPermisosPorModulo(permisos = []) {
  const grupos = new Map();
  for (const p of Array.isArray(permisos) ? permisos : []) {
    const modulo = p.modulo || 'OTROS';
    if (!grupos.has(modulo)) grupos.set(modulo, []);
    grupos.get(modulo).push(p);
  }
  return [...grupos.entries()]
    .map(([modulo, lista]) => ({
      modulo,
      etiqueta: ETIQUETAS_MODULO[modulo] || modulo,
      permisos: [...lista].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo))),
    }))
    .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
}

/**
 * Indica si un rol habilita a sus usuarios como evaluadores (tiene el permiso PROPUESTAS_EVALUAR).
 * @param {{ permisos?: Array<{ codigo: string }> }} rol
 * @returns {boolean}
 */
export function esRolEvaluador(rol) {
  return Array.isArray(rol?.permisos) && rol.permisos.some((p) => p?.codigo === PERMISO_EVALUAR);
}

/**
 * Valida el formulario de rol antes de enviarlo.
 * @param {{ nombre: string, descripcion?: string }} datos
 * @returns {Record<string, string>} errores por campo (vacío si es válido).
 */
export function validarRol({ nombre = '', descripcion = '' } = {}) {
  const errores = {};
  const n = nombre.trim();
  if (!n) errores.nombre = 'El nombre del rol es obligatorio.';
  else if (n.length > 50) errores.nombre = 'El nombre no puede superar los 50 caracteres.';
  if (descripcion.trim().length > 255) errores.descripcion = 'La descripción no puede superar los 255 caracteres.';
  return errores;
}

/**
 * Extrae un mensaje legible de un error de la API.
 * @param {any} err
 * @param {string} porDefecto
 * @returns {string}
 */
export function mensajeErrorApi(err, porDefecto) {
  const data = err?.response?.data;
  if (data && typeof data === 'object' && data.message) return data.message;
  if (err?.response?.status === 403) return 'No tienes permiso para realizar esta operación.';
  if (!err?.response) return 'No fue posible conectar con el servidor. Intenta de nuevo.';
  return porDefecto;
}
