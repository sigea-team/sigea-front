/**
 * @file authStore.js
 * @description Estado global de autenticación de SIGEA con Zustand.
 * Persiste el token JWT y los datos del usuario en localStorage para
 * mantener la sesión activa entre recargas de página (HU-01).
 * @module store/authStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * @typedef {Object} UsuarioSesion
 * @property {number} usuarioId
 * @property {string} correo
 * @property {string} nombreCompleto
 * @property {string[]} roles
 */

export const useAuthStore = create(
  persist(
    (set) => ({
      /** @type {string|null} */
      token: null,
      /** @type {UsuarioSesion|null} */
      usuario: null,

      /**
       * Guarda la sesión tras un login exitoso (respuesta de POST /api/v1/auth/login).
       * @param {{token: string, usuarioId: number, correo: string, nombreCompleto: string, roles: string[]}} data
       */
      iniciarSesion: (data) =>
        set({
          token: data.token,
          usuario: {
            usuarioId: data.usuarioId,
            correo: data.correo,
            nombreCompleto: data.nombreCompleto,
            roles: data.roles || [],
          },
        }),

      /** Cierra la sesión y limpia el estado persistido. */
      cerrarSesion: () => set({ token: null, usuario: null }),
    }),
    {
      name: 'sigea-auth', // clave usada en localStorage
      partialize: (state) => ({ token: state.token, usuario: state.usuario }),
    }
  )
);

/**
 * Mapa de rol -> ruta de su panel correspondiente (HU-01, Criterio 1).
 * Los paneles reales de cada rol se irán agregando en HUs posteriores;
 * mientras tanto todos apuntan al dashboard genérico "/dashboard".
 */
const RUTA_POR_ROL = {
  ADMIN: '/dashboard',
  ADMINISTRADOR: '/dashboard',
  EVALUADOR: '/dashboard',
  PARTICIPANTE: '/dashboard',
};

/**
 * Determina a qué ruta redirigir tras un login exitoso según los roles del usuario.
 * @param {string[]} roles
 * @returns {string}
 */
export function rutaSegunRoles(roles) {
  if (!roles || roles.length === 0) return '/dashboard';
  return RUTA_POR_ROL[roles[0]] || '/dashboard';
}
