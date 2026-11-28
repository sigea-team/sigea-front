import { useState } from 'react';
import { BarChart3, ClipboardList, Info } from 'lucide-react';
import GraficoBarras from './GraficoBarras';
import GraficoLinea from './GraficoLinea';
import BarraSegmentada from './BarraSegmentada';
import LeyendaGrafica from './LeyendaGrafica';
import { COLORES_SERIE, configuracionSerie, medidaDe, tablaSerie } from '../indicadoresUtils';

/**
 * @file TarjetaGrafica.jsx
 * @description Tarjeta de una serie del dashboard de indicadores (HU-29): título, leyenda, la gráfica que le
 * corresponde (barras, línea o barra segmentada) y su vista de tabla con los mismos datos. Si la serie no tiene
 * datos, muestra el aviso del backend en lugar de una gráfica vacía (Criterio 2).
 * @module features/indicadores/components/TarjetaGrafica
 */

/** @param {{ serie: Object, className?: string }} props */
export default function TarjetaGrafica({ serie, className = '' }) {
  const [verTabla, setVerTabla] = useState(false);
  const config = configuracionSerie(serie);
  const tabla = verTabla ? tablaSerie(serie) : null;
  const leyenda = config.forma === 'segmentada'
    ? []
    : config.graficadas.map((codigo, i) => ({ codigo, nombre: medidaDe(serie, codigo).nombre, color: COLORES_SERIE[i] }));
  const tituloId = `grafica-${serie.codigo}`;

  return (
    <section aria-labelledby={tituloId} className={`flex flex-col gap-4 rounded-[12px] border border-border bg-surface p-5 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h3 id={tituloId} className="text-sm font-semibold text-ink-900">{serie.titulo}</h3>
          {serie.hayDatos && !verTabla && <LeyendaGrafica elementos={leyenda} />}
        </div>
        {serie.hayDatos && (
          <button
            type="button"
            onClick={() => setVerTabla((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            aria-pressed={verTabla}
          >
            {verTabla ? <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> : <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />}
            {verTabla ? 'Ver gráfica' : 'Ver tabla'}
          </button>
        )}
      </header>

      {!serie.hayDatos && (
        <div className="flex flex-1 items-center gap-2.5 rounded-[10px] border border-dashed border-field-border bg-surface-muted p-4 text-xs text-ink-600" role="status">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{serie.mensaje || 'No hay datos suficientes para esta gráfica.'}</span>
        </div>
      )}

      {serie.hayDatos && tabla && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="sr-only">{serie.titulo}</caption>
            <thead>
              <tr className="border-b border-border text-left text-ink-600">
                <th scope="col" className="py-2 pr-3 font-semibold">Elemento</th>
                {tabla.columnas.map((c) => (
                  <th key={c.codigo} scope="col" className="py-2 pl-3 text-right font-semibold whitespace-nowrap">{c.nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tabla.filas.map((fila) => (
                <tr key={fila.clave}>
                  <th scope="row" className="py-2 pr-3 text-left font-normal text-ink-900">{fila.etiqueta}</th>
                  {fila.celdas.map((celda, i) => (
                    <td key={tabla.columnas[i].codigo} className="py-2 pl-3 text-right tabular-nums text-ink-900 whitespace-nowrap">{celda}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {serie.hayDatos && !tabla && config.forma === 'segmentada' && <BarraSegmentada serie={serie} graficadas={config.graficadas} />}
      {serie.hayDatos && !tabla && config.forma === 'linea' && <GraficoLinea serie={serie} graficadas={config.graficadas} detalle={config.detalle} />}
      {serie.hayDatos && !tabla && config.forma === 'barras' && (
        <GraficoBarras serie={serie} graficadas={config.graficadas} detalle={config.detalle} maximo={config.maximo} />
      )}
    </section>
  );
}
