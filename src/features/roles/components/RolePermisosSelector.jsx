import PropTypes from 'prop-types';
import { Check } from 'lucide-react';
import { agruparPermisosPorModulo } from '../rolUtils';

/**
 * @file RolePermisosSelector.jsx
 * @description Selección de los permisos reales del sistema (catálogo de /api/v1/permisos) agrupados por módulo (HU-02).
 * @module features/roles/components/RolePermisosSelector
 */
export default function RolePermisosSelector({ permisos = [], seleccionados = [], onChange, disabled = false }) {
  const grupos = agruparPermisosPorModulo(permisos);
  const marcados = new Set(seleccionados);

  const cambiar = (ids, marcar) => {
    if (disabled || !onChange) return;
    const nuevo = new Set(marcados);
    ids.forEach((id) => (marcar ? nuevo.add(id) : nuevo.delete(id)));
    onChange([...nuevo]);
  };

  if (grupos.length === 0) {
    return (
      <p className="text-xs text-[#5b5f66] p-4 rounded-[12px] border border-[#e5e7ea] bg-[#f7f7f8]">
        No hay permisos disponibles en el catálogo.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {grupos.map((grupo) => {
        const ids = grupo.permisos.map((p) => p.id);
        const todos = ids.every((id) => marcados.has(id));
        return (
          <fieldset key={grupo.modulo} className="rounded-[12px] border border-[#e5e7ea] bg-white overflow-hidden">
            <legend className="sr-only">{grupo.etiqueta}</legend>
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#f7f7f8] border-b border-[#e5e7ea]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1f2023]">{grupo.etiqueta}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => cambiar(ids, !todos)}
                className="text-xs font-semibold text-[#a6192e] hover:underline disabled:opacity-50 cursor-pointer"
              >
                {todos ? 'Quitar todos' : 'Marcar todos'}
              </button>
            </div>
            <ul className="divide-y divide-[#e5e7ea]">
              {grupo.permisos.map((p) => {
                const activo = marcados.has(p.id);
                return (
                  <li key={p.id}>
                    <label className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#f7f7f8]/60">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={activo}
                        disabled={disabled}
                        onChange={() => cambiar([p.id], !activo)}
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
                        <span className="block text-sm text-[#1f2023]">{p.descripcion || p.codigo}</span>
                        <span className="block text-[11px] font-mono text-[#5b5f66]">{p.codigo}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}
    </div>
  );
}

RolePermisosSelector.propTypes = {
  permisos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      codigo: PropTypes.string.isRequired,
      modulo: PropTypes.string,
      descripcion: PropTypes.string,
    })
  ),
  seleccionados: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
