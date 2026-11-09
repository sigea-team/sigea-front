import { ArrowRight, Calendar, ExternalLink, FileCheck, History, ShieldCheck, User } from 'lucide-react';
import { formatearPesos, formatearFechaHora } from '../presupuestoUtils';

/**
 * @file HistorialPresupuestoAprobado.jsx
 * @description Historial de versiones del presupuesto aprobado formalmente (HU-08: Criterio 2).
 * Conserva la versión anterior y guarda la nueva cuando se registra una actualización,
 * mostrando los datos retornados por PresupuestoAprobadoController (/api/v1/eventos/{eventoId}/presupuesto-aprobado/historial).
 * @module features/presupuesto/components/HistorialPresupuestoAprobado
 */

/**
 * @param {Object} props
 * @param {Array<Object>} props.versiones - Lista de versiones ordenadas de más reciente a más antigua
 * @param {function(): void} [props.onNuevaActualizacion] - Callback para abrir el formulario de actualización
 * @param {boolean} [props.editable=true]
 */
export default function HistorialPresupuestoAprobado({
  versiones = [],
  onNuevaActualizacion,
  editable = true,
}) {
  if (!versiones || versiones.length === 0) {
    return (
      <div className="py-12 px-6 text-center rounded-[12px] border border-dashed border-field-border bg-white">
        <History className="w-8 h-8 text-ink-300 mx-auto mb-2" />
        <p className="font-semibold text-ink-900">No hay historial de versiones registrado</p>
        <p className="text-xs text-ink-600 mt-1">
          Al registrar o actualizar el presupuesto aprobado oficial, las versiones anteriores se conservarán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 pb-2">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">
            Historial de versiones y cambios oficiales ({versiones.length})
          </h3>
          <p className="text-xs text-ink-600">
            Registro auditable de cada versión aprobada formalmente para el evento.
          </p>
        </div>
        {editable && onNuevaActualizacion && (
          <button
            type="button"
            onClick={onNuevaActualizacion}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
          >
            + Registrar nueva actualización
          </button>
        )}
      </div>

      <div className="space-y-4">
        {versiones.map((v, index) => {
          const esVigente = v.esOficial ?? (v.estado === 'aprobado' || v.vigente || index === 0);
          const numeroVersion = v.version || (versiones.length - index);
          const nombreAprobador = v.aprobadoPorNombre || v.aprobadoPor?.nombreCompleto || v.aprobadoPor || 'Administración';
          const diferenciaPreliminar = v.diferenciaConPreliminar !== undefined && v.diferenciaConPreliminar !== null
            ? Number(v.diferenciaConPreliminar)
            : null;
          const diferenciaAnterior = v.montoAnterior ? v.valorTotalAprobado - v.montoAnterior : null;

          return (
            <div
              key={v.id || `version-${numeroVersion}`}
              className={`p-5 rounded-[12px] border bg-white transition-shadow ${
                esVigente ? 'border-brand-600 shadow-xs' : 'border-border'
              }`}
            >
              {/* Encabezado de la versión */}
              <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      esVigente
                        ? 'bg-brand-600 text-surface border-transparent'
                        : 'bg-surface-page text-ink-600 border border-field-border'
                    }`}
                  >
                    {esVigente && <ShieldCheck className="w-3.5 h-3.5" />}
                    Versión {numeroVersion} {esVigente ? '• Vigente' : '• Histórica'}
                  </span>
                  {v.resolucionOActa && (
                    <span className="text-xs font-medium text-ink-900 truncate max-w-xs">
                      {v.resolucionOActa}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-ink-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatearFechaHora(v.fechaAprobacion)}
                  </span>
                  {nombreAprobador && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {nombreAprobador}
                    </span>
                  )}
                </div>
              </div>

              {/* Monto aprobado y comparativa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-[8px] bg-surface-muted border border-border">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-600">
                    Monto oficial aprobado
                  </p>
                  <p className="font-serif-title text-xl text-brand-600 tabular-nums mt-0.5">
                    {formatearPesos(v.valorTotalAprobado)}
                  </p>
                </div>

                {diferenciaPreliminar !== null ? (
                  <div className="p-3 rounded-[8px] bg-surface-muted border border-border flex flex-col justify-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink-600">
                      Diferencia vs presupuesto preliminar
                    </p>
                    <p
                      className={`text-sm font-semibold tabular-nums mt-1 ${
                        diferenciaPreliminar > 0
                          ? 'text-brand-600'
                          : diferenciaPreliminar < 0
                          ? 'text-brand-700'
                          : 'text-ink-600'
                      }`}
                    >
                      {diferenciaPreliminar > 0
                        ? `+${formatearPesos(diferenciaPreliminar)} (sobre preliminar)`
                        : diferenciaPreliminar < 0
                        ? `${formatearPesos(diferenciaPreliminar)} (bajo preliminar)`
                        : 'Igual al preliminar proyectado'}
                    </p>
                  </div>
                ) : diferenciaAnterior !== null ? (
                  <div className="p-3 rounded-[8px] bg-surface-muted border border-border flex flex-col justify-center">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink-600">
                      Variación respecto a versión anterior
                    </p>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="text-ink-600 tabular-nums">{formatearPesos(v.montoAnterior)}</span>
                      <ArrowRight className="w-3 h-3 text-ink-600" />
                      <span
                        className={`font-semibold tabular-nums ${
                          diferenciaAnterior > 0
                            ? 'text-brand-600'
                            : diferenciaAnterior < 0
                            ? 'text-brand-700'
                            : 'text-ink-600'
                        }`}
                      >
                        {diferenciaAnterior > 0 ? `+${formatearPesos(diferenciaAnterior)}` : formatearPesos(diferenciaAnterior)}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Justificación o motivo del cambio */}
              {v.justificacion && (
                <div className="mb-3 text-xs">
                  <span className="font-semibold text-ink-900">Justificación / Motivo: </span>
                  <span className="text-ink-600">{v.justificacion}</span>
                </div>
              )}

              {/* Soporte documental y evidencia vinculada (Criterios 1, 2 y 3) */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-ink-900 min-w-0">
                  <FileCheck className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="font-medium truncate max-w-md">
                    {v.evidenciaUrl || v.evidenciaNombre || 'Soporte documental registrado'}
                  </span>
                </div>

                {v.evidenciaUrl && (
                  <a
                    href={v.evidenciaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    title="Consultar evidencia documental adjunta"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver soporte</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
