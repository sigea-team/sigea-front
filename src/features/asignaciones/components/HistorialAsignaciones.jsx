import PropTypes from 'prop-types';
import { AlertTriangle, ArrowRight, History, UserPlus } from 'lucide-react';
import { formatearFechaHoraCorta } from '../asignacionUtils';

/**
 * @file HistorialAsignaciones.jsx
 * @description Historial de asignaciones y reasignaciones de una propuesta (HU-16, Criterio 3).
 * Lista los movimientos del más reciente al más antiguo, con evaluador anterior y nuevo, motivo,
 * quién lo hizo y si se confirmó pese a una advertencia de conflicto.
 * @module features/asignaciones/components/HistorialAsignaciones
 */

/**
 * @param {Object} props
 * @param {Array<Object>|null} props.movimientos - null mientras carga.
 * @param {boolean} [props.error=false]
 * @param {function(): void} [props.onReintentar]
 */
export default function HistorialAsignaciones({ movimientos, error = false, onReintentar }) {
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
        <p className="text-sm text-[#5b5f66] mt-2">La propuesta todavía no tiene movimientos de asignación.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3" aria-label="Historial de asignaciones">
      {movimientos.map((m) => {
        const esReasignacion = m.tipoOperacion === 'reasignacion';
        return (
          <li key={m.historialId} className="flex gap-3 p-3 rounded-[12px] border border-[#e5e7ea] bg-white">
            <div className="w-8 h-8 rounded-full bg-[#f7f7f8] border border-[#e5e7ea] flex items-center justify-center shrink-0 text-[#5b5f66]">
              {esReasignacion ? <ArrowRight className="w-4 h-4" aria-hidden="true" /> : <UserPlus className="w-4 h-4" aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[#1f2023]">
                {esReasignacion ? (
                  <>
                    <span className="font-semibold">Reasignada</span> de{' '}
                    <span className="font-semibold">{m.evaluadorAnteriorNombre || 'evaluador retirado'}</span> a{' '}
                    <span className="font-semibold">{m.evaluadorNuevoNombre}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Asignada</span> a{' '}
                    <span className="font-semibold">{m.evaluadorNuevoNombre}</span>
                  </>
                )}
              </p>
              {m.motivo && <p className="text-xs text-[#5b5f66] mt-1">Motivo: {m.motivo}</p>}
              {m.conflictoAdvertido && (
                <p className="inline-flex items-center gap-1 text-xs text-[#7a0c1e] mt-1">
                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  Confirmada pese a un posible conflicto de interés
                </p>
              )}
              <p className="text-xs text-[#9ca0a6] mt-1">
                {formatearFechaHoraCorta(m.fechaHora)}
                {m.realizadoPor ? ` · ${m.realizadoPor}` : ''}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

HistorialAsignaciones.propTypes = {
  movimientos: PropTypes.arrayOf(PropTypes.object),
  error: PropTypes.bool,
  onReintentar: PropTypes.func,
};
