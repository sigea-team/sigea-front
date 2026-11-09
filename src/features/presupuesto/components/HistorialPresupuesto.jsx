import { ArrowRight, X } from 'lucide-react';
import {
  OPERACIONES_RUBRO,
  cambiosDeEdicion,
  formatearCantidad,
  formatearFechaHora,
  formatearPesos,
  nombreRubroHistorial,
  variacionTotal,
} from '../presupuestoUtils';

/**
 * @file HistorialPresupuesto.jsx
 * @description Historial de modificaciones del presupuesto preliminar (HU-07, Criterio 2).
 * Cada registro muestra qué pasó (creación, edición o eliminación), los valores antes y
 * después, cómo cambió el total, el motivo, quién lo hizo y cuándo.
 * Se puede filtrar por un rubro desde la tabla de rubros.
 * @module features/presupuesto/components/HistorialPresupuesto
 */

const ESTILO_OPERACION = {
  creacion: 'bg-brand-600 text-surface border-transparent',
  edicion: 'bg-surface-page text-ink-900 border-field-border',
  eliminacion: 'bg-brand-100 text-brand-700 border-brand-600',
};

/** Valores de un rubro en una línea: "2 × $ 350.000 = $ 700.000". */
function ValoresRubro({ cantidad, valorUnitario }) {
  const subtotal = Math.round(Number(cantidad) * Number(valorUnitario) * 100) / 100;
  return (
    <span className="tabular-nums">
      {formatearCantidad(cantidad)} × {formatearPesos(valorUnitario)} ={' '}
      <span className="font-semibold text-ink-900">{formatearPesos(subtotal)}</span>
    </span>
  );
}

/**
 * @param {Object} props
 * @param {Array<Object>|null} props.registros - HistorialRubroResponse; null mientras carga.
 * @param {string|null} [props.error] - Mensaje si no se pudo cargar.
 * @param {function(): void} [props.onReintentar]
 * @param {{id: number, nombre: string}|null} [props.filtroRubro] - Muestra solo los cambios de ese rubro.
 * @param {function(): void} [props.onQuitarFiltro]
 */
export default function HistorialPresupuesto({ registros, error, onReintentar, filtroRubro, onQuitarFiltro }) {
  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="font-semibold text-ink-900">No se pudo cargar el historial</p>
        <p className="text-sm text-ink-600 mt-1">{error}</p>
        {onReintentar && (
          <button type="button" onClick={onReintentar} className="text-xs mt-2 text-brand-600 font-semibold underline cursor-pointer">
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (!registros) {
    return (
      <p className="text-sm text-ink-600 py-10 text-center" role="status">
        Cargando historial...
      </p>
    );
  }

  const visibles = filtroRubro ? registros.filter((r) => r.rubroId === filtroRubro.id) : registros;

  return (
    <div className="space-y-4">
      {filtroRubro && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-600">Mostrando los cambios de</span>
          <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-brand-100 text-brand-600 font-semibold">
            {filtroRubro.nombre}
            <button
              type="button"
              onClick={onQuitarFiltro}
              title="Ver el historial de todos los rubros"
              aria-label="Ver el historial de todos los rubros"
              className="w-5 h-5 inline-flex items-center justify-center rounded-full hover:bg-brand-600/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="py-10 px-6 text-center rounded-[12px] border border-dashed border-field-border">
          <p className="font-semibold text-ink-900">Todavía no hay cambios registrados</p>
          <p className="text-sm text-ink-600 mt-1">Cada rubro que se agregue, edite o elimine quedará aquí.</p>
        </div>
      ) : (
        <ol className="rounded-[12px] border border-border bg-white divide-y divide-border">
          {visibles.map((registro) => {
            const cambios = registro.tipoOperacion === 'edicion' ? cambiosDeEdicion(registro) : [];
            return (
              <li key={registro.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ESTILO_OPERACION[registro.tipoOperacion] || ESTILO_OPERACION.edicion}`}
                      >
                        {OPERACIONES_RUBRO[registro.tipoOperacion] || registro.tipoOperacion}
                      </span>
                      <span className="text-sm font-semibold text-ink-900 break-words">{nombreRubroHistorial(registro)}</span>
                    </div>

                    {registro.tipoOperacion === 'creacion' && (
                      <p className="text-xs text-ink-600">
                        Se agregó con <ValoresRubro cantidad={registro.cantidadNueva} valorUnitario={registro.valorUnitarioNuevo} />
                      </p>
                    )}

                    {registro.tipoOperacion === 'eliminacion' && (
                      <p className="text-xs text-ink-600">
                        Tenía <ValoresRubro cantidad={registro.cantidadAnterior} valorUnitario={registro.valorUnitarioAnterior} />
                      </p>
                    )}

                    {cambios.length > 0 && (
                      <ul className="text-xs text-ink-600 space-y-0.5">
                        {cambios.map((c) => (
                          <li key={c.campo} className="flex items-center gap-1.5 flex-wrap">
                            <span>{c.campo}:</span>
                            <span className="line-through">{c.antes}</span>
                            <ArrowRight className="w-3 h-3 shrink-0" aria-label="cambió a" />
                            <span className="font-semibold text-ink-900">{c.despues}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {registro.motivo && <p className="text-xs text-ink-900 italic">«{registro.motivo}»</p>}

                    <p className="text-[11px] text-ink-300">
                      {registro.usuarioNombre || 'Usuario no identificado'} · {formatearFechaHora(registro.fechaHora)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-ink-600">Total</p>
                    <p className="text-sm font-semibold text-ink-900 tabular-nums whitespace-nowrap">
                      {formatearPesos(registro.totalPresupuestoNuevo)}
                    </p>
                    <p className="text-[11px] text-ink-600 tabular-nums whitespace-nowrap">{variacionTotal(registro)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
