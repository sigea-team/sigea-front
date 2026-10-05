/**
 * @file mockAuditoria.js
 * @description Datos simulados del log de auditoría para Storybook (HU-03).
 * La estructura coincide exactamente con las respuestas de GET /api/v1/auditoria.
 * @module features/auditoria/mockAuditoria
 */

export const TIPOS_OPERACION_MOCK = [
  { codigo: 'ROL_CREADO', modulo: 'ROLES', descripcion: 'Creación de un rol con sus permisos' },
  { codigo: 'ROL_ACTUALIZADO', modulo: 'ROLES', descripcion: 'Modificación de un rol o de sus permisos' },
  { codigo: 'ROL_ELIMINADO', modulo: 'ROLES', descripcion: 'Eliminación de un rol' },
  { codigo: 'USUARIO_REGISTRADO', modulo: 'USUARIOS', descripcion: 'Registro de una nueva cuenta de usuario' },
  { codigo: 'CONTRASENA_RESTABLECIDA', modulo: 'USUARIOS', descripcion: 'Restablecimiento de contraseña mediante token de recuperación' },
  { codigo: 'PRESUPUESTO_APROBADO', modulo: 'PRESUPUESTO', descripcion: 'Registro del presupuesto aprobado del evento (HU-08)' },
  { codigo: 'CONVOCATORIA_PUBLICADA', modulo: 'CONVOCATORIAS', descripcion: 'Publicación de una convocatoria (HU-11)' },
  { codigo: 'RESULTADOS_PUBLICADOS', modulo: 'EVALUACION', descripcion: 'Publicación de resultados de evaluación de propuestas (HU-18)' },
];

export const REGISTROS_AUDITORIA_MOCK = [
  {
    id: 15,
    fechaHora: '2026-09-28T16:42:10',
    usuarioId: 3,
    usuarioCorreo: 'admin@ufps.edu.co',
    usuarioNombre: 'Ana Pérez',
    accion: 'ROL_ACTUALIZADO',
    accionDescripcion: 'Modificación de un rol o de sus permisos',
    entidad: 'roles',
    entidadId: 4,
    detalle: JSON.stringify({
      antes: { nombre: 'EVALUADOR', descripcion: 'Comité evaluador', permisos: ['PROPUESTAS_VER'] },
      despues: {
        nombre: 'EVALUADOR',
        descripcion: 'Comité evaluador de ponencias',
        permisos: ['PROPUESTAS_EVALUAR', 'PROPUESTAS_VER'],
      },
    }),
  },
  {
    id: 14,
    fechaHora: '2026-09-28T15:05:47',
    usuarioId: 3,
    usuarioCorreo: 'admin@ufps.edu.co',
    usuarioNombre: 'Ana Pérez',
    accion: 'ROL_ELIMINADO',
    accionDescripcion: 'Eliminación de un rol',
    entidad: 'roles',
    entidadId: 7,
    detalle: JSON.stringify({
      antes: { nombre: 'ROL_TEMPORAL', descripcion: null, permisos: [] },
    }),
  },
  {
    id: 13,
    fechaHora: '2026-09-27T11:20:03',
    usuarioId: 9,
    usuarioCorreo: 'jperez@ufps.edu.co',
    usuarioNombre: 'Juan Pérez',
    accion: 'USUARIO_REGISTRADO',
    accionDescripcion: 'Registro de una nueva cuenta de usuario',
    entidad: 'usuarios',
    entidadId: 9,
    detalle: JSON.stringify({ correo: 'jperez@ufps.edu.co', rolInicial: 'PARTICIPANTE' }),
  },
  {
    id: 12,
    fechaHora: '2026-09-26T09:14:55',
    usuarioId: 3,
    usuarioCorreo: 'admin@ufps.edu.co',
    usuarioNombre: 'Ana Pérez',
    accion: 'ROL_CREADO',
    accionDescripcion: 'Creación de un rol con sus permisos',
    entidad: 'roles',
    entidadId: 6,
    detalle: JSON.stringify({
      despues: { nombre: 'COORDINADOR', descripcion: 'Coordinadores de evento', permisos: ['EVENTOS_CREAR', 'EVENTOS_VER'] },
    }),
  },
  {
    id: 11,
    fechaHora: '2026-09-25T18:30:12',
    usuarioId: 5,
    usuarioCorreo: 'mmahecha@ufps.edu.co',
    usuarioNombre: 'Michell Mahecha',
    accion: 'CONTRASENA_RESTABLECIDA',
    accionDescripcion: 'Restablecimiento de contraseña mediante token de recuperación',
    entidad: 'usuarios',
    entidadId: 5,
    detalle: JSON.stringify({ metodo: 'token_recuperacion' }),
  },
];

/**
 * Crea un servicio simulado que filtra y pagina los registros en memoria,
 * imitando el comportamiento del backend.
 * @param {Object} [opciones]
 * @param {Array} [opciones.registros]
 * @param {number} [opciones.retardoMs]
 * @param {unknown} [opciones.error] - Si se define, `buscar` siempre falla con este error.
 */
export function crearServicioMock({ registros = REGISTROS_AUDITORIA_MOCK, retardoMs = 400, error = null } = {}) {
  const esperar = (valor, fallar = false) =>
    new Promise((resolve, reject) => setTimeout(() => (fallar ? reject(valor) : resolve(valor)), retardoMs));

  return {
    tiposOperacion: () => esperar(TIPOS_OPERACION_MOCK),
    buscar: ({ correo, accion, desde, hasta, pagina = 0, tamano = 10 } = {}) => {
      if (error) return esperar(error, true);
      const filtrados = registros.filter((r) => {
        const dia = r.fechaHora.slice(0, 10);
        return (
          (!correo || (r.usuarioCorreo || '').toLowerCase().includes(correo.toLowerCase())) &&
          (!accion || r.accion === accion) &&
          (!desde || dia >= desde) &&
          (!hasta || dia <= hasta)
        );
      });
      const inicio = pagina * tamano;
      return esperar({
        contenido: filtrados.slice(inicio, inicio + tamano),
        pagina,
        tamano,
        totalElementos: filtrados.length,
        totalPaginas: Math.max(1, Math.ceil(filtrados.length / tamano)),
      });
    },
  };
}

/** Servicio que nunca responde, para mostrar el estado de carga. */
export const servicioCargandoMock = {
  tiposOperacion: () => Promise.resolve(TIPOS_OPERACION_MOCK),
  buscar: () => new Promise(() => {}),
};
