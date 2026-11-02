/**
 * @file rolesMock.js
 * @description API de roles en memoria con el mismo contrato que {@link module:api/rolService}.
 * Solo para Storybook y pruebas: la aplicación usa siempre el backend real.
 * @module features/roles/mocks/rolesMock
 */

export const PERMISOS_MOCK = [
  { id: 1, codigo: 'ROLES_VER', modulo: 'ROLES', descripcion: 'Visualizar roles y sus permisos asociados' },
  { id: 2, codigo: 'ROLES_CREAR', modulo: 'ROLES', descripcion: 'Crear nuevos roles y asignar permisos' },
  { id: 3, codigo: 'USUARIOS_GESTIONAR_ROLES', modulo: 'USUARIOS', descripcion: 'Asignar o remover roles a usuarios' },
  { id: 4, codigo: 'PROPUESTAS_VER', modulo: 'PROPUESTAS', descripcion: 'Visualizar propuestas académicas' },
  { id: 5, codigo: 'PROPUESTAS_EVALUAR', modulo: 'EVALUACION', descripcion: 'Evaluar propuestas mediante rúbricas' },
];

const porId = (ids) => PERMISOS_MOCK.filter((p) => ids.includes(p.id));

/**
 * Crea una API de roles en memoria.
 * @param {{ demora?: number }} [opciones]
 */
export function crearRolesApiMock({ demora = 300 } = {}) {
  let siguienteRol = 4;
  let roles = [
    { id: 1, nombre: 'ADMIN', descripcion: 'Administrador del sistema', permisos: porId([1, 2, 3]) },
    { id: 2, nombre: 'PARTICIPANTE', descripcion: 'Asistente a eventos', permisos: [] },
    { id: 3, nombre: 'EVALUADOR', descripcion: 'Par evaluador de propuestas', permisos: porId([5]) },
  ];
  let usuarios = [
    { usuarioId: 1, nombreCompleto: 'Admin UFPS', correo: 'admin@ufps.edu.co', numeroDocumento: '1', estado: 'activo', rolesIds: [1] },
    { usuarioId: 2, nombreCompleto: 'Ana Pérez', correo: 'ana@ufps.edu.co', numeroDocumento: '2', estado: 'activo', rolesIds: [2, 3] },
    { usuarioId: 3, nombreCompleto: 'Luis Gómez', correo: 'luis@ufps.edu.co', numeroDocumento: '3', estado: 'activo', rolesIds: [2] },
  ];

  const esperar = (valor) => new Promise((ok) => setTimeout(() => ok(structuredClone(valor)), demora));
  const fallar = (status, message) =>
    new Promise((_, ko) => setTimeout(() => ko({ response: { status, data: { status, message } } }), demora));

  const conConteo = (r) => {
    const n = usuarios.filter((u) => u.rolesIds.includes(r.id)).length;
    return { ...r, usuariosActivosAsignados: n, totalUsuariosAsignados: n };
  };
  const exponerUsuario = (u) => {
    const rs = roles.filter((r) => u.rolesIds.includes(r.id));
    return {
      usuarioId: u.usuarioId,
      nombreCompleto: u.nombreCompleto,
      correo: u.correo,
      numeroDocumento: u.numeroDocumento,
      estado: u.estado,
      roles: rs.map((r) => ({ id: r.id, nombre: r.nombre })),
      permisos: [...new Set(rs.flatMap((r) => r.permisos.map((p) => p.codigo)))].sort(),
    };
  };

  return {
    listarRoles: () => esperar(roles.map(conConteo)),
    listarPermisos: () => esperar(PERMISOS_MOCK),
    listarUsuarios: () => esperar(usuarios.map(exponerUsuario)),
    crearRol: ({ nombre, descripcion, permisosIds }) => {
      const n = nombre.trim().toUpperCase();
      if (roles.some((r) => r.nombre === n)) return fallar(409, `Ya existe un rol registrado con el nombre: ${n}`);
      const nuevo = { id: siguienteRol++, nombre: n, descripcion, permisos: porId(permisosIds) };
      roles = [...roles, nuevo];
      return esperar(conConteo(nuevo));
    },
    actualizarRol: (id, { nombre, descripcion, permisosIds }) => {
      roles = roles.map((r) => (r.id === id ? { ...r, nombre: nombre.trim().toUpperCase(), descripcion, permisos: porId(permisosIds) } : r));
      return esperar(conConteo(roles.find((r) => r.id === id)));
    },
    eliminarRol: (id) => {
      const rol = roles.find((r) => r.id === id);
      if (usuarios.some((u) => u.rolesIds.includes(id))) {
        return fallar(409, `No es posible eliminar el rol '${rol?.nombre}' porque tiene usuarios activos asignados.`);
      }
      roles = roles.filter((r) => r.id !== id);
      return esperar(undefined);
    },
    actualizarRolesUsuario: (usuarioId, rolesIds) => {
      usuarios = usuarios.map((u) => (u.usuarioId === usuarioId ? { ...u, rolesIds: [...rolesIds] } : u));
      return esperar(exponerUsuario(usuarios.find((u) => u.usuarioId === usuarioId)));
    },
  };
}
