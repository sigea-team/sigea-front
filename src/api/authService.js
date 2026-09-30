import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
 * Solicita el envío de un enlace de recuperación de contraseña.
 * Endpoint: /api/v1/auth/forgot-password
 * El backend responde igual exista o no el correo (Criterio 4).
 */
export async function solicitarRecuperacion(correo) {
  const response = await authApi.post('/forgot-password', { correo });
  return response.data; // { mensaje }
}

/**
 * Restablece la contraseña usando el token recibido por correo.
 * Endpoint: /api/v1/auth/reset-password
 */
export async function restablecerContrasena(token, nuevaContrasena) {
  const response = await authApi.post('/reset-password', { token, nuevaContrasena });
  return response.data; // { mensaje }
}
