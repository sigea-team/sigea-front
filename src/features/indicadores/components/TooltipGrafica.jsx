/**
 * @file TooltipGrafica.jsx
 * @description Recuadro flotante con el detalle de una marca de las gráficas del dashboard (HU-29). Se ubica dentro
 * del contenedor relativo de la gráfica, cerca de la marca activa (con el mouse o con el teclado).
 * @module features/indicadores/components/TooltipGrafica
 */

/**
 * @param {{ visible: boolean, x: number, y: number, titulo: string,
 *   filas: Array<{ nombre: string, valor: string, color?: string }> }} props
 * - `x` y `y`: posición en píxeles dentro del contenedor (el recuadro se centra en `x` y queda encima de `y`).
 */
export default function TooltipGrafica({ visible, x, y, titulo, filas = [] }) {
  if (!visible) return null;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-[160px] max-w-[260px] -translate-x-1/2 -translate-y-full rounded-[8px] border border-border bg-surface px-3 py-2 text-xs shadow-lg"
      style={{ left: x, top: y - 8 }}
    >
      <p className="mb-1 font-semibold text-ink-900 leading-snug">{titulo}</p>
      <ul className="space-y-0.5">
        {filas.map((fila) => (
          <li key={fila.nombre} className="flex items-center justify-between gap-3 text-ink-600">
            <span className="flex items-center gap-1.5">
              {fila.color && <span className="inline-block h-2 w-2 rounded-[2px]" style={{ background: fila.color }} aria-hidden="true" />}
              {fila.nombre}
            </span>
            <span className="font-semibold tabular-nums text-ink-900">{fila.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
