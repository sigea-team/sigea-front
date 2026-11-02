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
 * Verifica si la cuenta de usuario posee rol de administrador en sus credenciales/asignaciones.
 * @param {{ rol?: string, roles?: string[] } | null | undefined} usuario
 * @returns {boolean}
 */
export function tieneRolAdministrador(usuario) {
  if (!usuario || typeof usuario !== 'object') return false;
  const roles = [
    ...(Array.isArray(usuario.roles) ? usuario.roles : []),
    ...(usuario.rol ? [usuario.rol] : []),
  ];
  return roles.some((r) => ROLES_ADMINISTRADOR.includes(String(r).trim().toUpperCase()));
}

/**
 * Indica si el usuario de la sesión puede operar con funciones activas de administrador.
 * Requiere que la cuenta tenga rol de administrador Y que no haya ingresado expresamente
 * en un perfil restringido (como ASISTENTE o PONENTE).
 *
 * @param {{ rol?: string, roles?: string[], modoIngreso?: string } | null | undefined} usuario
 * @returns {boolean}
 */
export function esAdministrador(usuario) {
  if (!usuario || typeof usuario !== 'object') return false;
  if (!tieneRolAdministrador(usuario)) return false;

  // Si el usuario ingresó expresamente en modo Asistente o Ponente, opera con la vista restringida
  if (usuario.modoIngreso && usuario.modoIngreso !== 'ADMINISTRADOR' && usuario.modoIngreso !== 'ADMIN') {
    return false;
  }

  return true;
}


/** Permiso que habilita evaluar propuestas e ingresar con el perfil «Evaluador» (HU-17). */
export const PERMISO_EVALUAR = 'PROPUESTAS_EVALUAR';

/**
 * Indica si la cuenta tiene un permiso concreto, obtenido de sus roles (lo envía el backend al iniciar sesión).
 * @param {{ permisos?: string[] } | null | undefined} usuario
 * @param {string} codigo - Código del permiso, por ejemplo 'PROPUESTAS_EVALUAR'.
 * @returns {boolean}
 */
export function tienePermiso(usuario, codigo) {
  if (!usuario || !Array.isArray(usuario.permisos)) return false;
  const buscado = String(codigo).trim().toUpperCase();
  return usuario.permisos.some((p) => String(p).trim().toUpperCase() === buscado);
}

/**
 * Indica si la cuenta puede evaluar propuestas: el administrador le asignó un rol con el permiso
 * PROPUESTAS_EVALUAR, o es administrador. Elegir el perfil «Evaluador» al iniciar sesión no basta.
 * @param {{ roles?: string[], permisos?: string[] } | null | undefined} usuario
 * @returns {boolean}
 */
export function puedeEvaluar(usuario) {
  return tienePermiso(usuario, PERMISO_EVALUAR) || tieneRolAdministrador(usuario);
}
