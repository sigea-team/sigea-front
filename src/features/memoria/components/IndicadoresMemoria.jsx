import { useState } from 'react';
import { formatearValorIndicador, indicadoresDestacados } from '../memoriaUtils';

/**
 * @file IndicadoresMemoria.jsx
 * @description Indicadores calculados al cierre formal del evento (HU-28, Criterio 1): los principales como
 * tarjetas y el resto en una tabla que se despliega.
 * @module features/memoria/components/IndicadoresMemoria
 */

/**
 * @param {{ indicadores: Array<{ codigo: string, nombre: string, valor: number, unidad?: string }> }} props
 */
export default function IndicadoresMemoria({ indicadores = [] }) {
  const [verTodos, setVerTodos] = useState(false);
  const destacados = indicadoresDestacados(indicadores);

  if (indicadores.length === 0) {
    return (
      <p className="text-sm text-ink-600 p-4 rounded-[12px] border border-dashed border-field-border text-center">
        No se calcularon indicadores para este evento.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {destacados.map((i) => (
          <li key={i.codigo} className="p-3 rounded-[12px] border border-border bg-surface-muted">
            <p className="text-xl font-semibold text-ink-900 tabular-nums">{formatearValorIndicador(i)}</p>
            <p className="text-xs text-ink-600 mt-0.5 leading-snug">{i.nombre}</p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setVerTodos((v) => !v)}
        className="text-xs font-semibold text-brand-600 underline cursor-pointer"
        aria-expanded={verTodos}
      >
        {verTodos ? 'Ocultar el detalle de indicadores' : `Ver los ${indicadores.length} indicadores`}
      </button>
      {verTodos && (
        <table className="w-full text-sm border border-border rounded-[8px] overflow-hidden">
          <thead>
            <tr className="bg-surface-muted text-xs text-ink-900 uppercase tracking-wider text-left">
              <th scope="col" className="py-2 px-3">Indicador</th>
              <th scope="col" className="py-2 px-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {indicadores.map((i) => (
              <tr key={i.codigo || i.nombre}>
                <td className="py-2 px-3 text-ink-900">{i.nombre}</td>
                <td className="py-2 px-3 text-right tabular-nums text-ink-900 whitespace-nowrap">
                  {formatearValorIndicador(i)}
                  {i.unidad && i.unidad !== '%' && i.unidad !== 'COP' ? <span className="text-ink-600"> {i.unidad}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
