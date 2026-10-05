/**
 * @file enlaceRecuperacion.js
 * @description La app usa HashRouter (GitHub Pages), así que sus rutas viven después del "#".
 * El backend arma el enlace del correo como `reset-password-base-url + /reset-password?token=…`.
 * Si esa base no termina en "#", el enlace llega como `…/sigea-front/reset-password?token=…`
 * y el router no lo reconoce. Esta función lo convierte a `…/sigea-front/#/reset-password?token=…`
 * antes de montar React, sin recargar la página.
 *
 * Nota: en GitHub Pages una ruta sin "#" responde 404 antes de cargar la app, por eso en el
 * backend se debe configurar APP_RESET_PASSWORD_BASE_URL terminando en "/#".
 *
 * @module utils/enlaceRecuperacion
 */

const RUTA_RESET = '/reset-password';

export function redirigirEnlaceRecuperacion() {
  if (typeof window === 'undefined') return;
  const { pathname, search, hash } = window.location;
  if (hash || !pathname.endsWith(RUTA_RESET)) return;

  const base = pathname.slice(0, -RUTA_RESET.length) || '/';
  const baseConBarra = base.endsWith('/') ? base : `${base}/`;
  window.history.replaceState(null, '', `${baseConBarra}#${RUTA_RESET}${search}`);
}
