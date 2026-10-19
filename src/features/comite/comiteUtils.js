/**
 * @file comiteUtils.js
 * @description Utilidades del comité organizador (HU-06): regla de estado, validaciones del
 * formulario y lectura de errores de la API.
 * @module features/comite/comiteUtils
 */

import { ESTADOS_EVENTO, extraerError } from '../eventos/eventoUtils';

/**
 * Estados del evento en los que el comité puede modificarse (Criterio 4, decisión del PO).
 * Debe coincidir con ESTADOS_COMITE_MODIFICABLE de ComiteOrganizadorService en el backend.
 */
export const ESTADOS_COMITE_MODIFICABLE = ['en_configuracion', 'habilitado'];

/** Longitudes máximas; coinciden con las validaciones @Size de MiembroComiteRequest. */
export const LIMITES_COMITE = { numeroDocumento: 30, rolComite: 50 };

/**
 * @param {{ estado: string }} evento
 * @returns {boolean}
 */
export function puedeModificarComite(evento) {
  return ESTADOS_COMITE_MODIFICABLE.includes(evento?.estado);
}

/**
 * Texto que explica por qué el comité no se puede modificar.
 * @param {{ estado: string }} evento
 */
export function motivoComiteBloqueado(evento) {
  const estado = ESTADOS_EVENTO[evento?.estado] || evento?.estado || 'desconocido';
  return `El evento está «${estado}». El comité solo se puede modificar mientras el evento está en configuración o habilitado.`;
}

/**
 * Valida en el cliente los mismos campos que valida el backend.
 * @param {{ numeroDocumento: string, rolComite: string }} form
 * @returns {Object} errores por campo (vacío si todo está bien)
 */
export function validarMiembro(form) {
  const errores = {};
  const documento = form.numeroDocumento.trim();
  const rol = form.rolComite.trim();

  if (!documento) errores.numeroDocumento = 'Escribe el número de documento de la persona.';
  else if (documento.length > LIMITES_COMITE.numeroDocumento) {
    errores.numeroDocumento = `El documento no puede superar los ${LIMITES_COMITE.numeroDocumento} caracteres.`;
  }

  if (!rol) errores.rolComite = 'Indica el rol de la persona en el comité.';
  else if (rol.length > LIMITES_COMITE.rolComite) {
    errores.rolComite = `El rol no puede superar los ${LIMITES_COMITE.rolComite} caracteres.`;
  }
  return errores;
}

/** Campos del backend que se muestran en otro campo del formulario. */
const CAMPO_EQUIVALENTE = { personaIdentificada: 'numeroDocumento', personaId: 'numeroDocumento' };

/**
 * Traduce un error al agregar un miembro en errores por campo o en un mensaje general.
 * - 409 MIEMBRO_COMITE_DUPLICADO y 404 de persona → se muestran junto al documento.
 * - Errores de validación (400) → en su campo.
 * - Lo demás (estado del evento, permisos, servidor) → mensaje general.
 * @param {any} err
 * @returns {{ campos: Object, mensaje: string|null, codigo: string|undefined, status: number|undefined }}
 */
export function interpretarErrorMiembro(err) {
  const { mensaje, campos, status, codigo } = extraerError(err);
  const porCampo = {};
  Object.entries(campos).forEach(([campo, texto]) => {
    porCampo[CAMPO_EQUIVALENTE[campo] || campo] = texto;
  });

  const esPersonaNoEncontrada = status === 404 && /persona/i.test(mensaje);
  if (codigo === 'MIEMBRO_COMITE_DUPLICADO' || esPersonaNoEncontrada) {
    porCampo.numeroDocumento = mensaje;
    return { campos: porCampo, mensaje: null, codigo, status };
  }
  if (Object.keys(porCampo).length > 0) {
    return { campos: porCampo, mensaje: null, codigo, status };
  }
  return { campos: {}, mensaje, codigo, status };
}

/**
 * "2026-09-20T10:00:00" → "2026-09-20", para reutilizar formatearFecha de eventos.
 * @param {string|null|undefined} fechaHora
 */
export function soloFecha(fechaHora) {
  return typeof fechaHora === 'string' ? fechaHora.slice(0, 10) : null;
}
