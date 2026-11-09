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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-[16px] shadow-2xl border border-border flex flex-col overflow-hidden">
        {/* Header del Modal */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-surface-muted">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                tieneUsuariosAsignados
                  ? 'bg-brand-100 text-brand-600'
                  : 'bg-brand-100 text-brand-600'
              }`}
            >
              {tieneUsuariosAsignados ? (
                <ShieldAlert className="w-5 h-5 text-brand-600" />
              ) : (
                <Trash2 className="w-5 h-5 text-brand-600" />
              )}
            </div>
            <div>
              <h2 className="font-serif-title text-xl text-ink-900 leading-tight">
                {tieneUsuariosAsignados ? 'Impedimento de Eliminación' : 'Eliminar Rol de Usuario'}
              </h2>
              <p className="text-xs text-ink-600 mt-0.5">
                {tieneUsuariosAsignados
                  ? 'Acción restringida por integridad de cuentas'
                  : 'Confirmación de eliminación permanente'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-ink-600 hover:text-ink-900 hover:bg-border rounded-full transition-colors cursor-pointer"
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
              <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-brand-700">
                  <AlertTriangle className="w-5 h-5 text-brand-600 shrink-0" />
                  <span>No es posible eliminar el rol {nombreRol}</span>
                </div>
                <p className="text-xs leading-relaxed text-brand-700">
                  No es posible eliminar el rol <strong className="font-bold">{nombreRol}</strong> porque tiene{' '}
                  <span className="font-bold underline decoration-brand-600">{cantidadUsuarios} usuario(s) activo(s) asignado(s)</span>.
                  Reasigna estos usuarios a otro rol antes de continuar.
                </p>
              </div>

              <div className="p-3.5 rounded-[8px] bg-surface-muted border border-border flex items-center justify-between text-xs text-ink-600">
                <span>Usuarios activos con este rol:</span>
                <span className="font-bold text-ink-900 bg-white px-2.5 py-1 rounded-full border border-field-border">
                  {cantidadUsuarios} usuario(s)
                </span>
              </div>
            </div>
          ) : (
            /* CASO ESTÁNDAR: Sin usuarios asignados */
            <div className="space-y-3">
              <p className="text-sm text-ink-900 leading-relaxed">
                ¿Está seguro de que desea eliminar el rol <strong className="font-semibold text-brand-600">{nombreRol}</strong>?
              </p>
              <p className="text-xs text-ink-600 bg-surface-muted p-3 rounded-[8px] border border-border">
                Esta acción es irreversible. El rol será eliminado permanentemente del sistema de permisos y ya no estará disponible para nuevas asignaciones.
              </p>
            </div>
          )}
        </div>

        {/* Pie del Modal con Acciones */}
        <div className="px-6 py-4 border-t border-border bg-surface-muted flex items-center justify-end gap-3 shrink-0">
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
                className="bg-brand-600 hover:bg-brand-700"
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
