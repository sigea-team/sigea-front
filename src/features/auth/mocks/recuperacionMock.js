/**
 * @file recuperacionMock.js
 * @description APIs simuladas del flujo de recuperación de contraseña (HU-32) para Storybook.
 * Reproducen las respuestas reales del backend (AuthController / GlobalExceptionHandler).
 * @module features/auth/mocks/recuperacionMock
 */

const esperar = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

/** Construye un error con la forma de un error de Axios con respuesta del servidor. */
function errorHttp(status, data) {
  const error = new Error(data?.message || `HTTP ${status}`);
  error.response = { status, data };
  return error;
}

/** Construye un error de Axios sin respuesta (servidor caído). */
function errorSinConexion() {
  const error = new Error('Network Error');
  error.request = {};
  return error;
}

export const MENSAJE_GENERICO_MOCK =
  'Si el correo está registrado, hemos enviado un enlace de recuperación con vigencia de 1 hora(s).';

/** Éxito en ambos pasos. */
export const servicioRecuperacionExitoso = {
  solicitar: async () => {
    await esperar();
    return { mensaje: MENSAJE_GENERICO_MOCK };
  },
  restablecer: async () => {
    await esperar();
    return {
      mensaje: 'Tu contraseña fue actualizada correctamente. Te notificamos el cambio por correo electrónico.',
      correo: 'carlos.gomez@universidad.edu.co',
    };
  },
};

/** Criterio 3: token ya utilizado. */
export const servicioTokenUsado = {
  ...servicioRecuperacionExitoso,
  restablecer: async () => {
    await esperar();
    throw errorHttp(400, {
      status: 400,
      codigo: 'TOKEN_INVALIDO',
      message: 'Este enlace de recuperación ya fue utilizado. Solicita uno nuevo.',
    });
  },
};

/** Criterio 3: token expirado. */
export const servicioTokenExpirado = {
  ...servicioRecuperacionExitoso,
  restablecer: async () => {
    await esperar();
    throw errorHttp(400, {
      status: 400,
      codigo: 'TOKEN_INVALIDO',
      message: 'El enlace de recuperación expiró. Solicita uno nuevo.',
    });
  },
};

/** Backend apagado o sin red. */
export const servicioSinConexion = {
  solicitar: async () => {
    await esperar();
    throw errorSinConexion();
  },
  restablecer: async () => {
    await esperar();
    throw errorSinConexion();
  },
};

export const TOKEN_EJEMPLO = '4c522da4-7d52-4467-bc18-2ad16a690d79';
