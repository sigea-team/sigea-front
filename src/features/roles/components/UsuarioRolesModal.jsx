import { useState } from 'react';
import PropTypes from 'prop-types';
import { X, UserCog, Check, ClipboardCheck } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { esRolEvaluador } from '../rolUtils';

/**
 * @file UsuarioRolesModal.jsx
 * @description Asignación de roles a un usuario por parte del administrador (HU-02). Marcar un rol con el permiso
 * PROPUESTAS_EVALUAR habilita al usuario para ingresar con el perfil «Evaluador».
 * Se monta solo cuando está abierto (el padre usa una `key` por usuario).
 * @module features/roles/components/UsuarioRolesModal
 */
export default function UsuarioRolesModal({ usuario, roles = [], onClose, onSave, guardando = false, errorGuardado = null }) {
  const [seleccion, setSeleccion] = useState(() => new Set((usuario?.roles || []).map((r) => r.id)));
  const [errorLocal, setErrorLocal] = useState(null);

  if (!usuario) return null;

  const alternar = (id) => {
    setErrorLocal(null);
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  const guardar = () => {
    if (seleccion.size === 0) {
      setErrorLocal('El usuario debe tener al menos un rol.');
      return;
    }
    onSave([...seleccion]);
  };

  const quedaraEvaluador = roles.some((r) => seleccion.has(r.id) && esRolEvaluador(r));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-roles-usuario"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg bg-white rounded-[16px] shadow-2xl border border-[#e5e7ea] flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e5e7ea] flex items-center justify-between bg-[#f7f7f8]/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center shrink-0">
              <UserCog className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="titulo-roles-usuario" className="font-serif-title text-xl text-[#1f2023] leading-tight truncate">
                Roles de {usuario.nombreCompleto}
              </h2>
              <p className="text-xs text-[#5b5f66] mt-0.5 truncate">{usuario.correo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar"
            className="p-2 text-[#5b5f66] hover:text-[#1f2023] hover:bg-[#e5e7ea]/60 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {(errorLocal || errorGuardado) && (
            <div role="alert" className="p-3 rounded-[8px] bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e] text-sm">
              {errorLocal || errorGuardado}
            </div>
          )}

          <ul className="space-y-2">
            {roles.map((rol) => {
              const activo = seleccion.has(rol.id);
              return (
                <li key={rol.id}>
                  <label
                    className={`flex items-start gap-3 p-3 rounded-[10px] border cursor-pointer transition-colors ${
                      activo ? 'border-[#a6192e]/40 bg-[#fdecec]/40' : 'border-[#e5e7ea] hover:bg-[#f7f7f8]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={activo}
                      disabled={guardando}
                      onChange={() => alternar(rol.id)}
                    />
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 w-5 h-5 shrink-0 rounded-[6px] border flex items-center justify-center ${
                        activo ? 'bg-[#a6192e] border-[#a6192e] text-white' : 'bg-white border-[#d8dadf]'
                      }`}
                    >
                      {activo && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#1f2023]">{rol.nombre}</span>
                        {esRolEvaluador(rol) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf3] text-[#027a48] border border-[#a6f4c5]">
                            <ClipboardCheck className="w-3 h-3" />
                            Habilita Evaluador
                          </span>
                        )}
                      </span>
                      {rol.descripcion && <span className="block text-xs text-[#5b5f66] mt-0.5">{rol.descripcion}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-[#5b5f66] bg-[#f7f7f8] border border-[#e5e7ea] rounded-[8px] p-3">
            {quedaraEvaluador
              ? 'Con estos roles el usuario podrá ingresar con el perfil Evaluador.'
              : 'Con estos roles el usuario NO podrá ingresar con el perfil Evaluador.'}{' '}
            Los cambios aplican de inmediato; el usuario verá las nuevas opciones al volver a iniciar sesión.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-[#e5e7ea] bg-[#f7f7f8]/50 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={guardar} loading={guardando} disabled={guardando}>
            Guardar roles
          </Button>
        </div>
      </div>
    </div>
  );
}

UsuarioRolesModal.propTypes = {
  usuario: PropTypes.object,
  roles: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  guardando: PropTypes.bool,
  errorGuardado: PropTypes.string,
};
