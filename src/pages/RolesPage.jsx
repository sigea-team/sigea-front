import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Users, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Lock
} from 'lucide-react';
import MainLayout from '../components/ui/MainLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import RoleFormModal from '../features/roles/components/RoleFormModal';
import RoleDeleteModal from '../features/roles/components/RoleDeleteModal';

/**
 * Datos iniciales de ejemplo para roles de SIGEA UFPS.
 */
export const INITIAL_ROLES = [
  {
    id: 1,
    name: 'ADMINISTRADOR',
    label: 'Administrador del Sistema',
    description: 'Acceso total a la configuración del sistema, gestión de usuarios, roles, parámetros globales y auditoría.',
    usuariosAsignados: 3,
    isSystemRole: true,
    permissions: {
      convocatorias: { read: true, write: true, edit: true, delete: true },
      eventos: { read: true, write: true, edit: true, delete: true },
      certificados: { read: true, write: true, edit: true, delete: true },
      usuarios: { read: true, write: true, edit: true, delete: true },
      reportes: { read: true, write: true, edit: true, delete: true },
    },
  },
  {
    id: 2,
    name: 'EVALUADOR',
    label: 'Comité Evaluador',
    description: 'Revisión, calificación y dictamen de ponencias y trabajos presentados en las convocatorias.',
    usuariosAsignados: 12,
    isSystemRole: false,
    permissions: {
      convocatorias: { read: true, write: false, edit: true, delete: false },
      eventos: { read: true, write: false, edit: false, delete: false },
      certificados: { read: true, write: false, edit: false, delete: false },
      usuarios: { read: false, write: false, edit: false, delete: false },
      reportes: { read: true, write: true, edit: false, delete: false },
    },
  },
  {
    id: 3,
    name: 'ORGANIZADOR',
    label: 'Organizador de Eventos',
    description: 'Creación, programación y logística de eventos académicos, control de inscritos y asistencia.',
    usuariosAsignados: 8,
    isSystemRole: false,
    permissions: {
      convocatorias: { read: true, write: true, edit: true, delete: false },
      eventos: { read: true, write: true, edit: true, delete: true },
      certificados: { read: true, write: true, edit: true, delete: false },
      usuarios: { read: true, write: false, edit: false, delete: false },
      reportes: { read: true, write: true, edit: false, delete: false },
    },
  },
  {
    id: 4,
    name: 'PARTICIPANTE',
    label: 'Participante / Asistente',
    description: 'Inscripción a eventos, carga de ponencias, consulta de agenda y descarga de certificados.',
    usuariosAsignados: 145,
    isSystemRole: false,
    permissions: {
      convocatorias: { read: true, write: true, edit: false, delete: false },
      eventos: { read: true, write: false, edit: false, delete: false },
      certificados: { read: true, write: false, edit: false, delete: false },
      usuarios: { read: false, write: false, edit: false, delete: false },
      reportes: { read: false, write: false, edit: false, delete: false },
    },
  },
  {
    id: 5,
    name: 'GESTOR_CERTIFICADOS',
    label: 'Gestor de Certificados',
    description: 'Diseño de plantillas, firma digital y emisión de certificados académicos.',
    usuariosAsignados: 0,
    isSystemRole: false,
    permissions: {
      convocatorias: { read: true, write: false, edit: false, delete: false },
      eventos: { read: true, write: false, edit: false, delete: false },
      certificados: { read: true, write: true, edit: true, delete: true },
      usuarios: { read: false, write: false, edit: false, delete: false },
      reportes: { read: true, write: false, edit: false, delete: false },
    },
  },
];

/**
 * @file RolesPage.jsx
 * @description Vista principal de Administración de Roles y Permisos para el rol ADMIN en SIGEA.
 * @module pages/RolesPage
 */
export default function RolesPage({
  usuarioProp = { nombreCompleto: 'Administrador UFPS', rol: 'ADMIN' },
  initialRoles = INITIAL_ROLES,
  onSelectNav,
}) {
  const [roles, setRoles] = useState(initialRoles);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado de modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);

  // Banner / Toast de notificación (Criterio 2 y Feedback general)
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setIsFormModalOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (role) => {
    setDeletingRole(role);
  };

  const handleSaveRole = (roleData) => {
    const isEditing = roles.some((r) => r.id === roleData.id);

    if (isEditing) {
      setRoles((prev) => prev.map((r) => (r.id === roleData.id ? roleData : r)));
      
      // Criterio 2: Al editar permisos de un rol con usuarios asociados
      if (roleData.usuariosAsignados > 0) {
        showNotification(
          'warning',
          `Los cambios realizados afectarán inmediatamente a ${roleData.usuariosAsignados} usuario(s) con este rol asignado.`
        );
      } else {
        showNotification('success', `El rol "${roleData.label}" ha sido actualizado exitosamente.`);
      }
    } else {
      setRoles((prev) => [...prev, roleData]);
      showNotification('success', `El rol "${roleData.label}" ha sido creado y está disponible para la asignación.`);
    }

    setIsFormModalOpen(false);
    setEditingRole(null);
  };

  const handleConfirmDeleteRole = (roleToDelete) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
    setDeletingRole(null);
    showNotification('success', `El rol "${roleToDelete.label}" ha sido eliminado exitosamente.`);
  };

  const handleNavigateToUsers = (role) => {
    setDeletingRole(null);
    showNotification(
      'info',
      `Redirigiendo a Gestión de Usuarios para reasignar a los ${role.usuariosAsignados} usuario(s) del rol '${role.label}'...`
    );
  };

  // Filtrado de roles
  const filteredRoles = roles.filter((role) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      role.label.toLowerCase().includes(query) ||
      role.name.toLowerCase().includes(query) ||
      role.description.toLowerCase().includes(query)
    );
  });

  return (
    <MainLayout
      title="Administración de Roles y Permisos"
      activeNav="roles"
      onSelectNav={onSelectNav}
      usuario={usuarioProp}
    >
      <div className="space-y-6">
        {/* Banner Flotante / Notificación de Propagación de Cambios (Criterio 2) */}
        {notification && (
          <div
            className={`p-4 rounded-[12px] border text-xs sm:text-sm font-medium flex items-center justify-between shadow-sm transition-all duration-200 ${
              notification.type === 'warning'
                ? 'bg-[#fdecec] border-[#a6192e]/30 text-[#7a0c1e]'
                : notification.type === 'success'
                ? 'bg-[#edf7ed] border-[#2e7d32]/30 text-[#1b5e20]'
                : 'bg-[#e3f2fd] border-[#1976d2]/30 text-[#0d47a1]'
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-[#a6192e] shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#2e7d32] shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 hover:opacity-75 cursor-pointer ml-4"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Encabezado Superior de la Vista */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e5e7ea]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              SIGEA — Control de Acceso
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl text-[#1f2023] mt-1 tracking-tight">
              Administración de Roles y Permisos
            </h2>
            <p className="text-sm text-[#5b5f66] mt-1">
              Gestiona los roles de usuario del sistema, sus descripciones y la matriz de permisos por módulo.
            </p>
          </div>

          {/* Botón "+ Crear Nuevo Rol" */}
          <div className="shrink-0">
            <Button
              type="button"
              variant="primary"
              onClick={handleCreateRole}
              className="w-full sm:w-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Rol</span>
            </Button>
          </div>
        </div>

        {/* Barra de Filtro y Búsqueda */}
        <div className="flex items-center justify-between gap-4">
          <div className="w-full max-w-sm">
            <Input
              id="buscar-rol"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar rol por nombre o descripción..."
              rightElement={<Search className="w-4 h-4 text-[#5b5f66]" />}
            />
          </div>
          <div className="text-xs text-[#5b5f66] font-medium hidden sm:block">
            Total de roles: <span className="font-bold text-[#1f2023]">{filteredRoles.length}</span>
          </div>
        </div>

        {/* Tabla de Roles Existentes */}
        <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
                  <th className="py-3.5 px-6">Nombre del Rol</th>
                  <th className="py-3.5 px-6">Descripción</th>
                  <th className="py-3.5 px-6 text-center">Usuarios Asignados</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 px-6 text-center text-[#5b5f66]">
                      <p className="font-semibold text-base text-[#1f2023]">No se encontraron roles</p>
                      <p className="text-xs mt-1 text-[#9ca0a6]">
                        Prueba con otros términos de búsqueda o crea un nuevo rol.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => {
                    const tieneUsuarios = (role.usuariosAsignados || 0) > 0;

                    return (
                      <tr key={role.id} className="hover:bg-[#f7f7f8]/50 transition-colors">
                        {/* Column 1: Nombre del Rol */}
                        <td className="py-4 px-6 align-middle">
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-[#1f2023] text-base">
                              {role.label}
                            </span>
                            {role.isSystemRole && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fdecec] text-[#a6192e] border border-[#a6192e]/20"
                                title="Rol base del sistema"
                              >
                                <Lock className="w-3 h-3" />
                                Sistema
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-[#5b5f66] block mt-0.5 uppercase tracking-wider">
                            ID: {role.name}
                          </span>
                        </td>

                        {/* Column 2: Descripción */}
                        <td className="py-4 px-6 align-middle max-w-md">
                          <p className="text-xs text-[#5b5f66] leading-relaxed line-clamp-2">
                            {role.description}
                          </p>
                        </td>

                        {/* Column 3: Usuarios Asignados */}
                        <td className="py-4 px-6 align-middle text-center">
                          <span
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                              tieneUsuarios
                                ? 'bg-[#f7f7f8] text-[#1f2023] border-[#e5e7ea]'
                                : 'bg-[#edeeef] text-[#9ca0a6] border-[#d8dadf]'
                            }`}
                          >
                            <Users className={`w-3.5 h-3.5 ${tieneUsuarios ? 'text-[#a6192e]' : 'text-[#9ca0a6]'}`} />
                            {role.usuariosAsignados} usuario(s)
                          </span>
                        </td>

                        {/* Column 4: Acciones */}
                        <td className="py-4 px-6 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditRole(role)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-semibold text-[#1f2023] bg-white border border-[#d8dadf] hover:bg-[#f7f7f8] hover:border-[#9ca0a6] transition-colors cursor-pointer"
                              title="Editar rol y permisos"
                            >
                              <Pencil className="w-3.5 h-3.5 text-[#5b5f66]" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(role)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-semibold text-[#a6192e] bg-[#fdecec]/50 border border-[#a6192e]/20 hover:bg-[#fdecec] transition-colors cursor-pointer"
                              title="Eliminar rol"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#a6192e]" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Crear / Editar Rol */}
      <RoleFormModal
        isOpen={isFormModalOpen}
        role={editingRole}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveRole}
      />

      {/* Modal de Eliminación / Advertencia Bloqueante */}
      <RoleDeleteModal
        isOpen={Boolean(deletingRole)}
        role={deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirmDelete={handleConfirmDeleteRole}
        onNavigateToUsers={handleNavigateToUsers}
      />
    </MainLayout>
  );
}
