/**
 * @file authStore.js
 * @description Estado global de autenticación de SIGEA con Zustand (HU-01).
 * Es la ÚNICA fuente de verdad de la sesión: AuthContext, ProtectedRoute y httpClient
 * leen de aquí.
 *
 * Seguridad: el token JWT se persiste en localStorage, como define el documento de
 * arquitectura. Esto mantiene la sesión entre recargas, pero un ataque XSS podría leerlo.
 * La mitigación de fondo (cookies HttpOnly emitidas por el backend y una política CSP)
 * requiere cambios en el backend y queda como evaluación para una fase posterior.
 *
 * @module store/authStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Clave de localStorage donde Zustand persiste la sesión. */
export const CLAVE_SESION = 'sigea-auth';

/**
 * @typedef {Object} UsuarioSesion
 * @property {number|null} usuarioId
 * @property {string} correo
 * @property {string} nombreCompleto
 * @property {string[]} roles
 * @property {'ASISTENTE'|'PONENTE'} [modoIngreso='ASISTENTE'] - Perfil institucional de ingreso activo.
 * @property {string} [avatarUrl]
 * @property {string} [telefono]
 * @property {string} [afiliacion]
 * @property {string} [biografia]
 */

/**
 * Comprueba que el valor tenga la forma de un JWT (tres segmentos base64url).
 * No verifica la firma: eso lo hace el backend en cada petición.
 * @param {unknown} token
 * @returns {boolean}
 */
export function esTokenValido(token) {
  return typeof token === 'string' && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token);
}

/**
 * Valida y normaliza la respuesta de POST /api/v1/auth/login antes de guardarla.
 * Contrato actual del backend: { token, tipoToken, usuarioId, correo, nombreCompleto, roles }.
 * Acepta también nombres alternativos (id, email, nombre, rol) para que un cambio menor de
 * contrato no rompa la sesión.
 *
 * @param {unknown} data
 * @returns {{ token: string, usuario: UsuarioSesion } | null} null si la respuesta no es válida.
 */
export function normalizarSesion(data, modoIngreso = 'ASISTENTE') {
  if (!data || typeof data !== 'object') return null;

  const origen =
    data.usuario && typeof data.usuario === 'object'
      ? { ...data.usuario, token: data.token ?? data.usuario.token }
      : data;

  const token = typeof origen.token === 'string' ? origen.token.trim() : '';
  if (!esTokenValido(token)) return null;

  const rolesCrudos = origen.roles ?? origen.rol ?? [];
  const roles = (Array.isArray(rolesCrudos) ? rolesCrudos : [rolesCrudos])
    .filter((r) => typeof r === 'string' && r.trim() !== '')
    .map((r) => r.trim().toUpperCase());

  const modo = (origen.modoIngreso || modoIngreso || 'ASISTENTE').toUpperCase();

  return {
    token,
    usuario: {
      usuarioId: origen.usuarioId ?? origen.id ?? null,
      correo: origen.correo ?? origen.email ?? '',
      nombreCompleto: origen.nombreCompleto ?? origen.nombre ?? origen.name ?? '',
      roles,
      modoIngreso: modo,
      avatarUrl: origen.avatarUrl ?? origen.foto ?? '',
      telefono: origen.telefono ?? '',
      afiliacion: origen.afiliacion ?? '',
      biografia: origen.biografia ?? '',
    },
  };
}

export const useAuthStore = create(
  persist(
    (set) => ({
      /** @type {string|null} */
      token: null,
      /** @type {UsuarioSesion|null} */
      usuario: null,

      /**
       * Guarda la sesión tras un login exitoso.
       * @param {unknown} data - Respuesta de POST /api/v1/auth/login.
       * @param {string} [modoIngreso='ASISTENTE'] - Modo de ingreso ('ASISTENTE' o 'PONENTE').
       * @returns {boolean} false si la respuesta no trae un token válido (no se guarda nada).
       */
      iniciarSesion: (data, modoIngreso = 'ASISTENTE') => {
        const sesion = normalizarSesion(data, modoIngreso);
        if (!sesion) return false;
        set(sesion);
        return true;
      },

      /**
       * Cambia el modo de ingreso de la sesión activa ('ASISTENTE', 'PONENTE' o 'ADMINISTRADOR').
       * @param {string} modo
       */
      setModoIngreso: (modo) => {
        set((state) => {
          if (!state.usuario) return state;
          return {
            usuario: {
              ...state.usuario,
              modoIngreso: String(modo || 'ASISTENTE').toUpperCase(),
            },
          };
        });
      },

      /**
       * Actualiza los datos del usuario en la sesión activa.
       * @param {Partial<UsuarioSesion>} nuevosDatos
       */
      actualizarUsuario: (nuevosDatos) =>
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...nuevosDatos } : null,
        })),

      /** Cierra la sesión y limpia el estado persistido. */
      cerrarSesion: () => set({ token: null, usuario: null }),
    }),
    {
      name: CLAVE_SESION,
      partialize: (state) => ({ token: state.token, usuario: state.usuario }),
    }
  )
);

/**
 * Sincronización entre pestañas: si en otra pestaña se inicia o cierra sesión, el navegador
 * dispara el evento "storage" y esta pestaña vuelve a leer la sesión. Al quedar el token en
 * null, ProtectedRoute redirige al login.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (evento) => {
    if (evento.key === CLAVE_SESION || evento.key === null) {
      useAuthStore.persist?.rehydrate?.();
    }
  });
}

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
 * Con roles vacíos, nulos o desconocidos devuelve "/dashboard".
 * @param {unknown} roles
 * @returns {string}
 */
export function rutaSegunRoles(roles) {
  const lista = Array.isArray(roles) ? roles : roles ? [roles] : [];
  const primero = typeof lista[0] === 'string' ? lista[0].toUpperCase() : '';
  return RUTA_POR_ROL[primero] || '/dashboard';
}
