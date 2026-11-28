/**
 * @file LeyendaGrafica.jsx
 * @description Leyenda de una gráfica con dos o más medidas (HU-29). El color identifica la marca; el texto va siempre
 * en los colores de texto del sistema.
 * @module features/indicadores/components/LeyendaGrafica
 */

/** @param {{ elementos: Array<{ codigo: string, nombre: string, color: string }> }} props */
export default function LeyendaGrafica({ elementos = [] }) {
  if (elementos.length < 2) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600" aria-label="Leyenda">
      {elementos.map((e) => (
        <li key={e.codigo} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: e.color }} aria-hidden="true" />
          {e.nombre}
        </li>
      ))}
    </ul>
  );
}
