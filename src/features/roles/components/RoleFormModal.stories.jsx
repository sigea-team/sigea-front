import RoleFormModal from './RoleFormModal';
import { PERMISOS_MOCK } from '../mocks/rolesMock';

export default {
  title: 'Features/Roles/RoleFormModal',
  component: RoleFormModal,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    permisosCatalogo: PERMISOS_MOCK,
    onClose: () => {},
    onSave: () => {},
  },
};

export const CrearNuevoRol = {
  args: { role: null },
};

export const EditarRolConUsuarios = {
  args: {
    role: {
      id: 3,
      nombre: 'EVALUADOR',
      descripcion: 'Par evaluador de propuestas',
      totalUsuariosAsignados: 4,
      permisos: PERMISOS_MOCK.filter((p) => p.codigo === 'PROPUESTAS_EVALUAR'),
    },
  },
};

export const ErrorAlGuardar = {
  args: {
    role: null,
    errorGuardado: 'Ya existe un rol registrado con el nombre: EVALUADOR',
  },
};
