/**
 * @file auditoriaUtils.js
 * @description Funciones auxiliares de presentación para el log de auditoría (HU-03).
 * @module features/auditoria/auditoriaUtils
 */

/**
 * Formatea la fecha y hora de un registro en formato local colombiano.
 * @param {string|null} fechaIso - Ej. "2026-09-28T10:15:30".
 * @returns {{ fecha: string, hora: string }}
 */
export function formatearFechaHora(fechaIso) {
  if (!fechaIso) return { fecha: '—', hora: '' };
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return { fecha: fechaIso, hora: '' };
  return {
    fecha: fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
    hora: fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

/**
 * Convierte el campo `detalle` (JSON en texto) en un objeto. Si no es JSON válido,
 * lo devuelve como texto plano para no perder la evidencia.
 * @param {string|null} detalle
 * @returns {{ tipo: 'vacio' } | { tipo: 'objeto', valor: Object } | { tipo: 'texto', valor: string }}
 */
export function parsearDetalle(detalle) {
  if (!detalle) return { tipo: 'vacio' };
  try {
    const valor = JSON.parse(detalle);
    if (valor && typeof valor === 'object') return { tipo: 'objeto', valor };
    return { tipo: 'texto', valor: String(valor) };
  } catch {
    return { tipo: 'texto', valor: detalle };
  }
}

/**
 * Representa cualquier valor del detalle como texto legible.
 * @param {unknown} valor
 * @returns {string}
 */
export function valorLegible(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (Array.isArray(valor)) return valor.length ? valor.join(', ') : '(ninguno)';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'object') return JSON.stringify(valor);
  return String(valor);
}

/**
 * Construye las filas de comparación "antes / después" para un detalle que contiene
 * esas dos claves. Marca las filas cuyo valor cambió.
 * @param {Object|undefined} antes
 * @param {Object|undefined} despues
 * @returns {Array<{ campo: string, antes: unknown, despues: unknown, cambio: boolean }>}
 */
export function compararAntesDespues(antes, despues) {
  const a = antes && typeof antes === 'object' ? antes : {};
  const d = despues && typeof despues === 'object' ? despues : {};
  const campos = Array.from(new Set([...Object.keys(a), ...Object.keys(d)]));
  return campos.map((campo) => ({
    campo,
    antes: a[campo],
    despues: d[campo],
    cambio: JSON.stringify(a[campo]) !== JSON.stringify(d[campo]),
  }));
}

/**
 * Convierte "rolInicial" o "fecha_hora" en "Rol inicial" / "Fecha hora".
 * @param {string} clave
 * @returns {string}
 */
export function etiquetaCampo(clave) {
  const texto = String(clave)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
