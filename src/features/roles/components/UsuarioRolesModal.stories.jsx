import UsuarioRolesModal from './UsuarioRolesModal';
import { PERMISOS_MOCK } from '../mocks/rolesMock';

const ROLES = [
  { id: 1, nombre: 'ADMIN', descripcion: 'Administrador del sistema', permisos: [] },
  { id: 2, nombre: 'PARTICIPANTE', descripcion: 'Asistente a eventos', permisos: [] },
  { id: 3, nombre: 'EVALUADOR', descripcion: 'Par evaluador', permisos: PERMISOS_MOCK.filter((p) => p.codigo === 'PROPUESTAS_EVALUAR') },
];

export default {
  title: 'Features/Roles/UsuarioRolesModal',
  component: UsuarioRolesModal,
  tags: ['autodocs'],
  args: { roles: ROLES, onClose: () => {}, onSave: () => {} },
};

export const UsuarioSinEvaluador = {
  args: {
    usuario: { usuarioId: 3, nombreCompleto: 'Luis Gómez', correo: 'luis@ufps.edu.co', roles: [{ id: 2, nombre: 'PARTICIPANTE' }] },
  },
};

export const UsuarioEvaluador = {
  args: {
    usuario: {
      usuarioId: 2,
      nombreCompleto: 'Ana Pérez',
      correo: 'ana@ufps.edu.co',
      roles: [{ id: 2, nombre: 'PARTICIPANTE' }, { id: 3, nombre: 'EVALUADOR' }],
    },
  },
};
