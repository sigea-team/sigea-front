import { Users, Edit3, Trash2, Mail, Building } from 'lucide-react';
import { INFO_ROL_AUTOR, ROLES_AUTOR } from '../propuestaUtils';

/**
 * @file AutoresList.jsx
 * @description Lista y tabla de autores asociados a una propuesta.
 * Satisface:
 * - Criterio 2: Dado que una propuesta tiene varios autores, cuando registro cada uno con su rol
 *   específico (autor principal, coautor, ponente), entonces el sistema los guarda diferenciadamente.
 * @module features/propuestas/components/AutoresList
 */

/**
 * @typedef {Object} AutorPropuesta
 * @property {string|number} id - Identificador único temporal o definitivo del autor.
 * @property {string} nombreCompleto - Nombre completo del autor o ponente.
 * @property {string} correo - Correo electrónico de contacto.
 * @property {string} filiacion - Filiación institucional.
 * @property {'AUTOR_PRINCIPAL'|'COAUTOR'|'PONENTE'} rol - Rol específico en la propuesta (Criterio 2).
 */

/**
 * Tabla y lista de autores asociados a una propuesta.
 * @param {Object} props
 * @param {Array<AutorPropuesta>} [props.autores=[]] - Lista de autores vinculados a la propuesta.
 * @param {function(AutorPropuesta): void} [props.onEditar] - Callback al solicitar editar un autor.
 * @param {function(string|number): void} [props.onEliminar] - Callback al eliminar un autor.
 * @param {boolean} [props.disabled=false] - Indica si las acciones están inhabilitadas.
 * @returns {JSX.Element}
 */
export default function AutoresList({
  autores = [],
  onEditar,
  onEliminar,
  disabled = false,
}) {
  if (!autores || autores.length === 0) {
    return (
      <div className="text-center py-8 px-4 border-2 border-dashed border-[#e5e7ea] rounded-[16px] bg-[#f7f7f8]/60">
        <Users className="w-10 h-10 mx-auto text-[#9ca0a6] mb-2" />
        <p className="text-sm font-semibold text-[#1f2023]">
          Aún no se han registrado autores o ponentes
        </p>
        <p className="text-xs text-[#5b5f66] mt-1 max-w-sm mx-auto">
          Diligencie el formulario superior para asociar los datos del autor principal, coautores o ponentes a esta propuesta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#5b5f66] flex items-center gap-2">
          <span>Autores registrados ({autores.length})</span>
        </h4>
        <span className="text-[11px] text-[#5b5f66]">
          {autores.some((a) => a.rol === ROLES_AUTOR.AUTOR_PRINCIPAL) ? (
            <span className="text-emerald-700 font-medium">✓ Autor principal definido</span>
          ) : (
            <span className="text-amber-700 font-medium">⚠ Sin autor principal asignado</span>
          )}
        </span>
      </div>

      <div className="divide-y divide-[#e5e7ea] border border-[#e5e7ea] rounded-[16px] bg-white overflow-hidden shadow-2xs">
        {autores.map((autor, index) => {
          const infoRol = INFO_ROL_AUTOR[autor.rol] || {
            label: autor.rol,
            bg: 'bg-[#f7f7f8]',
            text: 'text-[#1f2023]',
            border: 'border-[#e5e7ea]',
          };

          return (
            <div
              key={autor.id || index}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f7f7f8]/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-semibold text-[#1f2023] truncate">
                    {autor.nombreCompleto}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${infoRol.bg} ${infoRol.text} ${infoRol.border}`}
                  >
                    {infoRol.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5 text-xs text-[#5b5f66]">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#9ca0a6]" />
                    {autor.correo}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#9ca0a6]" />
                    {autor.filiacion}
                  </span>
                </div>
              </div>

              {!disabled && (
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditar && onEditar(autor)}
                    className="p-1.5 text-[#5b5f66] hover:text-[#a6192e] hover:bg-[#fdecec] rounded-[8px] transition-colors cursor-pointer"
                    title="Editar datos de este autor"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEliminar && onEliminar(autor.id)}
                    className="p-1.5 text-[#5b5f66] hover:text-[#a6192e] hover:bg-[#fdecec] rounded-[8px] transition-colors cursor-pointer"
                    title="Eliminar autor de la propuesta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
