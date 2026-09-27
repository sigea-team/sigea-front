import React, { useState } from 'react';
import RoleDeleteModal from './RoleDeleteModal';
import Button from '../../../components/ui/Button';

export default {
  title: 'Features/Roles/RoleDeleteModal',
  component: RoleDeleteModal,
  tags: ['autodocs'],
};

export const BloqueanteConUsuariosAsignados = {
  args: {
    isOpen: true,
    role: {
      id: 2,
      name: 'EVALUADOR',
      label: 'Comité Evaluador',
      usuariosAsignados: 12,
    },
    onClose: () => {},
    onConfirmDelete: () => {},
    onNavigateToUsers: () => alert('Redirigiendo a Gestión de Usuarios...'),
  },
};

export const ConfirmacionSinUsuariosAsignados = {
  args: {
    isOpen: true,
    role: {
      id: 5,
      name: 'GESTOR_CERTIFICADOS',
      label: 'Gestor de Certificados',
      usuariosAsignados: 0,
    },
    onClose: () => {},
    onConfirmDelete: (role) => alert(`Rol ${role.label} eliminado.`),
    onNavigateToUsers: () => {},
  },
};

export const InteractiveDemo = {
  render: () => {
    const [modalCase, setModalCase] = useState(null);

    return (
      <div className="p-6 space-x-4">
        <Button onClick={() => setModalCase('blocked')}>
          Probar Rol con 12 usuarios (Bloqueante)
        </Button>
        <Button variant="outline" onClick={() => setModalCase('allowed')}>
          Probar Rol con 0 usuarios (Permitido)
        </Button>

        {modalCase === 'blocked' && (
          <RoleDeleteModal
            isOpen={true}
            role={{ id: 1, label: 'Organizador de Eventos', usuariosAsignados: 8 }}
            onClose={() => setModalCase(null)}
            onNavigateToUsers={() => {
              alert('Navegando a reasignación de usuarios...');
              setModalCase(null);
            }}
          />
        )}

        {modalCase === 'allowed' && (
          <RoleDeleteModal
            isOpen={true}
            role={{ id: 2, label: 'Rol Temporal', usuariosAsignados: 0 }}
            onClose={() => setModalCase(null)}
            onConfirmDelete={(r) => {
              alert(`Rol ${r.label} eliminado exitosamente.`);
              setModalCase(null);
            }}
          />
        )}
      </div>
    );
  },
};
