import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  FILAS_POR_PAGINA,
  esNumerico,
  etiquetaRegistros,
  formatearGeneradoEn,
  formatearValor,
  paginar,
} from '../informeUtils';

/**
 * @file TablaInforme.jsx
 * @description Vista previa del informe generado (HU-30, Criterio 1): filtros aplicados, registros con el mismo
 * formato del PDF (texto completo, sin recortar), totales de las columnas sumables y paginación de
 * {@link FILAS_POR_PAGINA} registros. El PDF y el Excel llevan todos los registros.
 * @module features/informes/components/TablaInforme
 */

/**
 * @param {Object} props
 * @param {Object} props.informe - Respuesta normalizada de `POST /informes/generar` (con datos).
 * @param {number} [props.filasPorPagina]
 * @param {import('react').ReactNode} [props.acciones] - Botones junto al título (por ejemplo, exportar).
 */
export default function TablaInforme({ informe, filasPorPagina = FILAS_POR_PAGINA, acciones }) {
  const [pagina, setPagina] = useState(1);
  const vista = paginar(informe.filas, pagina, filasPorPagina);
  const hayTotales = informe.columnas.some((c) => c.sumable) && Object.keys(informe.totales).length > 0;
  const columnaEtiqueta = informe.columnas.findIndex((c) => !c.sumable);
  const filtros = informe.filtros.filter((f) => f.parametro !== 'tipo');

  return (
    <section aria-labelledby="titulo-vista-previa" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="titulo-vista-previa" className="text-base font-semibold text-ink-900">{informe.titulo}</h3>
          <p className="text-xs text-ink-600">
            {etiquetaRegistros(informe.totalFilas)} · Generado el {formatearGeneradoEn(informe.generadoEn)}
          </p>
        </div>
        {acciones}
      </div>

      {filtros.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Filtros aplicados">
          {filtros.map((f) => (
            <li key={f.parametro} className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs text-ink-900">
              <span className="text-ink-600">{f.etiqueta}:</span> {f.valor}
            </li>
          ))}
        </ul>
      )}

      <div className="max-h-[65vh] overflow-auto rounded-[12px] border border-border bg-surface">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            {informe.titulo}: registros {vista.desde} a {vista.hasta} de {informe.totalFilas}
          </caption>
          <thead className="sticky top-0 z-10 bg-surface-muted">
            <tr>
              {informe.columnas.map((col) => (
                <th
                  key={col.clave}
                  scope="col"
                  className={`whitespace-nowrap border-b border-border px-3 py-2.5 text-xs font-semibold text-ink-900 ${
                    esNumerico(col.tipo) ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vista.filas.map((fila, i) => (
              <tr key={vista.desde + i} className="align-top hover:bg-surface-muted/60">
                {informe.columnas.map((col) => (
                  <td
                    key={col.clave}
                    className={`px-3 py-2 text-ink-900 ${
                      esNumerico(col.tipo) || col.tipo === 'FECHA' || col.tipo === 'HORA' || col.tipo === 'FECHA_HORA'
                        ? 'whitespace-nowrap'
                        : 'min-w-[8rem] max-w-[24rem] break-words'
                    } ${esNumerico(col.tipo) ? 'text-right tabular-nums' : 'text-left'}`}
                  >
                    {formatearValor(fila[col.clave], col.tipo)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {hayTotales && (
            <tfoot className="sticky bottom-0 bg-surface-muted">
              <tr>
                {informe.columnas.map((col, i) => (
                  <td
                    key={col.clave}
                    className={`whitespace-nowrap border-t border-border px-3 py-2.5 text-sm font-semibold text-ink-900 ${
                      esNumerico(col.tipo) ? 'text-right tabular-nums' : 'text-left'
                    }`}
                  >
                    {col.sumable
                      ? formatearValor(informe.totales[col.clave], col.tipo)
                      : i === columnaEtiqueta ? 'Total (todos los registros)' : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {vista.paginas > 1 && (
        <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Páginas de la vista previa">
          <p className="text-xs text-ink-600">
            Mostrando {vista.desde}–{vista.hasta} de {etiquetaRegistros(informe.totalFilas)}. El archivo exportado los incluye todos.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagina(vista.pagina - 1)}
              disabled={vista.pagina === 1}
              className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-field-border bg-surface px-3 text-xs font-medium text-ink-900 hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-ink-300 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Anterior
            </button>
            <span className="text-xs text-ink-600" aria-live="polite">
              Página {vista.pagina} de {vista.paginas}
            </span>
            <button
              type="button"
              onClick={() => setPagina(vista.pagina + 1)}
              disabled={vista.pagina === vista.paginas}
              className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-field-border bg-surface px-3 text-xs font-medium text-ink-900 hover:bg-surface-muted disabled:cursor-not-allowed disabled:text-ink-300 cursor-pointer"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}
