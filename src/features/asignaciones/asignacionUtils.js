/**
 * @file asignacionUtils.js
 * @description Reglas y textos de la asignación de propuestas a evaluadores (HU-16: RF24).
 * Las reglas replican las del backend (AsignacionEvaluacionService) solo para orientar al usuario;
 * la validación definitiva siempre la hace la API.
 * @module features/asignaciones/asignacionUtils
 */

import { extraerError } from '../eventos/eventoUtils';

/** Etiquetas de `asignaciones_evaluacion.estado`. */
export const ESTADOS_ASIGNACION = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completada: 'Completada',
};

/** Etiquetas de `propuestas.estado`. */
export const ESTADOS_PROPUESTA = {
  recibida: 'Recibida',
  en_evaluacion: 'En evaluación',
  aprobada: 'Aprobada',
  ajustes: 'Requiere ajustes',
  rechazada: 'Rechazada',
};

/** Una propuesta solo se asigna mientras está recibida o en evaluación (igual que el backend). */
export const ESTADOS_PROPUESTA_ASIGNABLES = ['recibida', 'en_evaluacion'];

/** Niveles de conflicto de interés que devuelve `evaluadores-disponibles` (Criterio 2). */
export const NIVELES_CONFLICTO = {
  NINGUNO: 'NINGUNO',
  ADVERTENCIA: 'ADVERTENCIA',
  BLOQUEANTE: 'BLOQUEANTE',
};

/** Longitud máxima del motivo de reasignación (@Size de ReasignarEvaluadorRequest). */
export const LIMITE_MOTIVO = 255;

/**
 * Las propuestas se gestionan una vez la convocatoria salió de borrador (publicada o cerrada).
 * @param {{ estado?: string }} convocatoria
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function puedeGestionarPropuestas(convocatoria) {
  const estado = String(convocatoria?.estado || '').toUpperCase();
  if (!estado || estado === 'BORRADOR') {
    return {
      permitido: false,
      motivo: 'La convocatoria está en borrador: todavía no recibe propuestas para asignar.',
    };
  }
  return { permitido: true };
}

/**
 * @param {{ estado?: string, titulo?: string }} propuesta
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function puedeAsignarPropuesta(propuesta) {
  if (ESTADOS_PROPUESTA_ASIGNABLES.includes(propuesta?.estado)) {
    return { permitido: true };
  }
  const estado = ESTADOS_PROPUESTA[propuesta?.estado] || propuesta?.estado || 'desconocido';
  return {
    permitido: false,
    motivo: `La propuesta está «${estado}». Solo se asignan propuestas recibidas o en evaluación.`,
  };
}

/**
 * Indica si un evaluador del comité se puede marcar para asignarle la propuesta.
 * @param {{ yaAsignado?: boolean, conflicto?: string, detalleConflicto?: string }} evaluador
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function puedeSeleccionarEvaluador(evaluador) {
  if (evaluador?.yaAsignado) {
    return { permitido: false, motivo: 'Ya tiene asignada esta propuesta.' };
  }
  if (evaluador?.conflicto === NIVELES_CONFLICTO.BLOQUEANTE) {
    return {
      permitido: false,
      motivo: evaluador.detalleConflicto || 'Tiene un conflicto de interés que impide la asignación.',
    };
  }
  return { permitido: true };
}

/**
 * Una asignación se puede reasignar mientras el evaluador no haya completado la evaluación.
 * (Si ya registró calificaciones en proceso, el backend también lo impide con 409.)
 * @param {{ estado?: string }} asignacion
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function puedeReasignar(asignacion) {
  if (asignacion?.estado === 'completada') {
    return { permitido: false, motivo: 'La evaluación ya fue completada; no se puede reasignar.' };
  }
  return { permitido: true };
}

/**
 * Evaluadores elegibles como reemplazo: no tienen la propuesta y no tienen conflicto bloqueante.
 * @param {Array<Object>} disponibles - Respuesta de `evaluadores-disponibles`.
 * @returns {Array<Object>}
 */
export function candidatosReasignacion(disponibles) {
  return (disponibles || []).filter((e) => puedeSeleccionarEvaluador(e).permitido);
}

/**
 * Advertencias de conflicto entre los evaluadores seleccionados (para avisar antes de enviar).
 * @param {Array<Object>} disponibles
 * @param {Array<number>} seleccionados - IDs de comité evaluador.
 * @returns {Array<string>}
 */
export function advertenciasDeSeleccion(disponibles, seleccionados) {
  const ids = new Set(seleccionados || []);
  return (disponibles || [])
    .filter((e) => ids.has(e.comiteEvaluadorId) && e.conflicto === NIVELES_CONFLICTO.ADVERTENCIA)
    .map((e) => e.detalleConflicto || `${e.nombre} tiene un posible conflicto de interés.`);
}

/**
 * Texto de la carga de trabajo de un evaluador.
 * @param {number} cantidad - Asignaciones aún no completadas.
 */
export function textoCarga(cantidad) {
  const n = Number(cantidad) || 0;
  if (n === 0) return 'Sin asignaciones abiertas';
  return n === 1 ? '1 asignación abierta' : `${n} asignaciones abiertas`;
}

/**
 * Resumen de asignaciones de una propuesta para la lista de la convocatoria.
 * @param {{ asignacionesTotales?: number, asignacionesCompletadas?: number }} propuesta
 */
export function textoResumenAsignaciones(propuesta) {
  const total = Number(propuesta?.asignacionesTotales) || 0;
  const completadas = Number(propuesta?.asignacionesCompletadas) || 0;
  if (total === 0) return 'Sin evaluadores';
  const evaluadores = total === 1 ? '1 evaluador' : `${total} evaluadores`;
  return completadas > 0 ? `${evaluadores} · ${completadas} completada${completadas === 1 ? '' : 's'}` : evaluadores;
}

/**
 * @param {string} motivo
 * @returns {string|null} Mensaje de error o null si es válido.
 */
export function validarMotivo(motivo) {
  if ((motivo || '').trim().length > LIMITE_MOTIVO) {
    return `El motivo no puede superar los ${LIMITE_MOTIVO} caracteres.`;
  }
  return null;
}

/**
 * Indica si la API pidió confirmar una advertencia de conflicto de interés (Criterio 2).
 * @param {any} err
 */
export function requiereConfirmacion(err) {
  return err?.response?.status === 409 && err?.response?.data?.codigo === 'CONFIRMACION_REQUERIDA';
}

/**
 * Mensaje legible para un error de la API de asignaciones.
 * @param {any} err
 * @returns {{ mensaje: string, codigo?: string, status?: number }}
 */
export function interpretarErrorAsignacion(err) {
  const { mensaje, status, codigo } = extraerError(err);
  if (status === 403) {
    return {
      mensaje: 'Tu usuario no tiene permiso para asignar propuestas. Pide al administrador el permiso PROPUESTAS_ASIGNAR.',
      codigo,
      status,
    };
  }
  return { mensaje, codigo, status };
}

/**
 * Convierte una asignación de la bandeja (GET /asignaciones/mis-asignaciones) al formato que usa la
 * vista de evaluaciones (HU-17). Los criterios de la rúbrica se completan con la plantilla indicada,
 * porque la bandeja no los incluye.
 * @param {Object} asignacion - AsignacionResponse del backend.
 * @param {Array<{ id: number, nombre: string, descripcion?: string, pesoPorcentual: number }>} [rubrica=[]]
 * @returns {Object}
 */
export function normalizarAsignacionBandeja(asignacion, rubrica = []) {
  return {
    asignacionId: asignacion.asignacionId,
    propuestaId: asignacion.propuestaId,
    propuestaTitulo: asignacion.propuestaTitulo,
    convocatoriaId: asignacion.convocatoriaId,
    convocatoriaTitulo: asignacion.convocatoriaTitulo,
    fechaAsignacion: asignacion.fechaAsignacion,
    estado: asignacion.estado,
    autores: [],
    evaluaciones: rubrica.map((c) => ({
      evaluacionId: null,
      asignacionId: asignacion.asignacionId,
      criterioId: c.id,
      nombreCriterio: c.nombre,
      descripcionCriterio: c.descripcion,
      pesoPorcentual: c.pesoPorcentual,
      calificacion: null,
      observaciones: '',
    })),
  };
}

/**
 * "2026-10-25T10:00:00" → "25 oct 2026, 10:00".
 * @param {string|null|undefined} iso
 */
export function formatearFechaHoraCorta(iso) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(fecha)
    .replace('.', '');
}
