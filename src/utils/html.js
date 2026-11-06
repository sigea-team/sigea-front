/**
 * @file html.js
 * @description Utilidades para insertar texto en el HTML de las alertas de SweetAlert2 (`html:`), que
 * interpreta su contenido como marcado. Todo dato que venga del usuario o del backend (nombres de
 * criterios, de personas, etc.) debe pasar por `escaparHtml` antes de interpolarse.
 * @module utils/html
 */

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Escapa los caracteres especiales de HTML para que el texto se muestre literal y no como marcado.
 * @param {unknown} texto
 * @returns {string}
 */
export function escaparHtml(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}
