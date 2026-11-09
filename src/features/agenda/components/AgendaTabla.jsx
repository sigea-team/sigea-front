import {
  Layers,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { formatearHora } from '../agendaUtils';

/**
 * @file AgendaTabla.jsx
 * @description Vista tabular de las actividades de la agenda (HU-21).
 */
export default function AgendaTabla({
  actividades = [],
  salas = [],
  ponentes = [],
  onEditar,
  onEliminar,
}) {
  if (actividades.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-field-border bg-white text-xs text-ink-600">
        No hay actividades que coincidan con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-surface-muted border-b border-border font-bold text-ink-900 uppercase">
            <th className="py-3 px-4">Fecha y Horario</th>
            <th className="py-3 px-4">Actividad</th>
            <th className="py-3 px-4">Sala</th>
            <th className="py-3 px-4">Ponente</th>
            <th className="py-3 px-4">Modalidad</th>
            <th className="py-3 px-4 text-center">Simultánea</th>
            <th className="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-ink-900">
          {actividades.map((act) => {
            const sala = salas.find((s) => String(s.id ?? s.salaId) === String(act.salaId));
            const ponente = ponentes.find((p) => {
              const pId = p.personaId ?? p.id;
              return String(pId) === String(act.ponenteId);
            });

            return (
              <tr key={act.id} className="hover:bg-surface-muted transition-colors">
                <td className="py-3 px-4 whitespace-nowrap">
                  <p className="font-semibold text-ink-900">{act.fecha}</p>
                  <p className="text-[11px] text-ink-600">
                    {formatearHora(act.horaInicio)} – {formatearHora(act.horaFin)}
                  </p>
                </td>

                <td className="py-3 px-4 max-w-xs">
                  <p className="font-semibold text-ink-900 leading-snug">{act.nombre}</p>
                  {act.tipoActividadNombre && (
                    <span className="inline-block mt-0.5 text-[10px] text-ink-600 bg-surface-muted px-1.5 py-0.2 rounded">
                      {act.tipoActividadNombre}
                    </span>
                  )}
                  {act.tieneAdvertencia && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-brand-700">
                      <AlertTriangle className="w-3 h-3 text-brand-600" />
                      <span>Con advertencia registrada</span>
                    </div>
                  )}
                </td>

                <td className="py-3 px-4">
                  <p className="font-medium">{sala?.nombre || act.salaNombre || `Sala #${act.salaId}`}</p>
                  {sala?.ubicacion && (
                    <p className="text-[10px] text-ink-600">{sala.ubicacion}</p>
                  )}
                </td>

                <td className="py-3 px-4">
                  {ponente ? (
                    <div>
                      <p className="font-medium">
                        {`${ponente.nombres || ''} ${ponente.apellidos || ''}`.trim()}
                      </p>
                      {ponente.institucion && (
                        <p className="text-[10px] text-ink-600">{ponente.institucion}</p>
                      )}
                    </div>
                  ) : act.ponenteNombre ? (
                    <p className="font-medium">{act.ponenteNombre}</p>
                  ) : (
                    <span className="text-ink-300 italic">Sin ponente</span>
                  )}
                </td>

                <td className="py-3 px-4 capitalize whitespace-nowrap">
                  <span className="border border-border px-2 py-0.5 rounded text-[11px] text-ink-600">
                    {act.modalidad || 'Presencial'}
                  </span>
                </td>

                <td className="py-3 px-4 text-center whitespace-nowrap">
                  {act.permiteSimultaneidad ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-600 bg-surface-muted border border-border px-2 py-0.5 rounded">
                      <Layers className="w-3 h-3 text-brand-600" />
                      Sí
                    </span>
                  ) : (
                    <span className="text-ink-300 text-[11px]">No</span>
                  )}
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEditar(act)}
                      className="p-1.5 text-ink-600 hover:text-ink-900 hover:bg-surface-muted rounded cursor-pointer"
                      title="Editar actividad"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEliminar(act)}
                      className="p-1.5 text-brand-700 hover:bg-brand-100 rounded cursor-pointer"
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
