import { esAdministrador, tienePermiso } from '../../utils/permisos';

/**
 * @file historialPeriodoUtils.js
 * @description Funciones utilitarias y reglas de validación para la consulta del historial de participación,
 * análisis por periodo académico y comparación entre semestres (HU-27).
 * @module features/historialPeriodo/historialPeriodoUtils
 */

/** Expresión regular para el formato estándar de semestre académico: AAAA-1 o AAAA-2 */
export const REGEX_SEMESTRE = /^\d{4}-[12]$/;

/**
 * Valida si un semestre cumple con el formato AAAA-1 o AAAA-2.
 * Un valor vacío o nulo se considera no especificado (válido si el filtro es opcional).
 * @param {string|null|undefined} semestre
 * @returns {boolean}
 */
export function validarFormatoSemestre(semestre) {
  if (!semestre || typeof semestre !== 'string' || !semestre.trim()) return true;
  return REGEX_SEMESTRE.test(semestre.trim());
}

/**
 * Valida un rango de fechas. Retorna un mensaje de error si la fecha de inicio es posterior a la final.
 * @param {string|null|undefined} fechaDesde - Formato ISO YYYY-MM-DD
 * @param {string|null|undefined} fechaHasta - Formato ISO YYYY-MM-DD
 * @returns {string|null} Mensaje de error o null si es válido
 */
export function validarRangoFechas(fechaDesde, fechaHasta) {
  if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
    return 'La fecha inicial del rango no puede ser posterior a la fecha final.';
  }
  return null;
}

/**
 * Valida los semestres para la comparación (Criterio 5).
 * @param {string|null|undefined} semestreA
 * @param {string|null|undefined} semestreB
 * @returns {string|null} Mensaje de error o null si es válido
 */
export function validarSemestresComparacion(semestreA, semestreB) {
  const a = semestreA?.trim();
  const b = semestreB?.trim();
  if (!a) return 'Seleccione el primer semestre a comparar.';
  if (!b) return 'Seleccione el segundo semestre a comparar.';
  if (!REGEX_SEMESTRE.test(a)) return 'El primer semestre debe tener el formato AAAA-1 o AAAA-2.';
  if (!REGEX_SEMESTRE.test(b)) return 'El segundo semestre debe tener el formato AAAA-1 o AAAA-2.';
  if (a === b) return 'Seleccione dos semestres distintos para comparar.';
  return null;
}

/**
 * Configuración visual y de texto para los roles de participación (Criterio 1).
 */
export const ROLES_PARTICIPACION = {
  PARTICIPANTE: {
    label: 'Participante',
    badgeClass: 'text-blue-800 bg-blue-50 border-blue-200',
    dotClass: 'bg-blue-500',
    descripcion: 'Inscrito al evento o a sus actividades',
  },
  PONENTE: {
    label: 'Ponente',
    badgeClass: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    dotClass: 'bg-emerald-500',
    descripcion: 'Ponente en actividad o propuesta aprobada',
  },
  CONFERENCISTA: {
    label: 'Conferencista',
    badgeClass: 'text-purple-800 bg-purple-50 border-purple-200',
    dotClass: 'bg-purple-500',
    descripcion: 'Conferencista invitado del evento',
  },
  AUTOR: {
    label: 'Autor',
    badgeClass: 'text-amber-800 bg-amber-50 border-amber-200',
    dotClass: 'bg-amber-500',
    descripcion: 'Autor o coautor de propuesta postulada',
  },
};

/**
 * Configuración visual de las tendencias comparativas entre semestres (Criterio 5).
 */
export const TENDENCIAS = {
  AUMENTO: {
    codigo: 'AUMENTO',
    label: 'Aumento',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icono: 'TrendingUp',
    signo: '+',
  },
  DISMINUCION: {
    codigo: 'DISMINUCION',
    label: 'Disminución',
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
    icono: 'TrendingDown',
    signo: '-',
  },
  SIN_CAMBIO: {
    codigo: 'SIN_CAMBIO',
    label: 'Sin cambio',
    badgeClass: 'text-ink-600 bg-surface-muted border-border',
    icono: 'Minus',
    signo: '=',
  },
  NO_COMPARABLE: {
    codigo: 'NO_COMPARABLE',
    label: 'No comparable',
    badgeClass: 'text-slate-600 bg-slate-50 border-slate-200',
    icono: 'HelpCircle',
    signo: '—',
  },
};

/**
 * Obtiene la configuración de una tendencia.
 * @param {string} tendencia
 */
export function configuracionTendencia(tendencia) {
  return TENDENCIAS[tendencia] || TENDENCIAS.NO_COMPARABLE;
}

/**
 * Obtiene la configuración de un rol de participación.
 * @param {string} rol
 */
export function configuracionRol(rol) {
  return ROLES_PARTICIPACION[rol] || {
    label: rol || 'Participante',
    badgeClass: 'text-ink-600 bg-surface-muted border-border',
    dotClass: 'bg-ink-300',
    descripcion: '',
  };
}

/**
 * Formatea un valor numérico o decimal para visualización.
 * @param {number|string|null|undefined} valor
 * @param {number|null} [decimales=null] - Cantidad exacta de decimales (o null para auto hasta 2)
 * @returns {string}
 */
export function formatearNumero(valor, decimales = null) {
  if (valor === null || valor === undefined || valor === '') return '—';
  const num = Number(valor);
  if (Number.isNaN(num)) return String(valor);
  const opciones =
    decimales !== null
      ? { minimumFractionDigits: decimales, maximumFractionDigits: decimales }
      : { maximumFractionDigits: 2 };
  return num.toLocaleString('es-CO', opciones);
}

/**
 * Formatea un valor porcentual.
 * @param {number|string|null|undefined} valor
 * @returns {string}
 */
export function formatearPorcentaje(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  const num = Number(valor);
  if (Number.isNaN(num)) return '—';
  return `${formatearNumero(num)}%`;
}

/**
 * Formatea una variación o diferencia agregando prefijo + si es positivo.
 * @param {number|string|null|undefined} diferencia
 * @returns {string}
 */
export function formatearDiferencia(diferencia) {
  if (diferencia === null || diferencia === undefined || diferencia === '') return '—';
  const num = Number(diferencia);
  if (Number.isNaN(num)) return '—';
  if (num > 0) return `+${formatearNumero(num)}`;
  return formatearNumero(num);
}

/**
 * Interpreta errores retornados por la API de historial y periodos académicos.
 * @param {any} error
 * @param {string} [fallback='Ocurrió un error al procesar la consulta.']
 * @returns {{ mensaje: string, status?: number, codigo?: string }}
 */
export function interpretarError(error, fallback = 'Ocurrió un error al procesar la consulta.') {
  const data = error?.response?.data;
  const status = error?.response?.status;
  if (data && typeof data === 'object') {
    const mensaje = data.message || data.mensaje || fallback;
    const codigo = data.codigo || data.code;
    return { mensaje, status, codigo };
  }
  return { mensaje: error?.message || fallback, status };
}

/**
 * Indica si el usuario en sesión tiene permisos para ver el módulo de historial e indicadores.
 * En backend: hasAnyAuthority('EVENTOS_VER', 'REPORTES_VER', 'ROLE_ADMIN', 'ADMIN')
 * @param {Object|null|undefined} usuario
 * @returns {boolean}
 */
export function veHistorialPeriodo(usuario) {
  return (
    esAdministrador(usuario) ||
    tienePermiso(usuario, 'EVENTOS_VER') ||
    tienePermiso(usuario, 'REPORTES_VER')
  );
}
