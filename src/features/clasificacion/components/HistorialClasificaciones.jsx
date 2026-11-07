import PropTypes from 'prop-types';
import { ArrowRight, History, Pencil, Sparkles } from 'lucide-react';
import ClasificacionBadge from './ClasificacionBadge';
import { formatearFechaHora, formatearPuntuacion } from '../clasificacionUtils';

/**
 * @file HistorialClasificaciones.jsx
 * @description Historial de clasificaciones de una propuesta (HU-18, Criterio 2). Lista los movimientos del más
 * reciente al más antiguo: automáticos (por umbrales) y ajustes manuales con su motivo, quién lo hizo y cuándo.
 * @module features/clasificacion/components/HistorialClasificaciones
 */

/**
 * @param {Object} props
 * @param {Array<Object>|null} props.movimientos - null mientras carga.
 * @param {boolean} [props.error=false]
 * @param {function(): void} [props.onReintentar]
 */
export default function HistorialClasificaciones({ movimientos, error = false, onReintentar }) {
  if (error) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm font-semibold text-[#1f2023]">No se pudo cargar el historial</p>
        {onReintentar && (
          <button type="button" onClick={onReintentar} className="text-xs mt-1 text-[#a6192e] font-semibold underline cursor-pointer">
            Reintentar
          </button>
        )}
      </div>
    );
  }
  if (!movimientos) {
    return (
      <p className="py-6 text-center text-sm text-[#5b5f66]" role="status">
        Cargando historial...
      </p>
    );
  }
  if (movimientos.length === 0) {
    return (
      <div className="py-6 text-center">
        <History className="w-5 h-5 mx-auto text-[#9ca0a6]" aria-hidden="true" />
        <p className="text-sm text-[#5b5f66] mt-2">La propuesta todavía no ha sido clasificada.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Historial de clasificaciones">
      {movimientos.map((m) => {
        const manual = m.tipo === 'manual';
        return (
          <li key={m.historialId} className="flex gap-3 p-3 rounded-[12px] border border-[#e5e7ea] bg-white">
            <div className="w-8 h-8 rounded-full bg-[#f7f7f8] border border-[#e5e7ea] flex items-center justify-center shrink-0 text-[#5b5f66]">
              {manual ? <Pencil className="w-4 h-4" aria-hidden="true" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#1f2023] font-semibold">
                {manual ? 'Ajuste manual' : 'Clasificación automática por umbrales'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {m.clasificacionAnterior && (
                  <>
                    <ClasificacionBadge clasificacion={m.clasificacionAnterior} />
                    <ArrowRight className="w-3.5 h-3.5 text-[#9ca0a6]" aria-label="cambió a" />
                  </>
                )}
                <ClasificacionBadge clasificacion={m.clasificacionNueva} />
              </div>
              {manual && m.motivo && (
                <p className="text-sm text-[#1f2023] mt-2 bg-[#f7f7f8] rounded-[8px] px-3 py-2">
                  <span className="font-semibold">Motivo:</span> {m.motivo}
                </p>
              )}
              <p className="text-xs text-[#5b5f66] mt-1.5">
                Puntuación {formatearPuntuacion(m.puntuacionPonderada)} · umbrales {formatearPuntuacion(m.umbralAceptacion)} /{' '}
                {formatearPuntuacion(m.umbralAjustes)}
              </p>
              <p className="text-xs text-[#9ca0a6] mt-0.5">
                {formatearFechaHora(m.fechaHora)}
                {m.realizadoPor ? ` · ${m.realizadoPor}` : ''}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

HistorialClasificaciones.propTypes = {
  movimientos: PropTypes.arrayOf(PropTypes.object),
  error: PropTypes.bool,
  onReintentar: PropTypes.func,
};
