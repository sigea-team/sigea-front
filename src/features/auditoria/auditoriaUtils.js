/**
 * @file auditoriaUtils.js
 * @description Funciones auxiliares de presentación para el log de auditoría (HU-03).
 * @module features/auditoria/auditoriaUtils
 */

/** Textos de presentación para valores ausentes o inválidos. */
export const TEXTO_SIN_VALOR = '—';
export const TEXTO_FECHA_INVALIDA = 'Fecha no válida';
export const TEXTO_LISTA_VACIA = '(ninguno)';

/**
 * Formatea la fecha y hora de un registro en formato local colombiano.
 * @param {string|null} fechaIso - Ej. "2026-09-28T10:15:30".
 * @returns {{ fecha: string, hora: string }}
 */
export function formatearFechaHora(fechaIso) {
  if (!fechaIso) return { fecha: TEXTO_SIN_VALOR, hora: '' };
  const fecha = typeof fechaIso === 'string' ? new Date(fechaIso) : new Date(NaN);
  // Un valor corrupto no se muestra "crudo": se indica que la fecha no es válida.
  if (Number.isNaN(fecha.getTime())) return { fecha: TEXTO_FECHA_INVALIDA, hora: '' };
  return {
    fecha: fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
    hora: fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

/**
 * Indica si un valor es un objeto "plano" ({ ... }), excluyendo arreglos y null.
 * @param {unknown} valor
 * @returns {boolean}
 */
export function esObjetoPlano(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

/**
 * Clasifica el campo `detalle` (JSON en texto) para decidir cómo mostrarlo:
 * - "comparativo": objeto con "antes" y/o "despues", ambos objetos planos.
 * - "objeto": objeto plano con campos sueltos.
 * - "no_estructurado": JSON válido con otra forma (arreglo, número, "antes" que no es objeto...).
 * - "texto": no es JSON; se muestra tal cual para no perder la evidencia.
 * - "vacio": sin detalle.
 *
 * @param {string|null} detalle
 * @returns {{ tipo: 'vacio' } | { tipo: 'comparativo', antes?: Object, despues?: Object }
 *   | { tipo: 'objeto', valor: Object } | { tipo: 'no_estructurado', valor: unknown }
 *   | { tipo: 'texto', valor: string }}
 */
export function parsearDetalle(detalle) {
  if (detalle === null || detalle === undefined || detalle === '') return { tipo: 'vacio' };
  if (typeof detalle !== 'string') return { tipo: 'no_estructurado', valor: detalle };

  let valor;
  try {
    valor = JSON.parse(detalle);
  } catch {
    return { tipo: 'texto', valor: detalle };
  }

  if (!esObjetoPlano(valor)) return { tipo: 'no_estructurado', valor };

  const tieneAntes = 'antes' in valor;
  const tieneDespues = 'despues' in valor;
  if (tieneAntes || tieneDespues) {
    const antesValido = !tieneAntes || esObjetoPlano(valor.antes);
    const despuesValido = !tieneDespues || esObjetoPlano(valor.despues);
    if (antesValido && despuesValido) {
      return { tipo: 'comparativo', antes: valor.antes, despues: valor.despues };
    }
    return { tipo: 'no_estructurado', valor };
  }

  return Object.keys(valor).length ? { tipo: 'objeto', valor } : { tipo: 'vacio' };
}

/**
 * Representa cualquier valor del detalle como texto legible.
 * @param {unknown} valor
 * @returns {string}
 */
export function valorLegible(valor) {
  if (valor === null || valor === undefined || valor === '') return TEXTO_SIN_VALOR;
  if (Array.isArray(valor)) return valor.length ? valor.join(', ') : TEXTO_LISTA_VACIA;
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
  const a = esObjetoPlano(antes) ? antes : {};
  const d = esObjetoPlano(despues) ? despues : {};
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

/**
 * Normaliza los datos de paginación que llegan del backend para que la interfaz nunca
 * calcule valores inconsistentes (totalPaginas en 0, página fuera de rango, etc.).
 * @param {{ pagina?: number, tamano?: number, totalElementos?: number, totalPaginas?: number }} p
 * @param {number} tamanoPorDefecto
 * @returns {{ pagina: number, tamano: number, totalElementos: number, totalPaginas: number }}
 */
export function normalizarPaginacion(p, tamanoPorDefecto) {
  const entero = (v, min) => (Number.isFinite(Number(v)) ? Math.max(min, Math.floor(Number(v))) : min);
  const tamano = entero(p?.tamano ?? tamanoPorDefecto, 1);
  const totalElementos = entero(p?.totalElementos, 0);
  const totalPaginas = Math.max(1, entero(p?.totalPaginas, 1), Math.ceil(totalElementos / tamano));
  const pagina = Math.min(entero(p?.pagina, 0), totalPaginas - 1);
  return { pagina, tamano, totalElementos, totalPaginas };
}

/** Fecha de hoy en formato yyyy-MM-dd (zona horaria local), para limitar los selectores. */
export function hoyIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
