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
 * HU-15: escala de calificación de un criterio. Cada criterio de la rúbrica puede tener la suya
 * (por ejemplo 1 a 5); si no la trae, se usa la escala general 0 a 10.
 *
 * @param {{ escalaMinima?: number|string, escalaMaxima?: number|string }|null|undefined} criterio
 * @returns {{ minima: number, maxima: number }}
 */
export function escalaDeCriterio(criterio) {
  const min = Number(criterio?.escalaMinima);
  const max = Number(criterio?.escalaMaxima);
  const valida =
    criterio?.escalaMinima !== null && criterio?.escalaMinima !== undefined && criterio?.escalaMinima !== '' &&
    criterio?.escalaMaxima !== null && criterio?.escalaMaxima !== undefined && criterio?.escalaMaxima !== '' &&
    !isNaN(min) && !isNaN(max) && max > min;
  return valida ? { minima: min, maxima: max } : { minima: ESCALA_MINIMA, maxima: ESCALA_MAXIMA };
}

/**
 * HU-15: lleva una nota de la escala de su criterio a la escala 0 - 10, igual que el backend al ponderar.
 * Con la escala 0 - 10 la nota no cambia.
 *
 * @param {number} nota
 * @param {{ minima: number, maxima: number }} escala
 * @returns {number}
 */
export function normalizarADiez(nota, escala) {
  if (escala.minima === ESCALA_MINIMA && escala.maxima === ESCALA_MAXIMA) return nota;
  return ((nota - escala.minima) * ESCALA_MAXIMA) / (escala.maxima - escala.minima);
}

/** Indica si una nota está dentro de la escala de su criterio. */
export function notaEnEscala(nota, escala) {
  return !isNaN(nota) && nota >= escala.minima && nota <= escala.maxima;
}

/** Indica si un número tiene como máximo un decimal (2.5 sí, 0.25 no). */
const tieneUnDecimal = (n) => Math.abs(Math.round(n * 10) - n * 10) < 1e-9;

/**
 * Decimales con que se trabaja la escala: 1 si sus extremos tienen como máximo un decimal (0 - 10, 1 - 5,
 * 2.5 - 7.5) y 2 si alguno tiene dos (0.25 - 4.75). El backend admite hasta 2 decimales.
 *
 * @param {{ minima: number, maxima: number }} escala
 * @returns {1|2}
 */
export function decimalesDeEscala(escala) {
  return tieneUnDecimal(escala.minima) && tieneUnDecimal(escala.maxima) ? 1 : 2;
}

/**
 * Un extremo de la escala con los decimales de la escala: 1 → "1.0", 0.25 → "0.25".
 *
 * @param {number} valor
 * @param {{ minima: number, maxima: number }} escala
 * @returns {string}
 */
export function formatearValorEscala(valor, escala) {
  return valor.toFixed(decimalesDeEscala(escala));
}

/**
 * Escala para mostrar al evaluador, sin redondear sus extremos: { 1, 5 } → "1.0 – 5.0",
 * { 0.25, 4.75 } → "0.25 – 4.75".
 *
 * @param {{ minima: number, maxima: number }} escala
 * @returns {string}
 */
export function formatearEscala(escala) {
  return `${formatearValorEscala(escala.minima, escala)} – ${formatearValorEscala(escala.maxima, escala)}`;
}

/**
 * Paso del input de calificación. El navegador cuenta los pasos desde `min`, así que con una escala
 * 0.25 - 4.75 un paso de 0.1 rechazaría notas como 3; en ese caso se usa 0.01.
 *
 * @param {{ minima: number, maxima: number }} escala
 * @returns {string}
 */
export function pasoDeEscala(escala) {
  return decimalesDeEscala(escala) === 1 ? '0.1' : '0.01';
}

/**
 * Notas rápidas proporcionales a la escala del criterio (mínimo, 50 %, 70 %, 85 % y máximo).
 * En la escala 0 - 10 son 0, 5, 7, 8.5 y 10. Los extremos se usan exactos y los intermedios se
 * redondean a los decimales de la escala, así nunca quedan fuera de ella.
 *
 * @param {{ minima: number, maxima: number }} escala
 * @returns {number[]}
 */
export function notasRapidas(escala) {
  const factor = 10 ** decimalesDeEscala(escala);
  const rango = escala.maxima - escala.minima;
  const intermedios = [0.5, 0.7, 0.85].map((p) => Math.round((escala.minima + rango * p) * factor) / factor);
  return [...new Set([escala.minima, ...intermedios, escala.maxima])];
}

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
 * Formula: sum(calificacion_i * (pesoPorcentual_i / 100)), con cada calificación llevada a 0 - 10 si su
 * criterio usa otra escala (HU-15).
 *
 * @param {Array<{ criterioId: number|string, calificacion: number|string }>} calificaciones
 * @param {Array<{ id: number|string, pesoPorcentual: number|string }>} criterios
 * @returns {number|null} Puntuación ponderada redondeada a 2 decimales, o null si no hay datos.
 */
export function calcularPuntuacionPonderada(calificaciones = [], criterios = []) {
  if (!Array.isArray(calificaciones) || calificaciones.length === 0) return null;
  if (!Array.isArray(criterios) || criterios.length === 0) return null;

  const criteriosPorId = new Map(
    criterios.map((c) => [
      String(c.id || c.criterioId),
      { peso: Number(c.pesoPorcentual || 0), escala: escalaDeCriterio(c) },
    ])
  );

  let sumaPonderada = 0;
  let sumaPesos = 0;

  for (const cal of calificaciones) {
    const cid = String(cal.criterioId);
    if (!criteriosPorId.has(cid)) continue;

    const { peso, escala } = criteriosPorId.get(cid);
    const nota = Number(cal.calificacion);
    if (cal.calificacion === '' || cal.calificacion === null || !notaEnEscala(nota, escala)) continue;

    sumaPonderada += normalizarADiez(nota, escala) * (peso / 100);
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
    const escala = escalaDeCriterio(criterio);

    if (valor === undefined || valor === null || valor === '' || isNaN(Number(valor))) {
      criteriosFaltantes.push(nombre);
      errores[cid] = `Debe asignar una calificación entre ${formatearValorEscala(escala.minima, escala)} y ${formatearValorEscala(escala.maxima, escala)} para este criterio.`;
      continue;
    }

    // HU-15: cada criterio se califica dentro de su propia escala
    if (!notaEnEscala(Number(valor), escala)) {
      criteriosFaltantes.push(nombre);
      errores[cid] = `La calificación debe estar entre ${escala.minima} y ${escala.maxima}.`;
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

/**
 * Combina una fila de la bandeja con el detalle real de la asignación
 * (GET /evaluaciones/asignaciones/{id}): un elemento por criterio de la rúbrica activa,
 * con la calificación y las observaciones ya registradas por el evaluador, si existen.
 *
 * @param {Object} base - Fila de la bandeja ya normalizada.
 * @param {Object} detalle - AsignacionEvaluacionResponse del backend.
 * @returns {Object} Asignación en el formato de la vista de evaluaciones.
 */
export function combinarDetalleAsignacion(base, detalle) {
  if (!detalle) return base;

  const registradas = new Map(
    (detalle.evaluaciones || []).map((ev) => [String(ev.criterioId), ev])
  );

  const evaluaciones = (detalle.criterios || []).map((c) => {
    const ev = registradas.get(String(c.criterioId));
    return {
      evaluacionId: ev?.evaluacionId ?? null,
      asignacionId: detalle.asignacionId,
      criterioId: c.criterioId,
      nombreCriterio: c.nombre,
      pesoPorcentual: Number(c.pesoPorcentual),
      // HU-15: escala propia del criterio (si el backend no la envía se usa 0 - 10)
      escalaMinima: c.escalaMinima ?? ESCALA_MINIMA,
      escalaMaxima: c.escalaMaxima ?? ESCALA_MAXIMA,
      calificacion: ev?.calificacion ?? null,
      observaciones: ev?.observaciones || '',
      fechaEvaluacion: ev?.fechaEvaluacion ?? null,
    };
  });

  return {
    ...base,
    propuestaTitulo: detalle.propuestaTitulo ?? base.propuestaTitulo,
    propuestaResumen: detalle.propuestaResumen ?? base.propuestaResumen ?? null,
    autores: Array.isArray(detalle.autores) ? detalle.autores : base.autores || [],
    convocatoriaTitulo: detalle.convocatoriaTitulo ?? base.convocatoriaTitulo,
    fechaCierre: detalle.fechaCierre ?? null,
    estado: detalle.estado ?? base.estado,
    evaluaciones,
  };
}
