import { formatearPorcentaje } from '../ejecucionUtils';

/**
 * @file BarraEjecucion.jsx
 * @description Barra de progreso del porcentaje de ejecución presupuestal (HU-09: RF12).
 * La barra se llena hasta 100 %; si lo ejecutado supera lo presupuestado se muestra llena,
 * en el tono oscuro del color institucional, y el texto conserva el porcentaje real (ej. 107 %).
 * @module features/presupuesto/components/BarraEjecucion
 */

/**
 * @param {Object} props
 * @param {number} props.porcentaje - Porcentaje de ejecución (puede pasar de 100).
 * @param {boolean} [props.excedido=false] - Lo ejecutado supera lo presupuestado.
 * @param {string} props.etiqueta - Texto accesible, ej. "Ejecución de Refrigerios".
 * @param {'sm'|'lg'} [props.tamano='sm'] - Grosor de la barra.
 * @param {boolean} [props.mostrarValor=true] - Muestra el porcentaje a la derecha.
 */
export default function BarraEjecucion({ porcentaje, excedido = false, etiqueta, tamano = 'sm', mostrarValor = true }) {
  const valor = Number(porcentaje) || 0;
  const ancho = Math.min(Math.max(valor, 0), 100);
  const alto = tamano === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        role="progressbar"
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ancho)}
        aria-valuetext={formatearPorcentaje(valor)}
        className={`flex-1 ${alto} rounded-full bg-[#edeeef] overflow-hidden`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${excedido ? 'bg-[#7a0c1e]' : 'bg-[#a6192e]'}`}
          style={{ width: `${ancho}%` }}
        />
      </div>
      {mostrarValor && (
        <span
          className={`text-xs font-semibold tabular-nums whitespace-nowrap min-w-[52px] text-right ${
            excedido ? 'text-[#7a0c1e]' : 'text-[#1f2023]'
          }`}
        >
          {formatearPorcentaje(valor)}
        </span>
      )}
    </div>
  );
}
