import { Info } from 'lucide-react';
import { formatearValor, indicadoresPorGrupo } from '../indicadoresUtils';

/**
 * @file TablaIndicadores.jsx
 * @description Vista en tabla de todos los indicadores del evento, agrupados (HU-29, Criterio 1). Los grupos sin
 * información registrada muestran su aviso y los indicadores sin datos suficientes, su motivo (Criterio 2).
 * @module features/indicadores/components/TablaIndicadores
 */

/** Unidad visible junto al valor (los porcentajes y los pesos ya la llevan en el formato). */
const unidadVisible = (unidad) => (unidad && unidad !== '%' && unidad !== 'COP' ? unidad : '');

/** @param {{ respuesta: Object }} props - Respuesta de `GET /eventos/{id}/indicadores`. */
export default function TablaIndicadores({ respuesta }) {
  const grupos = indicadoresPorGrupo(respuesta);
  return (
    <div className="space-y-4">
      {grupos.map((grupo) => (
        <section key={grupo.codigo} aria-labelledby={`grupo-${grupo.codigo}`} className="overflow-hidden rounded-[12px] border border-border bg-surface">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-muted px-4 py-3">
            <h3 id={`grupo-${grupo.codigo}`} className="text-sm font-semibold text-ink-900">{grupo.nombre}</h3>
            {!grupo.hayDatos && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                {grupo.mensaje}
              </span>
            )}
          </header>
          <table className="w-full text-sm">
            <caption className="sr-only">Indicadores de {grupo.nombre}</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Indicador</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grupo.indicadores.map((i) => (
                <tr key={i.codigo}>
                  <th scope="row" className="px-4 py-2.5 text-left font-normal text-ink-900">{i.nombre}</th>
                  <td className="px-4 py-2.5 text-right">
                    {i.disponible ? (
                      <span className="tabular-nums font-semibold text-ink-900 whitespace-nowrap">
                        {formatearValor(i.valor, i.unidad)}
                        {unidadVisible(i.unidad) && <span className="font-normal text-ink-600"> {unidadVisible(i.unidad)}</span>}
                      </span>
                    ) : (
                      <span className="block text-xs text-ink-600">
                        <span className="font-semibold">Sin datos suficientes</span>
                        {grupo.hayDatos && i.motivo ? <span className="block">{i.motivo}</span> : null}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
