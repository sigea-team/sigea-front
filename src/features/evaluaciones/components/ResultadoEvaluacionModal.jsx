import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { X, Award, AlertCircle, CheckCircle2, Clock, Calendar, Hash } from 'lucide-react';
import Button from '../../../components/ui/Button';
import {
  formatearPuntuacion,
  obtenerConfiguracionClasificacion,
} from '../evaluacionUtils';
import { evaluacionService } from '../../../api/evaluacionService';

/**
 * @file ResultadoEvaluacionModal.jsx
 * @description Modal para consultar la puntuación ponderada y clasificación definitiva de una propuesta (HU-17).
 *
 * Implementa:
 *  - Criterio 1: Muestra el promedio ponderado consolidado y la clasificación cuando todas las evaluaciones están completas.
 *  - Criterio 3: Indica claramente si la propuesta tiene evaluaciones pendientes y no genera un resultado definitivo.
 * @module features/evaluaciones/components/ResultadoEvaluacionModal
 */

export default function ResultadoEvaluacionModal({
  propuestaId,
  propuestaTitulo,
  isOpen = false,
  onClose,
}) {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !propuestaId) return;

    let activo = true;
    setCargando(true);
    setError(null);

    evaluacionService
      .obtenerResultado(propuestaId)
      .then((data) => {
        if (activo) setResultado(data);
      })
      .catch((err) => {
        if (activo) setError(err?.message || 'No fue posible obtener el resultado de evaluación.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [isOpen, propuestaId]);

  if (!isOpen) return null;

  const estaCompleto = Boolean(resultado?.completo);
  const configClasif = obtenerConfiguracionClasificacion(resultado?.clasificacion);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-resultado-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-[16px] border border-[#e5e7ea] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <div className="bg-[#f7f7f8] border-b border-[#e5e7ea] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a6192e] block">
                HU-17 • Resultado Consolidado
              </span>
              <h2 id="modal-resultado-title" className="font-serif-title text-xl text-[#1f2023] leading-snug">
                Puntuación Ponderada
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-[#5b5f66] hover:bg-white hover:text-[#1f2023] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-5 text-sm text-[#1f2023]">
          {/* Título de la propuesta */}
          <div>
            <span className="text-[10px] font-bold text-[#5b5f66] uppercase tracking-wider block">
              Propuesta Académica Evaluada
            </span>
            <p className="font-serif-title text-base text-[#1f2023] font-bold mt-0.5">
              {propuestaTitulo || resultado?.propuestaTitulo || `Propuesta #${propuestaId}`}
            </p>
          </div>

          {cargando && (
            <div className="py-12 text-center text-[#5b5f66]">
              <div className="w-8 h-8 border-3 border-[#a6192e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold">Consultando estado de evaluaciones...</p>
            </div>
          )}

          {!cargando && error && (
            <div className="p-4 rounded-[12px] bg-[#fdecec] border border-[#a6192e]/30 text-[#7a0c1e] text-xs">
              <p className="font-bold">Error al consultar resultado</p>
              <p className="mt-0.5">{error}</p>
            </div>
          )}

          {/* Criterio 3: Propuesta con evaluaciones pendientes */}
          {!cargando && !error && !estaCompleto && (
            <div className="p-5 rounded-[12px] bg-[#fffaeb] border border-[#fedf89] space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-[#b54708] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-[#b54708]">
                    Evaluación Incompleta (Criterio 3)
                  </h4>
                  <p className="text-xs text-[#7a2e05] mt-1 leading-relaxed">
                    Esta propuesta tiene evaluaciones pendientes por parte de los demás miembros del comité asignados. El sistema no genera un resultado definitivo hasta que todas las evaluaciones hayan sido enviadas.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-[8px] border border-[#fedf89]/60 text-xs text-[#5b5f66] flex items-center justify-between">
                <span>Estado del dictamen:</span>
                <span className="font-bold text-[#b54708] inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#b54708] animate-pulse" />
                  En proceso de arbitraje
                </span>
              </div>
            </div>
          )}

          {/* Criterio 1: Todas las evaluaciones completas y puntuación calculada */}
          {!cargando && !error && estaCompleto && (
            <div className="space-y-4">
              <div className="p-5 rounded-[12px] bg-[#f7f7f8] border border-[#e5e7ea] text-center space-y-2">
                <span className="text-[10px] font-bold text-[#5b5f66] uppercase tracking-wider block">
                  Puntuación Ponderada Final (Rúbrica)
                </span>
                <p className="font-serif-title text-4xl text-[#a6192e] font-bold">
                  {formatearPuntuacion(resultado?.puntuacionPonderada)}
                  <span className="text-base text-[#5b5f66] font-normal"> / 10.0</span>
                </p>

                <div className="pt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border shadow-2xs ${configClasif.badgeClass}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{configClasif.label}</span>
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-[12px] bg-[#ecfdf3] border border-[#a6f4c5] text-[#027a48] text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Proceso de evaluación completado (Criterio 1)</span>
                </p>
                <p className="leading-relaxed pl-5.5">
                  Todas las asignaciones fueron registradas satisfactoriamente. El organizador ya puede proceder con la decisión formal de aceptación o rechazo.
                </p>
              </div>

              {resultado?.fechaCalculo && (
                <div className="flex items-center justify-between text-xs text-[#5b5f66] pt-1 border-t border-[#e5e7ea]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Fecha de consolidación:
                  </span>
                  <strong>{new Date(resultado.fechaCalculo).toLocaleString()}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="bg-[#f7f7f8] border-t border-[#e5e7ea] px-6 py-4 flex justify-end">
          <Button type="button" variant="primary" size="sm" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}

ResultadoEvaluacionModal.propTypes = {
  propuestaId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  propuestaTitulo: PropTypes.string,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
};
