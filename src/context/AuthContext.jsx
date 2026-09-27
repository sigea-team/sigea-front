import { createContext, useContext, useState } from 'react';
import { loginUsuario } from '../api/authService';

const AuthContext = createContext(null);

/**
 * Proveedor del Contexto de Autenticación de SIGEA.
 * Mantiene el token JWT y la información del usuario en localStorage
 * y en el estado global de la aplicación.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || localStorage.getItem('jwt') || null;
  });

  const [usuario, setUsuario] = useState(() => {
    const savedUser = localStorage.getItem('usuario');
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  /**
   * Realiza la autenticación mediante el servicio `loginUsuario`.
   * Guarda el JWT en `localStorage` y la información del usuario en el estado global.
   *
   * @param {{ email?: string, correo?: string, password?: string, contrasena?: string }} credentials
   */
  const login = async (credentials) => {
    const data = await loginUsuario(credentials);
    const jwtToken = data.token;
    const userData = data.usuario || data;

    if (jwtToken) {
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('jwt', jwtToken);
      setToken(jwtToken);
    }

    if (userData) {
      localStorage.setItem('usuario', JSON.stringify(userData));
      setUsuario(userData);
    }

    return data;
  };

  /**
   * Elimina el token y la información del usuario de `localStorage` y limpia el estado global.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        usuario,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para consumir el contexto de autenticación de SIGEA.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      token: null,
      usuario: null,
      login: async () => {},
      logout: () => {},
      isAuthenticated: false,
    };
  }
  return context;
}
