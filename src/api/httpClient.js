import axios from 'axios';
import { useAuthStore, esTokenValido } from '../store/authStore';

/**
 * @file httpClient.js
 * @description Cliente HTTP para los endpoints protegidos del backend (/api/v1/**).
 *
 * Los endpoints públicos de autenticación (login, registro, verificación, recuperación)
 * usan otro cliente (`authApi` en authService.js) que NO pasa por estos interceptores;
 * por eso un 401 por credenciales incorrectas en el login nunca dispara un cierre de sesión.
 *
 * @module api/httpClient
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const MODO_DESARROLLO = Boolean(import.meta.env.DEV);

export const httpClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/** Ruta del login; desde ella nunca se redirige otra vez (evita bucles). */
const RUTA_LOGIN = '/login';

/**
 * Interceptor de PETICIÓN (HU-01): adjunta el JWT de la sesión en
 * `Authorization: Bearer <token>`. Si el valor guardado no tiene forma de JWT
 * (por ejemplo, localStorage alterado a mano), se cierra la sesión y no se envía.
 */
httpClient.interceptors.request.use((config) => {
  const { token, cerrarSesion } = useAuthStore.getState();
  if (token) {
    if (esTokenValido(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      cerrarSesion();
    }
  }
  return config;
});

/**
 * Interceptor de RESPUESTA (HU-01 y HU-02).
 *
 * Se dispara en toda respuesta con error. Si el backend responde 401 y había una sesión
 * activa, el token venció o fue invalidado (por ejemplo, porque un administrador cambió los
 * permisos del rol del usuario, HU-02). Entonces:
 *  1. se cierra la sesión en el store;
 *  2. se navega a /login?sesion=expirada con una recarga completa, que deja la aplicación
 *     en estado limpio (sin datos ni mensajes de la sesión anterior).
 *
 * No hay bucles: tras el primer 401 el token queda en null, así que los 401 de otras
 * peticiones que estaban en curso ya no cumplen la condición; y si el usuario ya está en
 * /login, no se redirige.
 */
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const metodo = error.config?.method?.toUpperCase() || 'GET';
    const endpoint = error.config?.url || '';
    const status = error.response?.status;

    // Contexto extra para depurar quién llamó a qué.
    error.endpoint = `${metodo} ${endpoint}`;

    if (MODO_DESARROLLO) {
      console.warn(
        `[httpClient] ${error.endpoint} -> ${status ?? 'sin respuesta'}`,
        error.response?.data ?? error.message
      );
    }

    const tieneSesion = Boolean(useAuthStore.getState().token);
    if (status === 401 && tieneSesion) {
      useAuthStore.getState().cerrarSesion();
      if (typeof window !== 'undefined' && window.location.pathname !== RUTA_LOGIN) {
        window.location.assign(`${RUTA_LOGIN}?sesion=expirada`);
      }
    }

    return Promise.reject(error);
  }
);
