/**
 * @file evaluacionUtils.js
 * @description Utilidades y lógica de negocio para la gestión de evaluaciones de propuestas académicas (HU-17).
 *
 * Implementa las reglas asociadas a los cuatro criterios de aceptación:
 *  - Criterio 1: Cálculo automático de puntuación ponderada aplicando los pesos de la rúbrica.
 *  - Criterio 2: Validación de completitud obligatoria de todos los criterios de la rúbrica.
 *  - Criterio 3: Verificación de estado completo vs incompleto de una propuesta con evaluaciones pendientes.
 *  - Criterio 4: Detección de periodo de evaluación cerrado (bloqueo de edición) o abierto (recalculo permitido).
 *
 * @module features/evaluaciones/evaluacionUtils
 */

/**
 * Escala de calificación permitida según RF de rúbricas.
 */
export const ESCALA_MINIMA = 0.0;
export const ESCALA_MAXIMA = 10.0;

/**
 * Umbrales de clasificación de propuestas evaluadas.
 */
export const UMBRAL_APROBADA = 7.0;
export const UMBRAL_APROBADA_CON_AJUSTES = 5.0;

/**
 * Determina la clasificación cualitativa de una propuesta según su puntuación ponderada (HU-17).
 *
 * @param {number|string|null|undefined} puntuacion - Puntuación ponderada en escala de 0 a 10.
 * @returns {'aprobada' | 'aprobada_con_ajustes' | 'rechazada' | 'pendiente'}
 */
export function determinarClasificacion(puntuacion) {
  if (puntuacion === null || puntuacion === undefined || isNaN(Number(puntuacion))) {
    return 'pendiente';
  }
  const valor = Number(puntuacion);
  if (valor >= UMBRAL_APROBADA) {
    return 'aprobada';
  }
  if (valor >= UMBRAL_APROBADA_CON_AJUSTES) {
    return 'aprobada_con_ajustes';
  }
  return 'rechazada';
}

/**
 * Retorna las propiedades visuales y etiqueta en español de una clasificación.
 *
 * @param {string} clasificacion
 * @returns {{ label: string, color: string, badgeClass: string }}
 */
export function obtenerConfiguracionClasificacion(clasificacion) {
  switch (clasificacion?.toLowerCase()) {
    case 'aprobada':
      return {
        label: 'Aprobada',
        color: '#107e3e',
        badgeClass: 'bg-[#ecfdf3] text-[#027a48] border-[#a6f4c5]',
      };
    case 'aprobada_con_ajustes':
      return {
        label: 'Aprobada con Ajustes',
        color: '#b54708',
        badgeClass: 'bg-[#fffaeb] text-[#b54708] border-[#fedf89]',
      };
    case 'rechazada':
      return {
        label: 'Rechazada',
        color: '#b42318',
        badgeClass: 'bg-[#fef3f2] text-[#b42318] border-[#fecdca]',
      };
    default:
      return {
        label: 'Pendiente de Evaluación',
        color: '#5b5f66',
        badgeClass: 'bg-[#f7f7f8] text-[#5b5f66] border-[#e5e7ea]',
      };
  }
}

/**
 * Calcula la puntuación ponderada a partir de las calificaciones y los criterios de la rúbrica (Criterio 1).
 * Formula: sum(calificacion_i * (pesoPorcentual_i / 100))
 *
 * @param {Array<{ criterioId: number|string, calificacion: number|string }>} calificaciones
 * @param {Array<{ id: number|string, pesoPorcentual: number|string }>} criterios
 * @returns {number|null} Puntuación ponderada redondeada a 2 decimales, o null si no hay datos.
 */
export function calcularPuntuacionPonderada(calificaciones = [], criterios = []) {
  if (!Array.isArray(calificaciones) || calificaciones.length === 0) return null;
  if (!Array.isArray(criterios) || criterios.length === 0) return null;

  const criteriosPorId = new Map(
    criterios.map((c) => [String(c.id || c.criterioId), Number(c.pesoPorcentual || 0)])
  );

  let sumaPonderada = 0;
  let sumaPesos = 0;

  for (const cal of calificaciones) {
    const cid = String(cal.criterioId);
    if (!criteriosPorId.has(cid)) continue;

    const nota = Number(cal.calificacion);
    if (isNaN(nota) || nota < ESCALA_MINIMA || nota > ESCALA_MAXIMA) continue;

    const peso = criteriosPorId.get(cid);
    sumaPonderada += nota * (peso / 100);
    sumaPesos += peso;
  }

  if (sumaPesos === 0) return null;

  // Redondear a 2 decimales
  return Math.round(sumaPonderada * 100) / 100;
}

/**
 * Valida que todos los criterios de la rúbrica se encuentren calificados (Criterio 2).
 *
 * @param {Array<{ criterioId: number|string, calificacion: any }>} calificaciones
 * @param {Array<{ id: number|string, nombre: string }>} criterios
 * @returns {{ valido: boolean, criteriosFaltantes: string[], errores: Record<string, string> }}
 */
export function validarEvaluacionCompleta(calificaciones = [], criterios = []) {
  const criteriosFaltantes = [];
  const errores = {};

  if (!Array.isArray(criterios) || criterios.length === 0) {
    return { valido: false, criteriosFaltantes: ['No hay criterios configurados en la rúbrica.'], errores };
  }

  const califsMap = new Map();
  if (Array.isArray(calificaciones)) {
    calificaciones.forEach((c) => {
      califsMap.set(String(c.criterioId), c.calificacion);
    });
  }

  for (const criterio of criterios) {
    const cid = String(criterio.id || criterio.criterioId);
    const nombre = criterio.nombre || `Criterio #${cid}`;
    const valor = califsMap.get(cid);

    if (valor === undefined || valor === null || valor === '' || isNaN(Number(valor))) {
      criteriosFaltantes.push(nombre);
      errores[cid] = 'Debe asignar una calificación entre 0.0 y 10.0 para este criterio.';
      continue;
    }

    const num = Number(valor);
    if (num < ESCALA_MINIMA || num > ESCALA_MAXIMA) {
      criteriosFaltantes.push(nombre);
      errores[cid] = `La calificación debe estar entre ${ESCALA_MINIMA} y ${ESCALA_MAXIMA}.`;
    }
  }

  return {
    valido: criteriosFaltantes.length === 0,
    criteriosFaltantes,
    errores,
  };
}

/**
 * Verifica si el periodo de evaluación de una convocatoria ya cerró (Criterio 4).
 * Si la fecha de cierre es anterior a la fecha actual, la evaluación está cerrada y no se puede modificar.
 *
 * @param {string|Date|null|undefined} fechaCierre - Fecha y hora de cierre de la convocatoria.
 * @returns {boolean} true si el periodo ya finalizó (cerrado).
 */
export function esPeriodoCerrado(fechaCierre) {
  if (!fechaCierre) return false;
  const fecha = fechaCierre instanceof Date ? fechaCierre : new Date(fechaCierre);
  if (isNaN(fecha.getTime())) return false;
  return fecha.getTime() < Date.now();
}

/**
 * Evalúa si una asignación de evaluación puede ser modificada por el evaluador (Criterio 4).
 * - Si está pendiente o en proceso -> siempre se puede calificar.
 * - Si está completada pero el periodo sigue abierto -> se puede modificar (recalcula puntuación).
 * - Si está completada y el periodo está cerrado -> bloqueado contra modificaciones.
 *
 * @param {Object} asignacion
 * @param {string} asignacion.estado - 'pendiente' | 'en_proceso' | 'completada'
 * @param {string|Date} [asignacion.fechaCierre] - Fecha límite de evaluación/convocatoria.
 * @returns {{ puedeEditar: boolean, motivo: string|null }}
 */
export function puedeModificarEvaluacion(asignacion) {
  if (!asignacion) {
    return { puedeEditar: false, motivo: 'Asignación no encontrada.' };
  }

  const estado = asignacion.estado?.toLowerCase();

  if (estado !== 'completada') {
    return { puedeEditar: true, motivo: null };
  }

  // Ya fue completada: verificar fecha de cierre
  if (esPeriodoCerrado(asignacion.fechaCierre)) {
    return {
      puedeEditar: false,
      motivo: 'La evaluación ya fue enviada y el periodo de evaluación está cerrado. No se puede modificar (Criterio 4).',
    };
  }

  return {
    puedeEditar: true,
    motivo: 'La evaluación puede ser actualizada mientras el periodo permanezca abierto. Se recalculará la puntuación.',
  };
}

/**
 * Formatea un valor numérico de calificación o puntuación a formato institucional (ej: 8.50).
 *
 * @param {number|string|null|undefined} valor
 * @returns {string}
 */
export function formatearPuntuacion(valor) {
  if (valor === null || valor === undefined || valor === '' || isNaN(Number(valor))) {
    return '—';
  }
  return Number(valor).toFixed(2);
}
