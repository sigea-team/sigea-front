import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const httpClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend responde 401 (token vencido / inválido), se limpian las credenciales de localStorage.
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('jwt');
      localStorage.removeItem('usuario');
    }
    return Promise.reject(error);
  }
);
