import AuditoriaPage from './AuditoriaPage';
import { crearServicioMock, servicioCargandoMock } from '../features/auditoria/mockAuditoria';

const ADMIN = { nombreCompleto: 'Ana Pérez', rol: 'ADMIN', roles: ['ADMIN'] };

const servicioConDatos = crearServicioMock();
const servicioSinDatos = crearServicioMock({ registros: [] });
const servicioSinPermiso = crearServicioMock({
  error: { response: { status: 403, data: { message: 'No tiene permisos para realizar esta operación.' } } },
});
const servicioSinConexion = crearServicioMock({ error: { code: 'ERR_NETWORK' } });
const servicioPaginado = crearServicioMock({
  registros: Array.from({ length: 5 }).flatMap((_, lote) =>
    crearRegistrosLote(lote)
  ),
});

function crearRegistrosLote(lote) {
  return [
    {
      id: 100 - lote * 3,
      fechaHora: `2026-09-${String(28 - lote).padStart(2, '0')}T10:0${lote}:00`,
      usuarioId: 3,
      usuarioCorreo: 'admin@ufps.edu.co',
      usuarioNombre: 'Ana Pérez',
      accion: 'ROL_ACTUALIZADO',
      accionDescripcion: 'Modificación de un rol o de sus permisos',
      entidad: 'roles',
      entidadId: 4,
      detalle: JSON.stringify({ antes: { nombre: 'EVALUADOR' }, despues: { nombre: `EVALUADOR_${lote}` } }),
    },
    {
      id: 99 - lote * 3,
      fechaHora: `2026-09-${String(28 - lote).padStart(2, '0')}T09:0${lote}:00`,
      usuarioId: 10 + lote,
      usuarioCorreo: `participante${lote}@ufps.edu.co`,
      usuarioNombre: `Participante ${lote}`,
      accion: 'USUARIO_REGISTRADO',
      accionDescripcion: 'Registro de una nueva cuenta de usuario',
      entidad: 'usuarios',
      entidadId: 10 + lote,
      detalle: JSON.stringify({ correo: `participante${lote}@ufps.edu.co`, rolInicial: 'PARTICIPANTE' }),
    },
    {
      id: 98 - lote * 3,
      fechaHora: `2026-09-${String(28 - lote).padStart(2, '0')}T08:0${lote}:00`,
      usuarioId: null,
      usuarioCorreo: null,
      usuarioNombre: 'Sistema',
      accion: 'ROL_CREADO',
      accionDescripcion: 'Creación de un rol con sus permisos',
      entidad: 'roles',
      entidadId: 20 + lote,
      detalle: JSON.stringify({ despues: { nombre: `ROL_${lote}`, permisos: ['EVENTOS_VER'] } }),
    },
  ];
}

export default {
  title: 'Pages/AuditoriaPage',
  component: AuditoriaPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'HU-03 (RF56): log de auditoría de operaciones críticas. Solo lectura, con filtros por usuario, tipo de operación y fechas.',
      },
    },
  },
};

/** Criterios 1 y 2: listado con datos y filtros funcionales (en memoria). */
export const ConRegistros = {
  args: { usuarioProp: ADMIN, servicio: servicioConDatos },
};

/** Paginación con 15 registros (10 por página). */
export const Paginado = {
  args: { usuarioProp: ADMIN, servicio: servicioPaginado },
};

/** Sin registros para los filtros aplicados. */
export const SinResultados = {
  args: { usuarioProp: ADMIN, servicio: servicioSinDatos },
};

/** Estado de carga mientras responde el backend. */
export const Cargando = {
  args: { usuarioProp: ADMIN, servicio: servicioCargandoMock },
};

/** Usuario sin permiso AUDITORIA_VER: el backend responde 403. */
export const SinPermiso = {
  args: { usuarioProp: { nombreCompleto: 'Juan Pérez', rol: 'PARTICIPANTE' }, servicio: servicioSinPermiso },
};

/** Backend apagado o sin conexión. */
export const SinConexion = {
  args: { usuarioProp: ADMIN, servicio: servicioSinConexion },
};
