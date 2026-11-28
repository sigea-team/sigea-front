import { formatearValor, indicadoresTarjeta } from '../indicadoresUtils';

/**
 * @file TarjetasIndicadores.jsx
 * @description Indicadores principales del evento como tarjetas, arriba del dashboard (HU-29). Un indicador sin datos
 * suficientes muestra «Sin datos» y su motivo, sin error (Criterio 2).
 * @module features/indicadores/components/TarjetasIndicadores
 */

/** @param {{ indicadores: Array<Object> }} props */
export default function TarjetasIndicadores({ indicadores = [] }) {
  const tarjetas = indicadoresTarjeta(indicadores);
  if (tarjetas.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores principales">
      {tarjetas.map((i) => (
        <li key={i.codigo} className="flex flex-col gap-1 rounded-[12px] border border-border bg-surface p-4">
          <p className="text-xs text-ink-600 leading-snug">{i.nombre}</p>
          {i.disponible ? (
            <p className="text-2xl font-semibold text-ink-900">{formatearValor(i.valor, i.unidad)}</p>
          ) : (
            <>
              <p className="text-base font-semibold text-ink-600">Sin datos</p>
              <p className="text-[11px] text-ink-600 leading-snug">{i.motivo}</p>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
