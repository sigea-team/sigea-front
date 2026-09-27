import React from 'react';
import { Check } from 'lucide-react';

/**
 * Módulos del sistema SIGEA para la asignación de permisos.
 */
export const MODULES_CONFIG = [
  { key: 'convocatorias', label: 'Convocatorias', description: 'Gestión de convocatorias de ponencias y artículos' },
  { key: 'eventos', label: 'Eventos', description: 'Programación y logística de eventos académicos' },
  { key: 'certificados', label: 'Certificados', description: 'Plantillas y emisión de constancias y diplomas' },
  { key: 'usuarios', label: 'Usuarios', description: 'Administración de cuentas de usuario y perfiles' },
  { key: 'reportes', label: 'Reportes', description: 'Generación de estadísticas e informes de eventos' },
];

/**
 * Acciones de permisos por módulo.
 */
export const PERMISSION_ACTIONS = [
  { key: 'read', label: 'Lectura', shortLabel: 'Ver' },
  { key: 'write', label: 'Escritura', shortLabel: 'Crear' },
  { key: 'edit', label: 'Edición', shortLabel: 'Editar' },
  { key: 'delete', label: 'Cierre/Eliminación', shortLabel: 'Eliminar' },
];

/**
 * Crea una matriz de permisos vacía o por defecto.
 */
export const createDefaultPermissions = (initialValue = false) => {
  const result = {};
  MODULES_CONFIG.forEach((mod) => {
    result[mod.key] = {
      read: initialValue,
      write: initialValue,
      edit: initialValue,
      delete: initialValue,
    };
  });
  return result;
};

/**
 * @file RolePermissionsMatrix.jsx
 * @description Matriz interactiva de permisos por módulo del sistema SIGEA.
 * Permite seleccionar individualmente o en lote los permisos de Lectura, Escritura, Edición y Cierre/Eliminación.
 * @module features/roles/components/RolePermissionsMatrix
 */
export default function RolePermissionsMatrix({
  permissions = createDefaultPermissions(),
  onChange,
  disabled = false,
  className = '',
}) {
  const handleToggle = (moduleKey, actionKey) => {
    if (disabled || !onChange) return;
    const currentModule = permissions[moduleKey] || { read: false, write: false, edit: false, delete: false };
    const updatedModule = {
      ...currentModule,
      [actionKey]: !currentModule[actionKey],
    };

    const updatedPermissions = {
      ...permissions,
      [moduleKey]: updatedModule,
    };

    onChange(updatedPermissions);
  };

  const handleToggleRow = (moduleKey) => {
    if (disabled || !onChange) return;
    const currentModule = permissions[moduleKey] || { read: false, write: false, edit: false, delete: false };
    const allChecked = PERMISSION_ACTIONS.every((action) => currentModule[action.key]);

    const updatedModule = {};
    PERMISSION_ACTIONS.forEach((action) => {
      updatedModule[action.key] = !allChecked;
    });

    onChange({
      ...permissions,
      [moduleKey]: updatedModule,
    });
  };

  const handleToggleColumn = (actionKey) => {
    if (disabled || !onChange) return;
    const allColumnChecked = MODULES_CONFIG.every(
      (mod) => permissions[mod.key] && permissions[mod.key][actionKey]
    );

    const updatedPermissions = { ...permissions };
    MODULES_CONFIG.forEach((mod) => {
      const currentMod = updatedPermissions[mod.key] || { read: false, write: false, edit: false, delete: false };
      updatedPermissions[mod.key] = {
        ...currentMod,
        [actionKey]: !allColumnChecked,
      };
    });

    onChange(updatedPermissions);
  };

  return (
    <div className={`w-full overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
              <th className="py-3.5 px-4 min-w-[180px]">Módulo</th>
              {PERMISSION_ACTIONS.map((action) => {
                const allColumnChecked = MODULES_CONFIG.every(
                  (mod) => permissions[mod.key] && permissions[mod.key][action.key]
                );
                return (
                  <th key={action.key} className="py-3.5 px-3 text-center min-w-[110px]">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleToggleColumn(action.key)}
                      className="group inline-flex items-center gap-1.5 hover:text-[#a6192e] transition-colors cursor-pointer disabled:cursor-not-allowed"
                      title={`Seleccionar/Desmarcar todo para ${action.label}`}
                    >
                      <span>{action.label}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] transition-colors ${
                          allColumnChecked
                            ? 'bg-[#a6192e] border-[#a6192e] text-white'
                            : 'border-[#d8dadf] group-hover:border-[#a6192e] bg-white'
                        }`}
                      >
                        {allColumnChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th className="py-3.5 px-4 text-right min-w-[120px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
            {MODULES_CONFIG.map((mod) => {
              const modulePerms = permissions[mod.key] || { read: false, write: false, edit: false, delete: false };
              const isRowFullyChecked = PERMISSION_ACTIONS.every((action) => modulePerms[action.key]);

              return (
                <tr key={mod.key} className="hover:bg-[#f7f7f8]/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#1f2023] text-sm">{mod.label}</div>
                    <div className="text-xs text-[#5b5f66] mt-0.5">{mod.description}</div>
                  </td>
                  {PERMISSION_ACTIONS.map((action) => {
                    const isChecked = !!modulePerms[action.key];
                    return (
                      <td key={action.key} className="py-3 px-3 text-center align-middle">
                        <label className="inline-flex items-center justify-center p-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={disabled}
                            onChange={() => handleToggle(mod.key, action.key)}
                            className="sr-only"
                          />
                          <span
                            className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-[#a6192e] border-[#a6192e] text-white shadow-xs'
                                : 'bg-white border-[#d8dadf] hover:border-[#a6192e]'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </span>
                        </label>
                      </td>
                    );
                  })}
                  <td className="py-3 px-4 text-right align-middle">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleToggleRow(mod.key)}
                      className="text-xs font-semibold text-[#a6192e] hover:text-[#7a0c1e] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRowFullyChecked ? 'Desmarcar fila' : 'Marcar fila'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
