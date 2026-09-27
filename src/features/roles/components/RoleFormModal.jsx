import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import RolePermissionsMatrix, { createDefaultPermissions } from './RolePermissionsMatrix';

/**
 * @file RoleFormModal.jsx
 * @description Modal de creación y edición de roles con asignación de permisos por módulo.
 * Cumple con Criterio 1 (Creación/Edición con matriz de permisos) y Criterio 2 (Aviso de propagación de cambios para roles con usuarios asignados).
 * @module features/roles/components/RoleFormModal
 */
export default function RoleFormModal({
  isOpen,
  onClose,
  onSave,
  role = null,
}) {
  const isEditing = Boolean(role && role.id);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [permissions, setPermissions] = useState(createDefaultPermissions());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (role) {
        setNombre(role.label || role.nombre || '');
        setDescripcion(role.description || role.descripcion || '');
        setPermissions(role.permissions || createDefaultPermissions());
      } else {
        setNombre('');
        setDescripcion('');
        setPermissions(createDefaultPermissions());
      }
      setErrors({});
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre del rol es obligatorio.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const rolePayload = {
      id: role?.id || Date.now(),
      name: role?.name || nombre.trim().toUpperCase().replace(/\s+/g, '_'),
      label: nombre.trim(),
      description: descripcion.trim(),
      usuariosAsignados: role ? role.usuariosAsignados || 0 : 0,
      isSystemRole: role ? Boolean(role.isSystemRole) : false,
      permissions,
    };

    onSave(rolePayload);
  };

  const usuariosAfectados = role?.usuariosAsignados || 0;
  const mostrarAlertaUsuarios = isEditing && usuariosAfectados > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-[16px] shadow-2xl border border-[#e5e7ea] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header del Modal */}
        <div className="px-6 py-5 border-b border-[#e5e7ea] flex items-center justify-between shrink-0 bg-[#f7f7f8]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl text-[#1f2023] leading-tight">
                {isEditing ? `Editar Rol: ${role.label || role.nombre}` : 'Crear Nuevo Rol'}
              </h2>
              <p className="text-xs text-[#5b5f66] mt-0.5">
                {isEditing
                  ? 'Modifica el nombre, descripción y privilegios otorgados a este rol.'
                  : 'Define las credenciales y accesos de seguridad por módulo.'}
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

        {/* Formulario / Contenido scrolleable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Criterio 2: Banner de Advertencia de Propagación Inmediata de Cambios */}
          {mostrarAlertaUsuarios && (
            <div className="p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] text-xs font-medium flex items-start gap-3 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-[#a6192e] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-[#7a0c1e]">Advertencia de propagación de permisos</p>
                <p className="mt-0.5 text-xs text-[#7a0c1e]">
                  Los cambios realizados afectarán inmediatamente a <strong className="font-bold underline decoration-[#a6192e]">{usuariosAfectados} usuario(s)</strong> con este rol asignado.
                </p>
              </div>
            </div>
          )}

          {/* Información Básica */}
          <div className="space-y-4">
            <Input
              label="Nombre del Rol"
              id="nombre-rol"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: null }));
              }}
              placeholder="Ej. Coordinador de Certificación"
              required
              error={errors.nombre}
            />

            <div className="flex flex-col gap-1.5 w-full">
              <label htmlFor="descripcion-rol" className="text-sm font-medium text-[#1f2023]">
                Descripción
              </label>
              <textarea
                id="descripcion-rol"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                placeholder="Describe el alcance y responsabilidades asociadas a este rol..."
                className="w-full p-3 rounded-[8px] bg-white text-sm text-[#1f2023] placeholder-[#9ca0a6] border border-[#d8dadf] hover:border-[#9ca0a6] focus:border-[#a6192e] focus:ring-1 focus:ring-[#a6192e] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Matriz de Permisos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#1f2023]">
                Matriz de Permisos por Módulo <span className="text-[#a6192e]">*</span>
              </label>
              <span className="text-xs text-[#5b5f66]">
                Marca los privilegios otorgados para cada sección
              </span>
            </div>
            <RolePermissionsMatrix
              permissions={permissions}
              onChange={(newPerms) => setPermissions(newPerms)}
            />
          </div>
        </form>

        {/* Pie del Modal con Acciones */}
        <div className="px-6 py-4 border-t border-[#e5e7ea] bg-[#f7f7f8]/50 flex items-center justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit}>
            {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
          </Button>
        </div>
      </div>
    </div>
  );
}
