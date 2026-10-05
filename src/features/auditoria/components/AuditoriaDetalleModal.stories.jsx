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

/** JSON con forma inesperada (arreglo): se muestra como "detalle no estructurado". */
export const DetalleNoEstructurado = {
  args: { registro: { ...porAccion('ROL_CREADO'), id: 2, detalle: JSON.stringify([{ a: 1 }, 'texto']) } },
};

/** Detalle que no es JSON: se muestra tal cual para no perder la evidencia. */
export const DetalleTextoPlano = {
  args: { registro: { ...porAccion('ROL_CREADO'), id: 3, detalle: 'registro antiguo sin formato' } },
};
