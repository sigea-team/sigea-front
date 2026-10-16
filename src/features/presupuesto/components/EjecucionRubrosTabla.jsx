import { ListChecks, Plus } from 'lucide-react';
import BotonAccion from '../../../components/ui/BotonAccion';
import BarraEjecucion from './BarraEjecucion';
import { formatearPesos } from '../presupuestoUtils';

/**
 * @file EjecucionRubrosTabla.jsx
 * @description Ejecución presupuestal por rubro (HU-09: RF11 + RF12): valor presupuestado,
 * acumulado ejecutado, disponible y porcentaje de cada rubro vigente (Criterio 1).
 * Un rubro cuyo ejecutado supera lo presupuestado se marca como «Excedido» y su disponible
 * queda en negativo (se permite pasarse). Sin gastos todos los rubros quedan en 0 % (Criterio 4).
 * @module features/presupuesto/components/EjecucionRubrosTabla
 */

/**
 * @param {Object} props
 * @param {Array<Object>} props.rubros - EjecucionRubroResponse de cada rubro vigente.
 * @param {number} props.totalPresupuestado - Suma de los subtotales de los rubros vigentes.
 * @param {number} props.totalEjecutado - Total ejecutado del evento.
 * @param {function(Object): void} [props.onRegistrarGasto] - Abre el formulario con el rubro elegido (sin él, no se muestra).
 * @param {function(Object): void} [props.onVerGastos] - Muestra los gastos del rubro.
 */
export default function EjecucionRubrosTabla({ rubros, totalPresupuestado, totalEjecutado, onRegistrarGasto, onVerGastos }) {
  const conAcciones = Boolean(onRegistrarGasto || onVerGastos);
  const columnas = conAcciones ? 6 : 5;
  const disponibleTotal = Number(totalPresupuestado) - Number(totalEjecutado);

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#e5e7ea] bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f7f7f8] border-b border-[#e5e7ea] text-xs font-bold text-[#1f2023] uppercase tracking-wider">
            <th scope="col" className="py-3 px-4">Rubro</th>
            <th scope="col" className="py-3 px-4 text-right">Presupuestado</th>
            <th scope="col" className="py-3 px-4 text-right">Ejecutado</th>
            <th scope="col" className="py-3 px-4 text-right">Disponible</th>
            <th scope="col" className="py-3 px-4 w-[200px]">Ejecución</th>
            {conAcciones && (
              <th scope="col" className="py-3 px-4 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#e5e7ea] text-sm text-[#1f2023]">
          {rubros.length === 0 && (
            <tr>
              <td colSpan={columnas} className="py-10 px-4 text-center">
                <p className="font-semibold text-[#1f2023]">El presupuesto no tiene rubros vigentes</p>
                <p className="text-xs mt-1 text-[#5b5f66]">Los gastos se registran contra los rubros del presupuesto preliminar.</p>
              </td>
            </tr>
          )}

          {rubros.map((rubro) => {
            const disponible = Number(rubro.disponible);
            return (
              <tr key={rubro.rubroId}>
                <td className="py-3.5 px-4 align-middle">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold break-words">{rubro.nombre}</span>
                    {rubro.excedido && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fdecec] text-[#7a0c1e] border border-[#a6192e]/20">
                        Excedido
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5b5f66] mt-0.5">
                    {rubro.cantidadGastos === 0
                      ? 'Sin gastos'
                      : `${rubro.cantidadGastos} ${rubro.cantidadGastos === 1 ? 'gasto' : 'gastos'}`}
                  </p>
                </td>
                <td className="py-3.5 px-4 align-middle text-right tabular-nums whitespace-nowrap">
                  {formatearPesos(rubro.presupuestado)}
                </td>
                <td className="py-3.5 px-4 align-middle text-right tabular-nums whitespace-nowrap font-semibold">
                  {formatearPesos(rubro.ejecutado)}
                </td>
                <td
                  className={`py-3.5 px-4 align-middle text-right tabular-nums whitespace-nowrap ${
                    disponible < 0 ? 'text-[#7a0c1e] font-semibold' : ''
                  }`}
                >
                  {formatearPesos(disponible)}
                </td>
                <td className="py-3.5 px-4 align-middle">
                  <BarraEjecucion
                    porcentaje={rubro.porcentajeEjecucion}
                    excedido={rubro.excedido}
                    etiqueta={`Ejecución de ${rubro.nombre}`}
                  />
                </td>
                {conAcciones && (
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      {onVerGastos && (
                        <BotonAccion
                          icono={ListChecks}
                          etiqueta={`Ver gastos de «${rubro.nombre}»`}
                          onClick={() => onVerGastos(rubro)}
                          disabled={rubro.cantidadGastos === 0}
                          motivo="Este rubro todavía no tiene gastos"
                        />
                      )}
                      {onRegistrarGasto && (
                        <BotonAccion
                          icono={Plus}
                          etiqueta={`Registrar gasto en «${rubro.nombre}»`}
                          onClick={() => onRegistrarGasto(rubro)}
                        />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="bg-[#f7f7f8] border-t-2 border-[#e5e7ea] text-sm">
            <th scope="row" className="py-3.5 px-4 text-left font-semibold text-[#1f2023]">
              Total de los rubros
            </th>
            <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap font-semibold">
              {formatearPesos(totalPresupuestado)}
            </td>
            <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap font-bold text-[#a6192e]">
              {formatearPesos(totalEjecutado)}
            </td>
            <td
              className={`py-3.5 px-4 text-right tabular-nums whitespace-nowrap font-semibold ${
                disponibleTotal < 0 ? 'text-[#7a0c1e]' : ''
              }`}
            >
              {formatearPesos(disponibleTotal)}
            </td>
            <td colSpan={conAcciones ? 2 : 1} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
