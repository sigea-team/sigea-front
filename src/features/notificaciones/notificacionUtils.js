/**
 * @file notificacionUtils.js
 * @description Utilidades de la campana de notificaciones (HU-11).
 * @module features/notificaciones/notificacionUtils
 */

/** Cada cuánto se consulta el número de no leídas mientras la página está abierta. */
export const INTERVALO_CONTEO_MS = 60000;

/** Cuántas notificaciones se muestran al abrir la campana. */
export const LIMITE_PANEL = 10;

/**
 * Tiempo transcurrido en lenguaje natural ("hace 5 min", "hace 2 h", "hace 3 días").
 * @param {string|Date} fecha
 * @param {number} [ahora=Date.now()]
 * @returns {string}
 */
export function tiempoRelativo(fecha, ahora = Date.now()) {
  const d = fecha ? new Date(fecha) : null;
  if (!d || isNaN(d.getTime())) return '';
  const minutos = Math.floor((ahora - d.getTime()) / 60000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Ruta del frontend a la que lleva una notificación al abrirla, según el recurso relacionado.
 * Las convocatorias abren la vista pública, que pueden ver todos los usuarios.
 * @param {{ entidad?: string, entidadId?: number }} notificacion
 * @returns {string|null}
 */
export function rutaDeNotificacion(notificacion) {
  if (notificacion?.entidad === 'convocatorias' && notificacion.entidadId) {
    return `/convocatorias-publicas?convocatoria=${notificacion.entidadId}`;
  }
  return null;
}

/** Máximo que muestra el contador de la campana; por encima se ve "9+" (cabe en el círculo de 18px). */
export const LIMITE_VISUAL_CONTADOR = 9;

/**
 * Texto del contador de la campana (máximo "9+").
 * @param {number} cantidad
 * @returns {string}
 */
export function textoContador(cantidad) {
  return cantidad > LIMITE_VISUAL_CONTADOR ? `${LIMITE_VISUAL_CONTADOR}+` : String(cantidad);
}
