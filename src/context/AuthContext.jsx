import { createContext, useContext } from 'react';
import { loginUsuario } from '../api/authService';
import { useAuthStore } from '../store/authStore';

/**
 * @file AuthContext.jsx
 * @description Contexto de autenticación de SIGEA (HU-01).
 * <p>
 * Antes la sesión se guardaba en dos lugares (este contexto con claves sueltas de
 * localStorage y el store de Zustand), y al cerrar sesión solo se limpiaba uno: el
 * usuario seguía "logueado" para {@link ProtectedRoute}. Ahora el store de Zustand
 * (`store/authStore.js`) es la ÚNICA fuente de verdad y este contexto solo lo expone
 * con la misma interfaz de siempre: `{ token, usuario, login, logout, isAuthenticated }`.
 * </p>
 * @module context/AuthContext
 */

// Limpieza única de las claves que usaba la versión anterior (token, jwt, usuario).
try {
  ['token', 'jwt', 'usuario'].forEach((clave) => localStorage.removeItem(clave));
} catch {
  // localStorage no disponible (p. ej. modo privado estricto): no hay nada que limpiar.
}

const AuthContext = createContext(null);

/**
 * Inicia sesión contra POST /api/v1/auth/login y guarda la respuesta en el store.
 * Respuesta del backend: { token, tipoToken, usuarioId, correo, nombreCompleto, roles }.
 *
 * @param {{ correo?: string, email?: string, contrasena?: string, password?: string }} credenciales
 * @returns {Promise<Object>} La respuesta del backend.
 */
async function login(credenciales) {
  const data = await loginUsuario(credenciales);
  useAuthStore.getState().iniciarSesion(data);
  return data;
}

/** Cierra la sesión local. Las rutas protegidas redirigen solas a /login. */
function logout() {
  useAuthStore.getState().cerrarSesion();
}

/**
 * Proveedor del contexto de autenticación.
 */
export function AuthProvider({ children }) {
  const token = useAuthStore((state) => state.token);
  const usuario = useAuthStore((state) => state.usuario);

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout, isAuthenticated: Boolean(token) }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para consumir el contexto de autenticación. Fuera de un {@link AuthProvider}
 * (por ejemplo, en Storybook) lee directamente el store, con el mismo resultado.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  const token = useAuthStore((state) => state.token);
  const usuario = useAuthStore((state) => state.usuario);
  if (context) return context;
  return { token, usuario, login, logout, isAuthenticated: Boolean(token) };
}
