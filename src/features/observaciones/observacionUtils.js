/**
 * @file observacionUtils.js
 * @description Reglas y textos de las observaciones y ajustes requeridos a una propuesta y de la aprobación de su
 * versión definitiva (HU-19: RF28, RF29). Replican las validaciones de `ObservacionPropuestaService` del backend
 * para avisar antes de enviar; el backend sigue siendo quien decide.
 * @module features/observaciones/observacionUtils
 */

import { extraerError } from '../eventos/eventoUtils';

/** Máximo de caracteres de una observación (igual que el backend). */
export const MAX_DESCRIPCION = 2000;

/** Máximo de observaciones que se registran a la vez (igual que el backend). */
export const MAX_OBSERVACIONES = 30;

/**
 * Estados de una observación que calcula el backend:
 * - pendiente: ajuste sin una versión del autor que lo atienda.
 * - atendida: el autor subió una versión; falta que el evaluador o el administrador la revise.
 * - resuelta: se dio por resuelta.
 * - comentario: no requiere ajuste (no bloquea la aprobación).
 */
export const ESTADOS_OBSERVACION = {
  pendiente: {
    etiqueta: 'Pendiente del autor',
    clases: 'bg-brand-100 text-brand-700 border-brand-600',
  },
  atendida: {
    etiqueta: 'Atendida, por revisar',
    clases: 'bg-surface-muted text-ink-900 border-ink-600',
  },
  resuelta: {
    etiqueta: 'Resuelta',
    clases: 'bg-white text-ink-600 border-field-border',
  },
  comentario: {
    etiqueta: 'Comentario',
    clases: 'bg-white text-ink-600 border-border',
  },
};


/** Clasificaciones (HU-18) tras las que se gestionan observaciones. */
const CLASIFICACIONES_CON_OBSERVACIONES = ['aprobada', 'aprobada_con_ajustes'];

/** @returns {{ descripcion: string, requiereAjuste: boolean }} Fila vacía del formulario. */
export function filaObservacionVacia() {
  return { descripcion: '', requiereAjuste: true };
}

/**
 * Etiqueta y clases del estado de una observación.
 * @param {string} estado
 * @returns {{ etiqueta: string, clases: string }}
 */
export function infoEstadoObservacion(estado) {
  return ESTADOS_OBSERVACION[estado] || { etiqueta: estado || 'Sin estado', clases: 'bg-white text-ink-600 border-border' };
}

/**
 * Valida las observaciones del formulario (Criterio 1). Las filas totalmente vacías se ignoran.
 * @param {Array<{ descripcion: string, requiereAjuste: boolean }>} filas
 * @returns {{ valido: boolean, general: string|null, porFila: Record<number, string>,
 *   observaciones: Array<{ descripcion: string, requiereAjuste: boolean }> }}
 */
export function validarObservaciones(filas) {
  const porFila = {};
  const observaciones = [];
  (Array.isArray(filas) ? filas : []).forEach((fila, i) => {
    const texto = (fila?.descripcion || '').trim();
    if (!texto) return;
    if (texto.length > MAX_DESCRIPCION) {
      porFila[i] = `La observación no puede superar ${MAX_DESCRIPCION} caracteres.`;
      return;
    }
    observaciones.push({ descripcion: texto, requiereAjuste: fila.requiereAjuste !== false });
  });

  let general = null;
  if (Object.keys(porFila).length === 0) {
    if (observaciones.length === 0) general = 'Escribe al menos una observación.';
    else if (observaciones.length > MAX_OBSERVACIONES) {
      general = `Se pueden registrar como máximo ${MAX_OBSERVACIONES} observaciones a la vez.`;
    }
  }
  return { valido: !general && Object.keys(porFila).length === 0, general, porFila, observaciones };
}

/**
 * Indica si se pueden registrar observaciones nuevas sobre la propuesta (Criterio 1): solo en una propuesta
 * aprobada con ajustes (estado `ajustes`) y sin versión definitiva.
 * @param {Object|null} resumen - Respuesta de `GET /propuestas/{id}/observaciones`.
 * @returns {{ permitido: boolean, motivo: string|null }}
 */
export function puedeRegistrar(resumen) {
  if (!resumen) return { permitido: false, motivo: 'Cargando la propuesta.' };
  if (resumen.versionDefinitiva != null) {
    return { permitido: false, motivo: 'La propuesta ya tiene versión definitiva aprobada.' };
  }
  const estado = String(resumen.estadoPropuesta || '').toLowerCase();
  if (estado === 'rechazada') return { permitido: false, motivo: 'La propuesta fue rechazada.' };
  // Solo una propuesta aprobada con ajustes (estado «ajustes») lleva ajustes; la aceptada se aprueba directamente.
  if (estado === 'aprobada') {
    return {
      permitido: false,
      motivo: 'La propuesta fue aceptada sin modificaciones y no requiere ajustes; su versión definitiva se aprueba directamente.',
    };
  }
  if (estado !== 'ajustes') {
    return { permitido: false, motivo: 'La propuesta todavía no ha sido evaluada y clasificada.' };
  }
  return { permitido: true, motivo: null };
}

/**
 * Indica si una observación se puede dar por resuelta (Criterio 2): un ajuste necesita una versión del autor que
 * lo atienda; un comentario se puede cerrar siempre.
 * @param {Object} observacion
 * @param {Object|null} resumen
 * @returns {{ permitido: boolean, motivo: string|null }}
 */
export function puedeResolver(observacion, resumen) {
  if (!observacion || observacion.resuelto) return { permitido: false, motivo: 'Ya está resuelta.' };
  if (resumen?.versionDefinitiva != null) {
    return { permitido: false, motivo: 'La propuesta ya tiene versión definitiva aprobada.' };
  }
  if (observacion.requiereAjuste && observacion.versionAtencionNumero == null) {
    return { permitido: false, motivo: 'El autor aún no ha subido una versión que atienda este ajuste.' };
  }
  return { permitido: true, motivo: null };
}

/**
 * Indica si la versión actual se puede aprobar como definitiva (Criterios 3 y 4), con el motivo que da el
 * backend cuando no.
 * @param {Object|null} resumen
 * @returns {{ permitido: boolean, motivo: string|null }}
 */
export function puedeAprobar(resumen) {
  if (!resumen) return { permitido: false, motivo: 'Cargando la propuesta.' };
  if (resumen.puedeAprobarse) return { permitido: true, motivo: null };
  return { permitido: false, motivo: resumen.motivoNoAprobable || 'La propuesta no se puede aprobar todavía.' };
}

/**
 * Ajustes pendientes del resumen (los que bloquean la aprobación, Criterio 4).
 * @param {Object|null} resumen
 * @returns {Array<Object>}
 */
export function ajustesPendientes(resumen) {
  return (resumen?.observaciones || []).filter((o) => o.requiereAjuste && !o.resuelto);
}

/**
 * Indica si en una fila de clasificación (HU-18) ya se gestionan observaciones: clasificación aplicada como
 * aceptada o aceptada con modificaciones.
 * @param {{ aplicada?: boolean, clasificacion?: string }} fila
 * @returns {boolean}
 */
export function gestionaObservaciones(fila) {
  return Boolean(fila?.aplicada) && CLASIFICACIONES_CON_OBSERVACIONES.includes(fila?.clasificacion);
}

/**
 * Frase de situación para el autor de la propuesta.
 * @param {Object|null} resumen
 * @returns {string}
 */
export function mensajeParaAutor(resumen) {
  if (!resumen) return '';
  if (resumen.versionDefinitiva != null) {
    return `La versión ${resumen.versionDefinitiva} fue aprobada como definitiva. Ya no admite cambios y queda disponible para la agenda del evento.`;
  }
  const porAtender = Number(resumen.ajustesPorAtender) || 0;
  const pendientes = Number(resumen.ajustesPendientes) || 0;
  if (porAtender > 0) {
    return `Tienes ${porAtender} ${porAtender === 1 ? 'ajuste' : 'ajustes'} por atender. Sube una nueva versión desde «Modificar» para que se revisen.`;
  }
  if (pendientes > 0) {
    return 'Ya subiste una versión con los ajustes. Está pendiente de revisión por el evaluador o el administrador.';
  }
  if ((resumen.observaciones || []).length === 0) {
    return String(resumen.estadoPropuesta || '').toLowerCase() === 'aprobada'
      ? 'Tu propuesta fue aceptada sin modificaciones. Falta que el administrador apruebe la versión definitiva.'
      : 'Tu propuesta no tiene observaciones.';
  }
  return 'No tienes ajustes pendientes. Falta que el administrador apruebe la versión definitiva.';
}

/**
 * Interpreta un error de la API de observaciones. En el 409 de aprobación devuelve la lista de pendientes
 * (Criterio 4).
 * @param {any} err
 * @returns {{ codigo: string|null, titulo: string, mensaje: string, pendientes: Array<Object> }}
 */
export function interpretarErrorObservacion(err) {
  const data = err?.response?.data;
  const status = err?.response?.status;
  const codigo = data?.codigo || null;
  const mensaje =
    status === 403
      ? 'No tienes permiso para gestionar las observaciones de esta propuesta.'
      : extraerError(err).mensaje;
  const titulos = {
    OBSERVACIONES_PENDIENTES: 'Quedan ajustes sin resolver',
    AJUSTES_SIN_REGISTRAR: 'Faltan los ajustes requeridos',
    PROPUESTA_NO_EVALUADA: 'La propuesta no está clasificada',
    PROPUESTA_BLOQUEADA: 'Propuesta en versión definitiva',
    OPERACION_NO_PERMITIDA: 'Operación no permitida',
    VALIDACION_FALLIDA: 'Revisa las observaciones',
    SOLICITUD_INVALIDA: 'Revisa las observaciones',
  };
  return {
    codigo,
    titulo: titulos[codigo] || (status === 403 ? 'Sin permiso' : 'No se pudo completar la operación'),
    mensaje,
    pendientes: Array.isArray(data?.pendientes) ? data.pendientes : [],
  };
}

/**
 * Formatea una fecha y hora del backend («2026-11-09T10:30:00») como «9 nov 2026, 10:30».
 * @param {string|null} valor
 * @returns {string}
 */
export function formatearFecha(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Opciones del selector de propuestas al programar una actividad (HU-19, Criterio 3). Si la actividad ya tiene
 * una propuesta que no está en la lista (vinculada antes), se conserva como opción.
 * @param {Array<Object>} programables - Respuesta de `GET /eventos/{id}/propuestas-programables`.
 * @param {number|string|null} [propuestaActualId]
 * @returns {Array<{ value: string, label: string }>}
 */
export function opcionesPropuestasProgramables(programables, propuestaActualId = null) {
  const lista = Array.isArray(programables) ? programables : [];
  const opciones = [
    { value: '', label: lista.length ? 'Sin propuesta vinculada (opcional)' : 'No hay propuestas aprobadas en versión definitiva' },
    ...lista.map((p) => ({
      value: String(p.propuestaId),
      label: `${p.titulo} (v${p.numeroVersion})${p.programada ? ' — ya programada' : ''}`,
    })),
  ];
  if (propuestaActualId && !lista.some((p) => String(p.propuestaId) === String(propuestaActualId))) {
    opciones.push({ value: String(propuestaActualId), label: `Propuesta #${propuestaActualId} (vinculada)` });
  }
  return opciones;
}
