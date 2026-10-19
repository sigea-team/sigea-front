/**
 * @file propuestaUtils.js
 * @description Constantes y funciones de validación para el envío de propuestas y registro de autores/ponentes.
 * Cumple con los criterios de aceptación:
 * - Criterio 2: Roles específicos diferenciados (Autor principal, Coautor, Ponente).
 * - Criterio 3: Validación estricta de datos obligatorios (nombre, correo, filiación).
 * @module features/propuestas/propuestaUtils
 */

/**
 * Roles de autor alineados con el enum `RolAutor` del backend Java.
 * El backend usa snake_case en minúsculas: autor_principal, coautor, ponente.
 */
export const ROLES_AUTOR = {
  AUTOR_PRINCIPAL: 'autor_principal',
  COAUTOR: 'coautor',
  PONENTE: 'ponente',
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
 * @param {string} autor.nombre - Nombre(s) del autor.
 * @param {string} autor.apellidos - Apellidos del autor.
 * @param {string} autor.correo
 * @param {string} autor.filiacion
 * @param {string} autor.rol
 * @returns {Record<string, string>} Mapa de errores por campo vacío o inválido.
 */
export function validarAutor(autor) {
  const errores = {};

  if (!autor?.nombre || typeof autor.nombre !== 'string' || !autor.nombre.trim()) {
    errores.nombre = 'El nombre es obligatorio.';
  }

  if (!autor?.apellidos || typeof autor.apellidos !== 'string' || !autor.apellidos.trim()) {
    errores.apellidos = 'Los apellidos son obligatorios.';
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

/**
 * Convierte un autor del formato frontend al formato esperado por el backend (AutorRequest DTO).
 * El formulario ya captura nombre y apellidos por separado, así que el mapeo es directo.
 * @param {Object} autorFront - Autor en formato frontend { nombre, apellidos, correo, filiacion, rol }
 * @param {number} [orden] - Orden de autoría
 * @returns {Object} AutorRequest compatible con el backend
 */
export function autorFrontToBackend(autorFront, orden) {
  return {
    nombre: autorFront.nombre,
    apellidos: autorFront.apellidos || undefined,
    correo: autorFront.correo,
    filiacion: autorFront.filiacion,
    rol: autorFront.rol,
    orden: orden !== undefined ? orden : undefined,
  };
}

/**
 * Convierte un autor del formato backend (AutorResponse) al formato usado internamente por el frontend.
 * @param {Object} autorBack - Autor en formato backend { personaId, nombres, apellidos, nombreCompleto, correo, filiacion, rol, rolDescripcion, orden }
 * @returns {Object} Autor en formato frontend { id, nombre, apellidos, nombreCompleto, correo, filiacion, rol }
 */
export function autorBackendToFront(autorBack) {
  const nombre = autorBack.nombres || autorBack.nombre || '';
  const apellidos = autorBack.apellidos || '';
  return {
    id: autorBack.personaId || autorBack.id,
    nombre,
    apellidos,
    nombreCompleto: autorBack.nombreCompleto || `${nombre} ${apellidos}`.trim(),
    correo: autorBack.correo || autorBack.email || '',
    filiacion: autorBack.filiacion || autorBack.afiliacion || '',
    rol: autorBack.rol,
    personaId: autorBack.personaId,
    orden: autorBack.orden,
  };
}
