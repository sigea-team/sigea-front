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
 * Realiza la petición POST de registro al backend
 * Endpoint: /api/v1/auth/register
 */
export async function registrarUsuario(data) {
  const response = await authApi.post('/register', data);
  return response.data;
}

/**
 * Obtiene el catálogo de afiliaciones institucionales desde la base de datos
 * Endpoint: /api/v1/auth/afiliaciones
 */
export async function obtenerAfiliaciones() {
  const response = await authApi.get('/afiliaciones');
  return response.data;
}

/**
 * Autentica un usuario mediante correo y contraseña (HU-01, RF01).
 * Endpoint: /api/v1/auth/login
 * Respuestas de error relevantes que maneja el backend:
 *  - 401 CREDENCIALES_INVALIDAS  -> mensaje genérico (Criterio 2)
 *  - 423 CUENTA_BLOQUEADA        -> bloqueo temporal por intentos fallidos (Criterio 3)
 *  - 403 CORREO_NO_VERIFICADO    -> ofrece reenviar verificación (trae `correo` en el body)
 *
 * @param {{correo: string, contrasena: string}} data
 */
export async function loginUsuario(data) {
  const response = await authApi.post('/login', data);
  return response.data;
}

/**
 * Reenvía el enlace de verificación de correo electrónico a una cuenta pendiente de activar.
 * Endpoint: /api/v1/auth/resend-verification
 *
 * @param {string} correo
 */
export async function reenviarVerificacion(correo) {
  const response = await authApi.post('/resend-verification', { correo });
  return response.data;
}