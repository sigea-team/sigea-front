/**
 * @file propuestaUtils.js
 * @description Constantes y funciones de validación para el envío de propuestas y registro de autores/ponentes.
 * Cumple con los criterios de aceptación:
 * - Criterio 2: Roles específicos diferenciados (Autor principal, Coautor, Ponente).
 * - Criterio 3: Validación estricta de datos obligatorios (nombre, correo, filiación).
 * @module features/propuestas/propuestaUtils
 */

export const ROLES_AUTOR = {
  AUTOR_PRINCIPAL: 'AUTOR_PRINCIPAL',
  COAUTOR: 'COAUTOR',
  PONENTE: 'PONENTE',
};

export const OPCIONES_ROL_AUTOR = [
  { value: ROLES_AUTOR.AUTOR_PRINCIPAL, label: 'Autor Principal' },
  { value: ROLES_AUTOR.COAUTOR, label: 'Coautor' },
  { value: ROLES_AUTOR.PONENTE, label: 'Ponente' },
];

export const INFO_ROL_AUTOR = {
  [ROLES_AUTOR.AUTOR_PRINCIPAL]: {
    label: 'Autor Principal',
    bg: 'bg-[#fdecec]',
    text: 'text-[#a6192e]',
    border: 'border-[#a6192e]/30',
  },
  [ROLES_AUTOR.COAUTOR]: {
    label: 'Coautor',
    bg: 'bg-[#f7f7f8]',
    text: 'text-[#1f2023]',
    border: 'border-[#e5e7ea]',
  },
  [ROLES_AUTOR.PONENTE]: {
    label: 'Ponente',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
};

/**
 * Valida un autor individual según el Criterio 3:
 * "Dado que intento registrar un autor sin datos obligatorios (nombre, correo, filiación),
 * cuando confirmo el registro, entonces el sistema rechaza la operación y señala los campos faltantes."
 *
 * @param {Object} autor
 * @param {string} autor.nombreCompleto
 * @param {string} autor.correo
 * @param {string} autor.filiacion
 * @param {string} autor.rol
 * @returns {Record<string, string>} Mapa de errores por campo vacío o inválido.
 */
export function validarAutor(autor) {
  const errores = {};

  if (!autor?.nombreCompleto || typeof autor.nombreCompleto !== 'string' || !autor.nombreCompleto.trim()) {
    errores.nombreCompleto = 'El nombre completo es obligatorio.';
  }

  if (!autor?.correo || typeof autor.correo !== 'string' || !autor.correo.trim()) {
    errores.correo = 'El correo electrónico es obligatorio.';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(autor.correo.trim())) {
      errores.correo = 'Ingrese un formato de correo electrónico válido (ej. autor@ufps.edu.co).';
    }
  }

  if (!autor?.filiacion || typeof autor.filiacion !== 'string' || !autor.filiacion.trim()) {
    errores.filiacion = 'La filiación institucional es obligatoria (ej. Universidad Francisco de Paula Santander).';
  }

  if (!autor?.rol || !Object.values(ROLES_AUTOR).includes(autor.rol)) {
    errores.rol = 'Seleccione un rol válido para el autor o ponente.';
  }

  return errores;
}

/**
 * Valida la propuesta en su conjunto antes de enviarla.
 * @param {Object} propuesta
 * @param {string} propuesta.titulo
 * @param {string} propuesta.resumen
 * @param {Array<Object>} propuesta.autores
 * @returns {Record<string, string>}
 */
export function validarPropuesta(propuesta) {
  const errores = {};

  if (!propuesta?.titulo || !propuesta.titulo.trim()) {
    errores.titulo = 'El título de la propuesta es obligatorio.';
  }

  if (!propuesta?.resumen || !propuesta.resumen.trim()) {
    errores.resumen = 'El resumen o abstract de la propuesta es obligatorio.';
  } else if (propuesta.resumen.trim().length < 20) {
    errores.resumen = 'El resumen debe contener al menos 20 caracteres.';
  }

  if (!Array.isArray(propuesta?.autores) || propuesta.autores.length === 0) {
    errores.autores = 'Debe registrar al menos un autor o ponente en la propuesta.';
  }

  return errores;
}
