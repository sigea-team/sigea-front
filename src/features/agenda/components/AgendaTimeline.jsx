import {
  Clock,
  Building,
  User,
  Calendar,
  Layers,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { formatearHora, agruparPorFecha } from '../agendaUtils';

/**
 * @file AgendaTimeline.jsx
 * @description Vista cronológica (Timeline) del desarrollo del evento (HU-21: Criterio 1).
 * Agrupa las actividades por día y las despliega en riguroso orden cronológico,
 * destacando actividades simultáneas paralelas, ponentes y salas.
 */
export default function AgendaTimeline({
  actividades = [],
  salas = [],
  ponentes = [],
  onEditar,
  onEliminar,
}) {
  const gruposPorDia = agruparPorFecha(actividades);

  if (gruposPorDia.length === 0) {
    return (
      <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-[#d8dadf] bg-white">
        <Calendar className="w-12 h-12 text-[#9ca0a6] mx-auto mb-3" />
        <p className="text-base font-semibold text-[#1f2023]">No hay actividades en el cronograma</p>
        <p className="text-xs text-[#5b5f66] mt-1 max-w-md mx-auto">
          Comienza programando las actividades de la agenda asignándoles sala, fecha, horario y ponente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {gruposPorDia.map((grupo) => (
        <section key={grupo.fecha} className="space-y-4">
          {/* Cabecera del día */}
          <div className="flex items-center gap-3 pb-2 border-b border-[#e5e7ea]">
            <div className="w-8 h-8 rounded-lg bg-[#a6192e]/10 text-[#a6192e] flex items-center justify-center font-bold text-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1f2023] capitalize">
                {grupo.fechaTexto}
              </h3>
              <p className="text-[11px] text-[#5b5f66]">
                {grupo.actividades.length} {grupo.actividades.length === 1 ? 'actividad programada' : 'actividades programadas'}
              </p>
            </div>
          </div>

          {/* Línea de tiempo de actividades */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#e5e7ea]">
            {grupo.actividades.map((act) => {
              const sala = salas.find((s) => String(s.id ?? s.salaId) === String(act.salaId));
              const ponente = ponentes.find((p) => {
                const pId = p.personaId ?? p.id;
                return String(pId) === String(act.ponenteId);
              });

              return (
                <div
                  key={act.id}
                  className={`relative p-4 rounded-xl border bg-white shadow-xs transition-all hover:shadow-sm ${
                    act.tieneAdvertencia
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-[#e5e7ea] hover:border-[#cfd2d7]'
                  }`}
                >
                  {/* Punto en la línea de tiempo */}
                  <span
                    className={`absolute -left-[27px] top-5 w-3 h-3 rounded-full border-2 border-white ring-2 ${
                      act.permiteSimultaneidad
                        ? 'bg-blue-600 ring-blue-100'
                        : 'bg-[#a6192e] ring-[#a6192e]/20'
                    }`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      {/* Metadatos superiores: Horario, Tipo, Modalidad y Simultaneidad */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 font-bold text-[#a6192e] bg-[#fbf0f2] px-2.5 py-0.5 rounded-md">
                          <Clock className="w-3.5 h-3.5" />
                          {formatearHora(act.horaInicio)} – {formatearHora(act.horaFin)}
                        </span>

                        {act.tipoActividadNombre && (
                          <span className="font-medium text-[#5b5f66] bg-[#f2f4f7] px-2 py-0.5 rounded-md text-[11px]">
                            {act.tipoActividadNombre}
                          </span>
                        )}

                        <span className="text-[11px] capitalize text-[#5b5f66] border border-[#e5e7ea] px-2 py-0.5 rounded-md">
                          {act.modalidad || 'Presencial'}
                        </span>

                        {act.permiteSimultaneidad && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            <Layers className="w-3 h-3 text-blue-600" />
                            Simultánea
                          </span>
                        )}

                        {act.tieneAdvertencia && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Advertencia de cruce
                          </span>
                        )}
                      </div>

                      {/* Título */}
                      <h4 className="text-sm font-bold text-[#1f2023] leading-snug">
                        {act.nombre}
                      </h4>

                      {/* Descripción opcional */}
                      {act.descripcion && (
                        <p className="text-xs text-[#5b5f66] line-clamp-2">
                          {act.descripcion}
                        </p>
                      )}

                      {/* Asignaciones: Sala y Ponente */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#5b5f66] pt-1">
                        <div className="flex items-center gap-1.5 font-medium text-[#1f2023]">
                          <Building className="w-3.5 h-3.5 text-[#a6192e]" />
                          <span>{sala?.nombre || act.salaNombre || `Sala #${act.salaId}`}</span>
                          {sala?.ubicacion && (
                            <span className="text-[11px] text-[#5b5f66] font-normal">
                              ({sala.ubicacion})
                            </span>
                          )}
                        </div>

                        {(ponente || act.ponenteNombre) && (
                          <div className="flex items-center gap-1.5 font-medium text-[#1f2023]">
                            <User className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              {ponente
                                ? `${ponente.nombres || ''} ${ponente.apellidos || ''}`.trim()
                                : act.ponenteNombre}
                            </span>
                            {ponente?.institucion && (
                              <span className="text-[11px] text-[#5b5f66] font-normal">
                                • {ponente.institucion}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción: Editar y Eliminar (Criterio 5) */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                      <button
                        type="button"
                        onClick={() => onEditar(act)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#5b5f66] hover:text-[#1f2023] hover:bg-[#f2f4f7] rounded-lg transition-colors cursor-pointer"
                        title="Modificar horario, sala o ponente (revalida conflictos)"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEliminar(act)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar actividad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
