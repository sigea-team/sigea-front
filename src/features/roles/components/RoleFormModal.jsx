import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, Shield, AlertTriangle } from 'lucide-react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import RolePermisosSelector from './RolePermisosSelector';
import { validarRol } from '../rolUtils';

/**
 * @file RoleFormModal.jsx
 * @description Modal de creación y edición de roles con los permisos reales del sistema (HU-02).
 * Criterio 1: crear/editar un rol con sus permisos. Criterio 2: advierte que los cambios afectan de inmediato
 * a los usuarios que ya tienen el rol.
 * Se monta solo cuando está abierto (el padre usa una `key` por rol), así el estado inicial sale de las props.
 * @module features/roles/components/RoleFormModal
 */
export default function RoleFormModal({
  isOpen,
  onClose,
  onSave,
  role = null,
  permisosCatalogo = [],
  guardando = false,
  errorGuardado = null,
}) {
  const isEditing = Boolean(role?.id);
  const [nombre, setNombre] = useState(role?.nombre || '');
  const [descripcion, setDescripcion] = useState(role?.descripcion || '');
  const [permisosIds, setPermisosIds] = useState(() => (role?.permisos || []).map((p) => p.id));
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    const nuevosErrores = validarRol({ nombre, descripcion });
    setErrors(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;
    onSave({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, permisosIds });
  };

  const usuariosAfectados = role?.totalUsuariosAsignados || 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-rol"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-3xl bg-white rounded-[16px] shadow-2xl border border-[#e5e7ea] flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e5e7ea] flex items-center justify-between shrink-0 bg-[#f7f7f8]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="titulo-modal-rol" className="font-serif-title text-xl text-[#1f2023] leading-tight">
                {isEditing ? `Editar Rol: ${role.nombre}` : 'Crear Nuevo Rol'}
              </h2>
              <p className="text-xs text-[#5b5f66] mt-0.5">
                {isEditing
                  ? 'Modifica el nombre, la descripción y los permisos de este rol.'
                  : 'Define el nombre del rol y los permisos que otorga.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="p-2 text-[#5b5f66] hover:text-[#1f2023] hover:bg-[#e5e7ea]/60 rounded-full transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="form-rol" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {isEditing && usuariosAfectados > 0 && (
            <div className="p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/20 text-[#7a0c1e] text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#a6192e] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Advertencia de propagación de permisos</p>
                <p className="mt-0.5">
                  Los cambios afectarán de inmediato a <strong>{usuariosAfectados} usuario(s)</strong> con este rol; sus
                  sesiones abiertas se cerrarán y deberán volver a iniciar sesión.
                </p>
              </div>
            </div>
          )}

          {errorGuardado && (
            <div role="alert" className="p-3 rounded-[8px] bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e] text-sm">
              {errorGuardado}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nombre del Rol"
              id="nombre-rol"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: null }));
              }}
              placeholder="Ej. EVALUADOR"
              required
              disabled={guardando}
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
                disabled={guardando}
                placeholder="Describe el alcance y responsabilidades de este rol..."
                className="w-full p-3 rounded-[8px] bg-white text-sm text-[#1f2023] placeholder-[#9ca0a6] border border-[#d8dadf] hover:border-[#9ca0a6] focus:border-[#a6192e] focus:ring-1 focus:ring-[#a6192e] outline-none transition-colors"
              />
              {errors.descripcion && <p className="text-xs text-[#b42318]">{errors.descripcion}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[#1f2023]">Permisos del rol</span>
              <span className="text-xs text-[#5b5f66]">{permisosIds.length} seleccionado(s)</span>
            </div>
            <p className="text-xs text-[#5b5f66]">
              Para que los usuarios de este rol puedan ingresar como Evaluador, marca «Evaluar propuestas mediante rúbricas».
            </p>
            <RolePermisosSelector
              permisos={permisosCatalogo}
              seleccionados={permisosIds}
              onChange={setPermisosIds}
              disabled={guardando}
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-[#e5e7ea] bg-[#f7f7f8]/50 flex items-center justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-rol" variant="primary" loading={guardando} disabled={guardando}>
            {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
          </Button>
        </div>
      </div>
    </div>
  );
}

RoleFormModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  role: PropTypes.object,
  permisosCatalogo: PropTypes.array,
  guardando: PropTypes.bool,
  errorGuardado: PropTypes.string,
};
