/**
 * @file permisos.js
 * @description Reglas de visibilidad por rol compartidas por el menú lateral y las rutas.
 * <p>
 * Importante: esto solo decide qué se MUESTRA en la interfaz. La seguridad real está en el
 * backend, que valida el JWT y los permisos en cada endpoint (por ejemplo,
 * GET /api/v1/auditoria exige el permiso AUDITORIA_VER o el rol ADMIN y responde 403 si no).
 * </p>
 * @module utils/permisos
 */

/** Nombres de rol que el sistema reconoce como administrador. */
export const ROLES_ADMINISTRADOR = ['ADMIN', 'ADMINISTRADOR'];

/**
 * Indica si el usuario de la sesión tiene rol de administrador.
 * Acepta tanto `usuario.roles` (arreglo) como `usuario.rol` (texto), sin distinguir mayúsculas.
 *
 * @param {{ rol?: string, roles?: string[] } | null | undefined} usuario
 * @returns {boolean}
 */
export function esAdministrador(usuario) {
  if (!usuario || typeof usuario !== 'object') return false;
  const roles = [
    ...(Array.isArray(usuario.roles) ? usuario.roles : []),
    ...(usuario.rol ? [usuario.rol] : []),
  ];
  return roles.some((r) => ROLES_ADMINISTRADOR.includes(String(r).trim().toUpperCase()));
}
