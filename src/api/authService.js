import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const authApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Autentica un usuario mediante email y password (o correo y contrasena).
 * Endpoint: POST /api/v1/auth/login
 * Body: { email, password }
 * Response: { token, usuario: { id, nombreCompleto, email, rol, afiliacion } }
 *
 * @param {{ email?: string, correo?: string, password?: string, contrasena?: string }} data
 */
export async function loginUsuario(data) {
  const correo = data.email || data.correo;
  const contrasena = data.password || data.contrasena;

  const response = await authApi.post('/login', { correo, contrasena });
  return response.data;
}

export const login = loginUsuario;

/**
 * Obtiene la lista de afiliaciones institucionales para el registro.
 * Endpoint: GET /api/v1/auth/afiliaciones
 */
export async function obtenerAfiliaciones() {
  const response = await authApi.get('/afiliaciones');
  return response.data;
}

export const getAfiliaciones = obtenerAfiliaciones;

/**
 * Envía los datos de registro de un nuevo usuario.
 * Endpoint: POST /api/v1/auth/register
 *
 * @param {Object} data
 */
export async function registrarUsuario(data) {
  const response = await authApi.post('/register', data);
  return response.data;
}

export const register = registrarUsuario;
export const registerUsuario = registrarUsuario;

/**
 * Reenvía el enlace de verificación de correo electrónico.
 * Endpoint: POST /api/v1/auth/resend-verification
 *
 * @param {string} correo
 */
export async function reenviarVerificacion(correo) {
  const response = await authApi.post('/resend-verification', { correo, email: correo });
  return response.data;
}

/**
 * Solicita el enlace de recuperación de contraseña (HU-32, Criterios 1 y 4).
 * Endpoint: POST /api/v1/auth/forgot-password
 * Body: { correo }
 * Response: { mensaje } — el backend responde SIEMPRE el mismo mensaje genérico,
 * exista o no la cuenta, para no revelar qué correos están registrados.
 *
 * @param {string} correo
 * @returns {Promise<{ mensaje: string }>}
 */
export async function solicitarRecuperacion(correo) {
  const response = await authApi.post('/forgot-password', { correo });
  return response.data;
}

/**
 * Restablece la contraseña con el token recibido por correo (HU-32, Criterios 2 y 3).
 * Endpoint: POST /api/v1/auth/reset-password
 * Body: { token, nuevaContrasena }
 * Response: { mensaje, correo }
 * Errores: 400 TOKEN_INVALIDO (no existe, ya usado o expirado) y
 *          400 VALIDACION_FALLIDA (la contraseña no cumple la política).
 *
 * @param {{ token: string, nuevaContrasena: string }} data
 * @returns {Promise<{ mensaje: string, correo: string }>}
 */
export async function restablecerContrasena({ token, nuevaContrasena }) {
  const response = await authApi.post('/reset-password', { token, nuevaContrasena });
  return response.data;
}

/** Agrupa las funciones de HU-32 para poder inyectar una API simulada en Storybook. */
export const servicioRecuperacion = {
  solicitar: solicitarRecuperacion,
  restablecer: restablecerContrasena,
};
