import AuditoriaDetalleModal from './AuditoriaDetalleModal';
import { REGISTROS_AUDITORIA_MOCK } from '../mockAuditoria';

const porAccion = (accion) => REGISTROS_AUDITORIA_MOCK.find((r) => r.accion === accion);

export default {
  title: 'Features/Auditoria/AuditoriaDetalleModal',
  component: AuditoriaDetalleModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { isOpen: true, onClose: () => {} },
};

/** "Cambiar un rol": comparación antes / después con campos modificados resaltados. */
export const RolActualizado = {
  args: { registro: porAccion('ROL_ACTUALIZADO') },
};

/** Creación: solo existe el valor registrado. */
export const RolCreado = {
  args: { registro: porAccion('ROL_CREADO') },
};

/** Eliminación: se conserva la evidencia de lo que se eliminó. */
export const RolEliminado = {
  args: { registro: porAccion('ROL_ELIMINADO') },
};

/** Detalle simple (lista de campos). */
export const UsuarioRegistrado = {
  args: { registro: porAccion('USUARIO_REGISTRADO') },
};

/** Registro sin datos adicionales. */
export const SinDetalle = {
  args: { registro: { ...porAccion('ROL_CREADO'), id: 1, detalle: null } },
};
