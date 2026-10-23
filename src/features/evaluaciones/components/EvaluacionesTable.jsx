import PropTypes from 'prop-types';
import {
  ClipboardCheck,
  Award,
  Lock,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import {
  formatearPuntuacion,
  obtenerConfiguracionClasificacion,
  determinarClasificacion,
  calcularPuntuacionPonderada,
  puedeModificarEvaluacion,
  esPeriodoCerrado,
} from '../evaluacionUtils';

/**
 * @file EvaluacionesTable.jsx
 * @description Tabla para visualizar y gestionar las propuestas asignadas al evaluador (HU-17).
 *
 * Satisface:
 *  - Criterio 1: Visualización de calificaciones por criterio y estado ponderado.
 *  - Criterio 3: Identificación de propuestas con evaluaciones pendientes.
 *  - Criterio 4: Indicación clara de periodo cerrado y deshabilitación de edición.
 * @module features/evaluaciones/components/EvaluacionesTable
 */

export default function EvaluacionesTable({
  asignaciones = [],
  cargando = false,
  hayFiltros = false,
  onAbrirEvaluacion,
  onVerResultado,
}) {
  const columnasTotales = 5;

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-5">Propuesta Académica</th>
              <th scope="col" className="py-3.5 px-5">Periodo de Evaluación</th>
              <th scope="col" className="py-3.5 px-5">Estado Asignación</th>
              <th scope="col" className="py-3.5 px-5">Puntuación / Dictamen</th>
              <th scope="col" className="py-3.5 px-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
            {cargando && asignaciones.length === 0 && (
              <tr>
                <td colSpan={columnasTotales} className="py-12 px-5 text-center text-[#5b5f66]" role="status">
                  <div className="w-7 h-7 border-3 border-[#a6192e] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Cargando asignaciones de evaluación...
                </td>
              </tr>
            )}

            {!cargando && asignaciones.length === 0 && (
              <tr>
                <td colSpan={columnasTotales} className="py-12 px-5 text-center">
                  <ClipboardCheck className="w-10 h-10 text-[#9ca0a6] mx-auto mb-2" />
                  <p className="font-semibold text-base text-[#1f2023]">
                    {hayFiltros
                      ? 'Ninguna asignación coincide con los criterios de búsqueda'
                      : 'No tienes propuestas asignadas para evaluar actualmente'}
                  </p>
                  <p className="text-xs mt-1 text-[#5b5f66]">
                    {hayFiltros
                      ? 'Prueba modificando los filtros o el término de búsqueda.'
                      : 'El comité organizador te notificará cuando se te asignen nuevas ponencias.'}
                  </p>
                </td>
              </tr>
            )}

            {asignaciones.map((asignacion) => {
              const esCompletada = asignacion.estado === 'completada';
              const periodoCerrado = esPeriodoCerrado(asignacion.fechaCierre);
              const { puedeEditar, motivo } = puedeModificarEvaluacion(asignacion);

              // Calcular puntuación de esta asignación
              const califs = asignacion.evaluaciones || [];
              const puntuacionAsignacion = esCompletada
                ? calcularPuntuacionPonderada(califs, califs)
                : null;
              const clasifAsignacion = determinarClasificacion(puntuacionAsignacion);
              const configClasif = obtenerConfiguracionClasificacion(clasifAsignacion);

              return (
                <tr key={asignacion.asignacionId} className="hover:bg-[#f7f7f8]/50 transition-colors">
                  {/* Propuesta y Convocatoria */}
                  <td className="py-4 px-5 align-middle max-w-sm">
                    <p className="font-bold text-[#1f2023] leading-snug line-clamp-2">
                      {asignacion.propuestaTitulo}
                    </p>
                    {asignacion.convocatoriaTitulo && (
                      <p className="text-xs text-[#a6192e] font-medium mt-1 truncate">
                        {asignacion.convocatoriaTitulo}
                      </p>
                    )}
                    {Array.isArray(asignacion.autores) && asignacion.autores.length > 0 && (
                      <p className="text-[11px] text-[#5b5f66] mt-0.5 truncate">
                        Autores: {asignacion.autores.join(', ')}
                      </p>
                    )}
                  </td>

                  {/* Periodo de recepción y fecha límite */}
                  <td className="py-4 px-5 align-middle whitespace-nowrap text-xs text-[#1f2023]">
                    <div className="space-y-1">
                      {asignacion.fechaAsignacion && (
                        <p className="text-[#5b5f66]">
                          Asignada: <strong>{new Date(asignacion.fechaAsignacion).toLocaleDateString()}</strong>
                        </p>
                      )}
                      {asignacion.fechaCierre && (
                        <p className="flex items-center gap-1.5">
                          <span className="text-[#5b5f66]">Límite:</span>
                          <strong>{new Date(asignacion.fechaCierre).toLocaleDateString()}</strong>
                          {periodoCerrado ? (
                            <span className="px-1.5 py-0.2 rounded-xs bg-[#fdecec] text-[#7a0c1e] text-[10px] font-bold">
                              Cerrado
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-xs bg-[#ecfdf3] text-[#027a48] text-[10px] font-bold">
                              Abierto
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Estado de la Asignación */}
                  <td className="py-4 px-5 align-middle whitespace-nowrap">
                    {esCompletada ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#ecfdf3] text-[#027a48] border border-[#a6f4c5]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completada
                      </span>
                    ) : asignacion.estado === 'en_proceso' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#eff8ff] text-[#175cd3] border border-[#b2ddff]">
                        <Clock className="w-3.5 h-3.5" />
                        En Proceso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#fffaeb] text-[#b54708] border border-[#fedf89]">
                        <Clock className="w-3.5 h-3.5" />
                        Pendiente
                      </span>
                    )}
                  </td>

                  {/* Puntuación ponderada / Dictamen */}
                  <td className="py-4 px-5 align-middle whitespace-nowrap text-xs">
                    {esCompletada ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif-title text-base font-bold text-[#1f2023]">
                            {formatearPuntuacion(puntuacionAsignacion)}
                          </span>
                          <span className="text-[#5b5f66] text-[11px]">/ 10.0</span>
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${configClasif.badgeClass}`}
                        >
                          {configClasif.label}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#9ca0a6] italic">Sin calificar</span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-5 align-middle text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botón para calificar o modificar evaluación */}
                      <Button
                        type="button"
                        variant={esCompletada ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => onAbrirEvaluacion && onAbrirEvaluacion(asignacion)}
                        disabled={!puedeEditar && esCompletada && periodoCerrado}
                        title={motivo || (esCompletada ? 'Modificar evaluación' : 'Calificar propuesta')}
                        className="text-xs"
                      >
                        {esCompletada && periodoCerrado ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-[#b42318]" />
                            <span>Cerrada</span>
                          </>
                        ) : esCompletada ? (
                          <>
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Editar notas</span>
                          </>
                        ) : (
                          <>
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Calificar</span>
                          </>
                        )}
                      </Button>

                      {/* Botón para consultar resultado consolidado de la propuesta (Criterio 1 y 3) */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onVerResultado && onVerResultado(asignacion)}
                        title="Consultar puntuación ponderada y estado consolidado (HU-17)"
                        className="text-xs text-[#5b5f66] hover:text-[#a6192e]"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Resultado</span>
                      </Button>
                    </div>
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

EvaluacionesTable.propTypes = {
  asignaciones: PropTypes.arrayOf(PropTypes.object),
  cargando: PropTypes.bool,
  hayFiltros: PropTypes.bool,
  onAbrirEvaluacion: PropTypes.func.isRequired,
  onVerResultado: PropTypes.func.isRequired,
};
