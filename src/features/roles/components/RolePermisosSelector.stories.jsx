import { useState } from 'react';
import RolePermisosSelector from './RolePermisosSelector';
import { PERMISOS_MOCK } from '../mocks/rolesMock';

export default {
  title: 'Features/Roles/RolePermisosSelector',
  component: RolePermisosSelector,
  tags: ['autodocs'],
};

export const Interactivo = {
  render: () => {
    const [seleccion, setSeleccion] = useState([5]);
    return <RolePermisosSelector permisos={PERMISOS_MOCK} seleccionados={seleccion} onChange={setSeleccion} />;
  },
};

export const Deshabilitado = {
  args: { permisos: PERMISOS_MOCK, seleccionados: [1, 2], disabled: true },
};
