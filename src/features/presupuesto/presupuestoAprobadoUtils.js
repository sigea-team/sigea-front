/**
 * @file presupuestoAprobadoUtils.js
 * @description Utilidades y validaciones para el presupuesto aprobado formalmente (HU-08: RF07).
 * Criterio 1: Guarda versión oficial vinculada al evento con monto (puede diferir del preliminar) y evidencia.
 * Criterio 2: Conserva versiones anteriores en un historial de cambios cronológico.
 * Criterio 3: Exige soporte documental obligatorio antes de confirmar el registro.
 * @module features/presupuesto/presupuestoAprobadoUtils
 */

import { formatearPesos, leerNumero } from './presupuestoUtils';

/** Límites de longitud y formato para presupuesto aprobado */
export const LIMITES_PRESUPUESTO_APROBADO = {
  resolucionOActa: 120,
  justificacion: 500,
  enterosValor: 14,
  decimales: 2,
};

/** Mensajes de validación */
export const MENSAJES_PRESUPUESTO_APROBADO = {
  montoObligatorio: 'El monto oficial aprobado es obligatorio.',
  montoInvalido: 'El monto aprobado debe ser un número válido, por ejemplo 15.000.000.',
  montoPositivo: 'El monto aprobado debe ser mayor a cero.',
  montoExcede: 'El monto aprobado supera el límite permitido.',
  evidenciaObligatoria: 'Debe adjuntar la evidencia documental de aprobación (acta, resolución o soporte firmado) antes de guardar.',
  motivoActualizacionObligatorio: 'Debe indicar el motivo o justificación de la actualización del presupuesto aprobado.',
};

/**
 * Valida los datos del formulario de presupuesto aprobado.
 * Criterio 3: Exige soporte / evidencia de aprobación obligatoria.
 *
 * @param {Object} form
 * @param {string|number} form.valorTotalAprobado
 * @param {File|string|null} form.evidencia - Archivo seleccionado o URL/nombre de evidencia existente
 * @param {string} [form.resolucionOActa]
 * @param {string} [form.justificacion]
 * @param {Object} [opciones]
 * @param {boolean} [opciones.esActualizacion=false] - Indica si es una nueva versión que actualiza a una anterior
 * @param {boolean} [opciones.conservarEvidenciaPrevia=false] - Si ya existía un archivo en la versión previa y no se reemplaza
 * @returns {Object} Errores por campo (vacío si es válido)
 */
export function validarPresupuestoAprobado(form, { esActualizacion = false, conservarEvidenciaPrevia = false } = {}) {
  const errores = {};

  // 1. Monto aprobado
  const monto = leerNumero(form.valorTotalAprobado);
  if (monto === null) {
    errores.valorTotalAprobado = MENSAJES_PRESUPUESTO_APROBADO.montoObligatorio;
  } else if (Number.isNaN(monto)) {
    errores.valorTotalAprobado = MENSAJES_PRESUPUESTO_APROBADO.montoInvalido;
  } else if (monto <= 0) {
    errores.valorTotalAprobado = MENSAJES_PRESUPUESTO_APROBADO.montoPositivo;
  } else if (Math.trunc(monto).toString().length > LIMITES_PRESUPUESTO_APROBADO.enterosValor) {
    errores.valorTotalAprobado = MENSAJES_PRESUPUESTO_APROBADO.montoExcede;
  }

  // 2. Criterio 3: Evidencia de aprobación OBLIGATORIA
  const evidenciaTexto = (form.evidenciaUrl || form.evidenciaNombre || '').trim();
  const tieneEvidencia = Boolean(
    form.evidencia ||
    (conservarEvidenciaPrevia && form.evidenciaUrlPrevia) ||
    evidenciaTexto
  );
  if (!tieneEvidencia) {
    errores.evidencia = MENSAJES_PRESUPUESTO_APROBADO.evidenciaObligatoria;
  } else if (evidenciaTexto.length > (LIMITES_PRESUPUESTO_APROBADO.evidenciaUrl || 255)) {
    errores.evidencia = 'La URL o soporte documental no puede superar los 255 caracteres.';
  }

  // 3. Criterio 2: Motivo o justificación al actualizar
  if (esActualizacion && !(form.justificacion || '').trim()) {
    errores.justificacion = MENSAJES_PRESUPUESTO_APROBADO.motivoActualizacionObligatorio;
  } else if ((form.justificacion || '').trim().length > LIMITES_PRESUPUESTO_APROBADO.justificacion) {
    errores.justificacion = `La justificación no puede superar ${LIMITES_PRESUPUESTO_APROBADO.justificacion} caracteres.`;
  }

  // 4. Resolución o acta (opcional, pero con límite de longitud)
  if ((form.resolucionOActa || '').trim().length > LIMITES_PRESUPUESTO_APROBADO.resolucionOActa) {
    errores.resolucionOActa = `El número de acta/resolución no puede superar ${LIMITES_PRESUPUESTO_APROBADO.resolucionOActa} caracteres.`;
  }

  return errores;
}

/**
 * Calcula la diferencia absoluta y porcentual entre el monto aprobado y el presupuesto preliminar (Criterio 1).
 *
 * @param {number|string} montoAprobado
 * @param {number|string} montoPreliminar
 * @returns {{
 *   diferencia: number,
 *   porcentaje: number|null,
 *   etiqueta: string,
 *   tipo: 'igual'|'mayor'|'menor'
 * }}
 */
export function compararConPreliminar(montoAprobado, montoPreliminar) {
  const aprobado = leerNumero(montoAprobado) ?? 0;
  const preliminar = Number(montoPreliminar) || 0;

  if (preliminar <= 0) {
    return {
      diferencia: aprobado,
      porcentaje: null,
      etiqueta: 'Sin preliminar de referencia',
      tipo: 'igual',
    };
  }

  const diferencia = Math.round((aprobado - preliminar) * 100) / 100;
  const porcentaje = Math.round(((diferencia / preliminar) * 100) * 10) / 10;

  if (diferencia === 0) {
    return {
      diferencia: 0,
      porcentaje: 0,
      etiqueta: 'Coincide 100% con el estimado preliminar',
      tipo: 'igual',
    };
  }

  if (diferencia > 0) {
    return {
      diferencia,
      porcentaje,
      etiqueta: `+${formatearPesos(diferencia)} (+${porcentaje}% sobre el preliminar)`,
      tipo: 'mayor',
    };
  }

  return {
    diferencia,
    porcentaje,
    etiqueta: `-${formatearPesos(Math.abs(diferencia))} (${porcentaje}% respecto al preliminar)`,
    tipo: 'menor',
  };
}

/**
 * Formatea el tamaño de un archivo en KB o MB para visualización del soporte.
 * @param {number} bytes
 * @returns {string}
 */
export function formatearTamanoArchivo(bytes) {
  if (!bytes || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
