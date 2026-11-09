import {
  Layers,
  Pencil,
  Trash2,
  AlertTriangle,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { formatearHora } from '../agendaUtils';

/**
 * @file AgendaTabla.jsx
 * @description Vista tabular de las actividades de la agenda (HU-21). HU-22: marca las ubicadas por la generación
 * automática y permite devolverlas a «por programar» si se pasa `onDesprogramar`.
 */
export default function AgendaTabla({
  actividades = [],
  salas = [],
  ponentes = [],
  onEditar,
  onEliminar,
  onDesprogramar,
}) {
  if (actividades.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#d8dadf] bg-white text-xs text-[#5b5f66]">
        No hay actividades que coincidan con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e5e7ea] bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] font-bold text-[#1f2023] uppercase">
            <th className="py-3 px-4">Fecha y Horario</th>
            <th className="py-3 px-4">Actividad</th>
            <th className="py-3 px-4">Sala</th>
            <th className="py-3 px-4">Ponente</th>
            <th className="py-3 px-4">Modalidad</th>
            <th className="py-3 px-4 text-center">Simultánea</th>
            <th className="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7ea] text-[#1f2023]">
          {actividades.map((act) => {
            const sala = salas.find((s) => String(s.id ?? s.salaId) === String(act.salaId));
            const ponente = ponentes.find((p) => {
              const pId = p.personaId ?? p.id;
              return String(pId) === String(act.ponenteId);
            });

            return (
              <tr key={act.id} className="hover:bg-[#f7f7f8]/50 transition-colors">
                <td className="py-3 px-4 whitespace-nowrap">
                  <p className="font-semibold text-[#1f2023]">{act.fecha}</p>
                  <p className="text-[11px] text-[#5b5f66]">
                    {formatearHora(act.horaInicio)} – {formatearHora(act.horaFin)}
                  </p>
                </td>

                <td className="py-3 px-4 max-w-xs">
                  <p className="font-semibold text-[#1f2023] leading-snug">{act.nombre}</p>
                  {act.tipoActividadNombre && (
                    <span className="inline-block mt-0.5 text-[10px] text-[#5b5f66] bg-[#f2f4f7] px-1.5 py-0.2 rounded">
                      {act.tipoActividadNombre}
                    </span>
                  )}
                  {act.tieneAdvertencia && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-700">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>Con advertencia registrada</span>
                    </div>
                  )}
                  {act.asignacionAutomatica && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-[#5b5f66]">
                      <Sparkles className="w-3 h-3 text-[#a6192e]" />
                      <span>Ubicada automáticamente</span>
                    </div>
                  )}
                </td>

                <td className="py-3 px-4">
                  <p className="font-medium">{sala?.nombre || act.salaNombre || `Sala #${act.salaId}`}</p>
                  {sala?.ubicacion && (
                    <p className="text-[10px] text-[#5b5f66]">{sala.ubicacion}</p>
                  )}
                </td>

                <td className="py-3 px-4">
                  {ponente ? (
                    <div>
                      <p className="font-medium">
                        {`${ponente.nombres || ''} ${ponente.apellidos || ''}`.trim()}
                      </p>
                      {ponente.institucion && (
                        <p className="text-[10px] text-[#5b5f66]">{ponente.institucion}</p>
                      )}
                    </div>
                  ) : act.ponenteNombre ? (
                    <p className="font-medium">{act.ponenteNombre}</p>
                  ) : (
                    <span className="text-[#9ca0a6] italic">Sin ponente</span>
                  )}
                </td>

                <td className="py-3 px-4 capitalize whitespace-nowrap">
                  <span className="border border-[#e5e7ea] px-2 py-0.5 rounded text-[11px] text-[#5b5f66]">
                    {act.modalidad || 'Presencial'}
                  </span>
                </td>

                <td className="py-3 px-4 text-center whitespace-nowrap">
                  {act.permiteSimultaneidad ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      <Layers className="w-3 h-3 text-blue-600" />
                      Sí
                    </span>
                  ) : (
                    <span className="text-[#9ca0a6] text-[11px]">No</span>
                  )}
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEditar(act)}
                      className="p-1.5 text-[#5b5f66] hover:text-[#1f2023] hover:bg-[#f2f4f7] rounded cursor-pointer"
                      title="Editar actividad"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {onDesprogramar && (
                      <button
                        type="button"
                        onClick={() => onDesprogramar(act)}
                        className="p-1.5 text-[#5b5f66] hover:text-[#1f2023] hover:bg-[#f2f4f7] rounded cursor-pointer"
                        title="Devolver a por programar (quita fecha, horario y sala)"
                        aria-label={`Devolver «${act.nombre}» a por programar`}
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEliminar(act)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      title="Eliminar actividad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
