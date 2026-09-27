import React from 'react';
import { X, ShieldAlert, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import Button from '../../../components/ui/Button';

/**
 * @file RoleDeleteModal.jsx
 * @description Modal de restricción y confirmación de eliminación de roles en SIGEA.
 * Cumple con Criterio 3:
 * - Despliega un diálogo de advertencia bloqueante si el rol tiene usuarios activos asignados (>0),
 *   con un enlace/botón rápido hacia la gestión de usuarios para reasignar.
 * - Solicita confirmación estándar si el rol no tiene usuarios asignados (0).
 * @module features/roles/components/RoleDeleteModal
 */
export default function RoleDeleteModal({
  isOpen,
  role = null,
  onClose,
  onConfirmDelete,
  onNavigateToUsers,
}) {
  if (!isOpen || !role) return null;

  const tieneUsuariosAsignados = (role.usuariosAsignados || 0) > 0;
  const nombreRol = role.label || role.nombre || 'Seleccionado';
  const cantidadUsuarios = role.usuariosAsignados || 0;

  const handleQuickReassign = () => {
    if (onNavigateToUsers) {
      onNavigateToUsers(role);
    } else {
      alert(`Redirigiendo a la Gestión de Usuarios para reasignar a los ${cantidadUsuarios} usuarios del rol '${nombreRol}'...`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-[16px] shadow-2xl border border-[#e5e7ea] flex flex-col overflow-hidden">
        {/* Header del Modal */}
        <div className="px-6 py-5 border-b border-[#e5e7ea] flex items-center justify-between shrink-0 bg-[#f7f7f8]/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                tieneUsuariosAsignados
                  ? 'bg-[#fdecec] text-[#a6192e]'
                  : 'bg-[#fdecec] text-[#a6192e]'
              }`}
            >
              {tieneUsuariosAsignados ? (
                <ShieldAlert className="w-5 h-5 text-[#a6192e]" />
              ) : (
                <Trash2 className="w-5 h-5 text-[#a6192e]" />
              )}
            </div>
            <div>
              <h2 className="font-serif-title text-xl text-[#1f2023] leading-tight">
                {tieneUsuariosAsignados ? 'Impedimento de Eliminación' : 'Eliminar Rol de Usuario'}
              </h2>
              <p className="text-xs text-[#5b5f66] mt-0.5">
                {tieneUsuariosAsignados
                  ? 'Acción restringida por integridad de cuentas'
                  : 'Confirmación de eliminación permanente'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#5b5f66] hover:text-[#1f2023] hover:bg-[#e5e7ea]/60 rounded-full transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido según Criterio 3 */}
        <div className="p-6 space-y-4">
          {tieneUsuariosAsignados ? (
            /* CASO BLOQUEANTE: Tiene usuarios asignados */
            <div className="space-y-4">
              <div className="p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-[#7a0c1e]">
                  <AlertTriangle className="w-5 h-5 text-[#a6192e] shrink-0" />
                  <span>No es posible eliminar el rol {nombreRol}</span>
                </div>
                <p className="text-xs leading-relaxed text-[#7a0c1e]">
                  No es posible eliminar el rol <strong className="font-bold">{nombreRol}</strong> porque tiene{' '}
                  <span className="font-bold underline decoration-[#a6192e]">{cantidadUsuarios} usuario(s) activo(s) asignado(s)</span>.
                  Reasigna estos usuarios a otro rol antes de continuar.
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] bg-[#f7f7f8] border border-[#e5e7ea] flex items-center justify-between text-xs text-[#5b5f66]">
                <span>Usuarios activos con este rol:</span>
                <span className="font-bold text-[#1f2023] bg-white px-2.5 py-1 rounded-full border border-[#d8dadf]">
                  {cantidadUsuarios} usuario(s)
                </span>
              </div>
            </div>
          ) : (
            /* CASO ESTÁNDAR: Sin usuarios asignados */
            <div className="space-y-3">
              <p className="text-sm text-[#1f2023] leading-relaxed">
                ¿Está seguro de que desea eliminar el rol <strong className="font-semibold text-[#a6192e]">{nombreRol}</strong>?
              </p>
              <p className="text-xs text-[#5b5f66] bg-[#f7f7f8] p-3 rounded-[8px] border border-[#e5e7ea]">
                Esta acción es irreversible. El rol será eliminado permanentemente del sistema de permisos y ya no estará disponible para nuevas asignaciones.
              </p>
            </div>
          )}
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="px-6 py-4 border-t border-[#e5e7ea] bg-[#f7f7f8]/50 flex items-center justify-end gap-3 shrink-0">
          {tieneUsuariosAsignados ? (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Entendido
              </Button>
              <Button type="button" variant="primary" onClick={handleQuickReassign}>
                <span>Ir a Gestión de Usuarios</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => onConfirmDelete(role)}
                className="bg-[#a6192e] hover:bg-[#7a0c1e]"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                <span>Eliminar Rol</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
