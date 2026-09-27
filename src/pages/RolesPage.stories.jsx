import React, { useState } from 'react';
import RolesPage, { INITIAL_ROLES } from './RolesPage';
import RoleFormModal from '../features/roles/components/RoleFormModal';
import RoleDeleteModal from '../features/roles/components/RoleDeleteModal';

export default {
  title: 'Pages/RolesPage',
  component: RolesPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const DefaultView = {
  args: {
    usuarioProp: { nombreCompleto: 'Admin SIGEA', rol: 'ADMIN' },
    initialRoles: INITIAL_ROLES,
  },
};

export const ModalCrearRolAbierto = {
  render: () => {
    return (
      <div>
        <RolesPage initialRoles={INITIAL_ROLES} />
        <RoleFormModal
          isOpen={true}
          role={null}
          onClose={() => {}}
          onSave={() => {}}
        />
      </div>
    );
  },
};

export const ModalEditarRolConPropagacion = {
  render: () => {
    const roleConUsuarios = INITIAL_ROLES.find((r) => r.usuariosAsignados > 0);
    return (
      <div>
        <RolesPage initialRoles={INITIAL_ROLES} />
        <RoleFormModal
          isOpen={true}
          role={roleConUsuarios}
          onClose={() => {}}
          onSave={() => {}}
        />
      </div>
    );
  },
};

export const AdvertenciaBloqueanteEliminacion = {
  render: () => {
    const roleConUsuarios = INITIAL_ROLES.find((r) => r.usuariosAsignados > 0);
    return (
      <div>
        <RolesPage initialRoles={INITIAL_ROLES} />
        <RoleDeleteModal
          isOpen={true}
          role={roleConUsuarios}
          onClose={() => {}}
          onConfirmDelete={() => {}}
          onNavigateToUsers={() => alert('Navegando a reasignación de usuarios...')}
        />
      </div>
    );
  },
};

export const ConfirmacionEliminacionPermitida = {
  render: () => {
    const roleSinUsuarios = INITIAL_ROLES.find((r) => r.usuariosAsignados === 0);
    return (
      <div>
        <RolesPage initialRoles={INITIAL_ROLES} />
        <RoleDeleteModal
          isOpen={true}
          role={roleSinUsuarios}
          onClose={() => {}}
          onConfirmDelete={(role) => alert(`Eliminando ${role.label}`)}
          onNavigateToUsers={() => {}}
        />
      </div>
    );
  },
};

export const InteractiveFullFlow = {
  render: () => {
    return <RolesPage initialRoles={INITIAL_ROLES} />;
  },
};
