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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-[16px] border border-border shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado */}
        <div className="bg-surface-muted border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                HU-17 • Resultado Consolidado
              </span>
              <h2 id="modal-resultado-title" className="font-serif-title text-xl text-ink-900 leading-snug">
                Puntuación Ponderada
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-ink-600 hover:bg-white hover:text-ink-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-5 text-sm text-ink-900">
          {/* Título de la propuesta */}
          <div>
            <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider block">
              Propuesta Académica Evaluada
            </span>
            <p className="font-serif-title text-base text-ink-900 font-bold mt-0.5">
              {propuestaTitulo || resultado?.propuestaTitulo || `Propuesta #${propuestaId}`}
            </p>
          </div>

          {cargando && (
            <div className="py-12 text-center text-ink-600">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold">Consultando estado de evaluaciones...</p>
            </div>
          )}

          {!cargando && error && (
            <div className="p-4 rounded-[12px] bg-brand-100 border border-brand-600 text-brand-700 text-xs">
              <p className="font-bold">Error al consultar resultado</p>
              <p className="mt-0.5">{error}</p>
            </div>
          )}

          {/* Criterio 3: Propuesta con evaluaciones pendientes */}
          {!cargando && !error && !estaCompleto && (
            <div className="p-5 rounded-[12px] bg-brand-100 border border-brand-600 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-brand-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-brand-700">
                    Evaluación Incompleta (Criterio 3)
                  </h4>
                  <p className="text-xs text-brand-700 mt-1 leading-relaxed">
                    Esta propuesta tiene evaluaciones pendientes por parte de los demás miembros del comité asignados. El sistema no genera un resultado definitivo hasta que todas las evaluaciones hayan sido enviadas.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-[8px] border border-border text-xs text-ink-600 flex items-center justify-between">
                <span>Estado del dictamen:</span>
                <span className="font-bold text-brand-700 inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
                  En proceso de arbitraje
                </span>
              </div>
            </div>
          )}

          {/* Criterio 1: Todas las evaluaciones completas y puntuación calculada */}
          {!cargando && !error && estaCompleto && (
            <div className="space-y-4">
              <div className="p-5 rounded-[12px] bg-surface-muted border border-border text-center space-y-2">
                <span className="text-[10px] font-bold text-ink-600 uppercase tracking-wider block">
                  Puntuación Ponderada Final (Rúbrica)
                </span>
                <p className="font-serif-title text-4xl text-brand-600 font-bold">
                  {formatearPuntuacion(resultado?.puntuacionPonderada)}
                  <span className="text-base text-ink-600 font-normal"> / 10.0</span>
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

              <div className="p-4 rounded-[12px] bg-surface-muted border border-border text-ink-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Proceso de evaluación completado (Criterio 1)</span>
                </p>
                <p className="leading-relaxed pl-5.5">
                  Todas las asignaciones fueron registradas satisfactoriamente. El organizador ya puede proceder con la decisión formal de aceptación o rechazo.
                </p>
              </div>

              {resultado?.fechaCalculo && (
                <div className="flex items-center justify-between text-xs text-ink-600 pt-1 border-t border-border">
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
        <div className="bg-surface-muted border-t border-border px-6 py-4 flex justify-end">
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
