import axios from 'axios';
import { useAuthStore } from '../store/authStore';

/**
 * @file httpClient.js
 * @description Cliente HTTP para los endpoints protegidos del backend (/api/v1/**).
 * Adjunta el JWT del store de sesión y gestiona la expiración de la sesión.
 * @module api/httpClient
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const httpClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

httpClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Si el backend responde 401 con una sesión activa, el token venció o fue invalidado
 * (p. ej. porque un administrador cambió los permisos del rol del usuario, HU-02).
 * Se cierra la sesión y se envía al usuario al login con un aviso.
 */
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const tieneSesion = Boolean(useAuthStore.getState().token);
    if (error.response?.status === 401 && tieneSesion) {
      useAuthStore.getState().cerrarSesion();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?sesion=expirada');
      }
    }
    return Promise.reject(error);
  }
);
