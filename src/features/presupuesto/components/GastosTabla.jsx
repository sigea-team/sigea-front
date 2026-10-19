import { ExternalLink } from 'lucide-react';
import { formatearPesos } from '../presupuestoUtils';
import { esEnlace, formatearFecha } from '../ejecucionUtils';

/**
 * @file GastosTabla.jsx
 * @description Lista de gastos ejecutados del evento o de un rubro (HU-09: RF11), del más reciente
 * al más antiguo. El soporte es opcional: si es un enlace se puede abrir; si es texto se muestra tal cual.
 * @module features/presupuesto/components/GastosTabla
 */

/**
 * @param {Object} props
 * @param {Array<Object>} props.gastos - GastoEjecutadoResponse.
 * @param {boolean} [props.mostrarRubro=true] - Oculta la columna del rubro cuando la lista ya está filtrada por uno.
 */
export default function GastosTabla({ gastos, mostrarRubro = true }) {
  const columnas = mostrarRubro ? 6 : 5;
  const total = gastos.reduce((suma, g) => suma + Number(g.valor || 0), 0);

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
            <th scope="col" className="py-3 px-4 whitespace-nowrap">Fecha</th>
            {mostrarRubro && <th scope="col" className="py-3 px-4">Rubro</th>}
            <th scope="col" className="py-3 px-4">Descripción</th>
            <th scope="col" className="py-3 px-4">Soporte</th>
            <th scope="col" className="py-3 px-4">Registrado por</th>
            <th scope="col" className="py-3 px-4 text-right">Valor</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
          {gastos.length === 0 && (
            <tr>
              <td colSpan={columnas} className="py-10 px-4 text-center">
                <p className="font-semibold text-[#1f2023]">Todavía no hay gastos registrados</p>
                <p className="text-xs mt-1 text-[#5b5f66]">La ejecución presupuestal está en 0 %.</p>
              </td>
            </tr>
          )}

          {gastos.map((gasto) => (
            <tr key={gasto.id}>
              <td className="py-3.5 px-4 align-top whitespace-nowrap">{formatearFecha(gasto.fechaGasto)}</td>
              {mostrarRubro && <td className="py-3.5 px-4 align-top font-semibold break-words">{gasto.rubroNombre}</td>}
              <td className="py-3.5 px-4 align-top break-words">
                {gasto.descripcion || <span className="text-[#9ca0a6]">Sin descripción</span>}
              </td>
              <td className="py-3.5 px-4 align-top max-w-[220px]">
                {!gasto.soporteUrl ? (
                  <span className="text-[#9ca0a6]">Sin soporte</span>
                ) : esEnlace(gasto.soporteUrl) ? (
                  <a
                    href={gasto.soporteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#a6192e] font-semibold hover:text-[#7a0c1e] hover:underline"
                    title={gasto.soporteUrl}
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Abrir soporte</span>
                  </a>
                ) : (
                  <span className="break-words">{gasto.soporteUrl}</span>
                )}
              </td>
              <td className="py-3.5 px-4 align-top text-[#5b5f66]">{gasto.registradoPorNombre || '—'}</td>
              <td className="py-3.5 px-4 align-top text-right tabular-nums whitespace-nowrap font-semibold">
                {formatearPesos(gasto.valor)}
              </td>
            </tr>
          ))}
        </tbody>

        {gastos.length > 0 && (
          <tfoot>
            <tr className="bg-[#f7f7f8] border-t-2 border-[#e5e7ea]">
              <th scope="row" colSpan={columnas - 1} className="py-3.5 px-4 text-left text-sm font-semibold text-[#1f2023]">
                Total
                <span className="ml-2 text-xs font-normal text-[#5b5f66]">
                  ({gastos.length} {gastos.length === 1 ? 'gasto' : 'gastos'})
                </span>
              </th>
              <td className="py-3.5 px-4 text-right text-base font-bold text-[#a6192e] tabular-nums whitespace-nowrap">
                {formatearPesos(total)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
