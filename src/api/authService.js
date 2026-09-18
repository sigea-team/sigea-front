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
