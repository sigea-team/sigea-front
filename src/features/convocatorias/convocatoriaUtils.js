/**
 * @file convocatoriaUtils.js
 * @description Utilidades para la gestión de convocatorias (HU Crear convocatorias).
 * Define estados, validaciones de campos obligatorios, validación de fechas de apertura y cierre,
 * cálculo de vigencia y formateo visual conforme al sistema de diseño SIGEA.
 * @module features/convocatorias/convocatoriaUtils
 */

export const ESTADOS_CONVOCATORIA = {
  BORRADOR: 'Borrador',
  ABIERTA: 'Abierta',
  CERRADA: 'Cerrada',
};

/**
 * Convierte una cadena de fecha u hora (ISO o YYYY-MM-DDTHH:mm) a objeto Date local.
 * @param {string|Date} val
 * @returns {Date|null}
 */
export function aFecha(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

const formatoFechaHora = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/**
 * Formatea una fecha ISO para presentación en pantalla ("12 oct 2026, 05:00 p.m.").
 * @param {string|Date} iso
 * @returns {string}
 */
export function formatearFechaHora(iso) {
  const f = aFecha(iso);
  return f ? formatoFechaHora.format(f).replace('.', '') : '—';
}

/**
 * Determina si la convocatoria ha expirado con respecto a la fecha y hora actual.
 * Criterio 4: Dado que la fecha de cierre ya se cumplió, el sistema impide el envío.
 * @param {string|Date} fechaCierre
 * @returns {boolean}
 */
export function esConvocatoriaExpirada(fechaCierre) {
  const fin = aFecha(fechaCierre);
  if (!fin) return false;
  return new Date().getTime() > fin.getTime();
}

/**
 * Valida si un autor tiene permitido enviar propuestas a la convocatoria.
 * Criterio 4: Si la convocatoria está cerrada por fecha, no permite el envío.
 * Tampoco permite envío si está en borrador.
 * @param {{ estado: string, fechaCierre: string|Date, fechaApertura?: string|Date }} convocatoria
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function puedeEnviarPropuesta(convocatoria) {
  if (!convocatoria) {
    return { permitido: false, motivo: 'Convocatoria no encontrada.' };
  }

  const estadoUpper = (convocatoria.estado || '').toUpperCase();
  if (estadoUpper === 'BORRADOR') {
    return {
      permitido: false,
      motivo: 'La convocatoria está en estado borrador y aún no recibe propuestas.',
    };
  }

  const ahora = new Date().getTime();
  const inicio = aFecha(convocatoria.fechaApertura);
  if (inicio && ahora < inicio.getTime()) {
    return {
      permitido: false,
      motivo: 'La convocatoria aún no ha iniciado su periodo de recepción.',
    };
  }

  if (esConvocatoriaExpirada(convocatoria.fechaCierre)) {
    return {
      permitido: false,
      motivo: 'El periodo de recepción ha finalizado (fecha de cierre cumplida).',
    };
  }

  return { permitido: true };
}

/**
 * Valida si una convocatoria se puede editar.
 * Criterio 3: Convocatorias en borrador se pueden editar sin publicarlas.
 * @param {{ estado: string }} convocatoria
 * @returns {boolean}
 */
export function esBorradorEditable(convocatoria) {
  const est = (convocatoria?.estado || '').toUpperCase();
  return est === 'BORRADOR';
}

/**
 * Valida el formulario de creación / edición de convocatoria.
 * Criterio 2: Dado que intento definir una fecha de cierre anterior a la de apertura,
 * o dejo campos obligatorios incompletos, el sistema rechaza la operación.
 * @param {Object} form
 * @returns {Object} Mapa de errores por campo
 */
export function validarConvocatoria(form) {
  const errores = {};

  if (!form.eventoId && !form.eventoNombre) {
    errores.eventoId = 'Debes seleccionar el evento asociado.';
  }

  const titulo = (form.titulo || '').trim();
  if (!titulo) {
    errores.titulo = 'El título de la convocatoria es obligatorio.';
  } else if (titulo.length > 200) {
    errores.titulo = 'El título no puede superar los 200 caracteres.';
  }

  const descripcion = (form.descripcion || '').trim();
  if (!descripcion) {
    errores.descripcion = 'La descripción de la convocatoria es obligatoria.';
  } else if (descripcion.length > 3000) {
    errores.descripcion = 'La descripción no puede superar los 3000 caracteres.';
  }

  const requisitos = (form.requisitos || '').trim();
  if (!requisitos) {
    errores.requisitos = 'Los requisitos para los autores son obligatorios.';
  } else if (requisitos.length > 3000) {
    errores.requisitos = 'Los requisitos no pueden superar los 3000 caracteres.';
  }

  if (!form.fechaApertura) {
    errores.fechaApertura = 'Selecciona la fecha y hora de apertura.';
  }

  if (!form.fechaCierre) {
    errores.fechaCierre = 'Selecciona la fecha y hora de cierre.';
  }

  if (form.fechaApertura && form.fechaCierre) {
    const fApertura = aFecha(form.fechaApertura);
    const fCierre = aFecha(form.fechaCierre);

    if (fApertura && fCierre && fCierre.getTime() <= fApertura.getTime()) {
      errores.fechaCierre = 'La fecha de cierre debe ser posterior a la fecha de apertura.';
    }
  }

  return errores;
}
