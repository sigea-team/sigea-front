import React, { useState } from 'react';
import RoleFormModal from './RoleFormModal';
import Button from '../../../components/ui/Button';

export default {
  title: 'Features/Roles/RoleFormModal',
  component: RoleFormModal,
  tags: ['autodocs'],
};

export const CrearNuevoRol = {
  args: {
    isOpen: true,
    role: null,
    onClose: () => {},
    onSave: (data) => alert(`Rol creado: ${JSON.stringify(data.label)}`),
  },
};

export const EditarRolSinUsuarios = {
  args: {
    isOpen: true,
    role: {
      id: 5,
      name: 'GESTOR_CERTIFICADOS',
      label: 'Gestor de Certificados',
      description: 'Diseño de plantillas, firma digital y emisión de certificados académicos.',
      usuariosAsignados: 0,
      permissions: {
        convocatorias: { read: true, write: false, edit: false, delete: false },
        eventos: { read: true, write: false, edit: false, delete: false },
        certificados: { read: true, write: true, edit: true, delete: true },
        usuarios: { read: false, write: false, edit: false, delete: false },
        reportes: { read: true, write: false, edit: false, delete: false },
      },
    },
    onClose: () => {},
    onSave: (data) => alert(`Guardado: ${JSON.stringify(data.label)}`),
  },
};

export const EditarRolConUsuariosPropagacion = {
  args: {
    isOpen: true,
    role: {
      id: 2,
      name: 'EVALUADOR',
      label: 'Comité Evaluador',
      description: 'Revisión, calificación y dictamen de ponencias y trabajos.',
      usuariosAsignados: 12,
      permissions: {
        convocatorias: { read: true, write: false, edit: true, delete: false },
        eventos: { read: true, write: false, edit: false, delete: false },
        certificados: { read: true, write: false, edit: false, delete: false },
        usuarios: { read: false, write: false, edit: false, delete: false },
        reportes: { read: true, write: true, edit: false, delete: false },
      },
    },
    onClose: () => {},
    onSave: (data) => alert(`Guardado: ${JSON.stringify(data.label)}`),
  },
};

export const InteractiveState = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="p-6">
        <Button onClick={() => setIsOpen(true)}>Abrir Modal de Rol</Button>
        <RoleFormModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSave={(data) => {
            alert(`Guardado exitosamente: ${data.label}`);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};
