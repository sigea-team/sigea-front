/**
 * @file recuperacionUtils.js
 * @description Utilidades compartidas del flujo de recuperación de contraseña (HU-32, RF58).
 * La política de contraseña es la MISMA del registro (RegisterForm) y del backend
 * (RestablecerContrasenaRequest): 8 a 64 caracteres, mayúscula, minúscula, número y símbolo.
 * @module features/auth/recuperacionUtils
 */

/** Expresión regular idéntica a la del backend (@Pattern de RestablecerContrasenaRequest). */
export const PATRON_CONTRASENA = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#])[A-Za-z\d@$!%*?&._\-#]{8,64}$/;

export const MENSAJE_POLITICA_CONTRASENA =
  'Debe tener entre 8 y 64 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo (@$!%*?&._-#)';

export const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Requisitos de la política, para mostrarlos en vivo mientras el usuario escribe.
 * @type {Array<{ id: string, texto: string, cumple: (valor: string) => boolean }>}
 */
export const REQUISITOS_CONTRASENA = [
  { id: 'longitud', texto: 'Entre 8 y 64 caracteres', cumple: (v) => v.length >= 8 && v.length <= 64 },
  { id: 'mayuscula', texto: 'Una letra mayúscula', cumple: (v) => /[A-Z]/.test(v) },
  { id: 'minuscula', texto: 'Una letra minúscula', cumple: (v) => /[a-z]/.test(v) },
  { id: 'numero', texto: 'Un número', cumple: (v) => /\d/.test(v) },
  { id: 'simbolo', texto: 'Un símbolo (@$!%*?&._-#)', cumple: (v) => /[@$!%*?&._\-#]/.test(v) },
];

/**
 * Extrae el cuerpo de error del backend (ErrorResponse) validando que sea un objeto.
 * @param {unknown} error - Error de Axios.
 * @returns {{ status?: number, message?: string, codigo?: string, erroresValidacion?: Object<string,string> }}
 */
export function cuerpoDeError(error) {
  const cuerpo = error?.response?.data;
  return {
    status: error?.response?.status,
    ...(cuerpo && typeof cuerpo === 'object' ? cuerpo : {}),
  };
}

/**
 * Indica si el error se produjo porque no hubo respuesta del servidor
 * (backend apagado, sin conexión o tiempo de espera agotado).
 * @param {unknown} error
 * @returns {boolean}
 */
export function esErrorDeConexion(error) {
  return Boolean(error) && !error.response;
}

export const MENSAJE_SIN_CONEXION =
  'No fue posible conectarse con el servidor. Verifique su conexión o que el servicio esté activo.';
