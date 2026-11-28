import { useRef, useState } from 'react';
import TooltipGrafica from './TooltipGrafica';
import {
  COLORES_SERIE,
  escalaEje,
  etiquetaPunto,
  focoConTeclado,
  soltarFocoAjeno,
  formatearValor,
  formatearValorCorto,
  medidaDe,
} from '../indicadoresUtils';

/**
 * @file GraficoBarras.jsx
 * @description Barras horizontales del dashboard de indicadores (HU-29): una o dos medidas con la misma unidad por
 * categoría (por ejemplo, inscritos y asistentes por actividad). Las etiquetas largas caben a la izquierda, el valor
 * va en la punta de cada barra y el detalle completo (incluidas las medidas que no se dibujan, como la tasa) sale al
 * pasar el mouse o al enfocar la fila con el teclado.
 * @module features/indicadores/components/GraficoBarras
 */

/**
 * @param {{ serie: Object, graficadas: string[], detalle?: string[], maximo?: number }} props
 */
export default function GraficoBarras({ serie, graficadas, detalle = [], maximo }) {
  const contenedor = useRef(null);
  const [activo, setActivo] = useState(null); // { indice, x, y }

  const medidas = graficadas.map((codigo) => medidaDe(serie, codigo));
  const unidad = medidas[0]?.unidad;
  const valores = serie.puntos.flatMap((p) => graficadas.map((m) => p.valores?.[m]));
  const escala = escalaEje(valores, maximo);
  const ancho = (valor) =>
    valor === null || valor === undefined ? 0 : Math.min(100, Math.max(0, (Number(valor) / escala.maximo) * 100));

  const mostrar = (indice) => (evento) => {
    const caja = contenedor.current?.getBoundingClientRect();
    const fila = evento.currentTarget.getBoundingClientRect();
    if (!caja) return;
    setActivo({ indice, x: fila.left - caja.left + fila.width * 0.62, y: fila.top - caja.top });
  };
  const ocultar = () => setActivo(null);

  const puntoActivo = activo ? serie.puntos[activo.indice] : null;
  const filasTooltip = puntoActivo
    ? [
        ...graficadas.map((codigo, i) => ({
          nombre: medidaDe(serie, codigo).nombre,
          valor: formatearValor(puntoActivo.valores?.[codigo], medidaDe(serie, codigo).unidad),
          color: COLORES_SERIE[i],
        })),
        ...detalle.map((codigo) => ({
          nombre: medidaDe(serie, codigo).nombre,
          valor: formatearValor(puntoActivo.valores?.[codigo], medidaDe(serie, codigo).unidad),
        })),
      ]
    : [];

  return (
    <div ref={contenedor} className="relative" onMouseEnter={() => soltarFocoAjeno(contenedor.current)} onMouseLeave={ocultar}>
      <ul className="space-y-2.5">
        {serie.puntos.map((punto, indice) => {
          const etiqueta = etiquetaPunto(punto);
          const resumen = [...graficadas, ...detalle]
            .map((codigo) => `${medidaDe(serie, codigo).nombre}: ${formatearValor(punto.valores?.[codigo], medidaDe(serie, codigo).unidad)}`)
            .join(', ');
          return (
            <li
              key={punto.clave}
              tabIndex={0}
              data-marca-grafica=""
              aria-label={`${etiqueta}. ${resumen}`}
              onMouseEnter={mostrar(indice)}
              onFocus={(e) => focoConTeclado(e) && mostrar(indice)(e)}
              onBlur={ocultar}
              className={`grid grid-cols-[minmax(0,38%)_minmax(0,1fr)] items-center gap-3 rounded-[6px] px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                activo?.indice === indice ? 'bg-surface-muted' : ''
              }`}
            >
              <span className="text-xs text-ink-900 leading-snug line-clamp-2" title={etiqueta}>
                {etiqueta}
              </span>
              <div className="relative pr-16">
                <div className="absolute inset-y-0 left-0 right-16" aria-hidden="true">
                  {escala.marcas.slice(1).map((marca) => (
                    <span key={marca} className="absolute inset-y-0 w-px bg-border" style={{ left: `${(marca / escala.maximo) * 100}%` }} />
                  ))}
                </div>
                <div className="relative space-y-[2px]">
                  {graficadas.map((codigo, i) => {
                    const valor = punto.valores?.[codigo];
                    const sinDato = valor === null || valor === undefined;
                    return (
                      <div key={codigo} className="flex h-3 items-center gap-1.5">
                        {sinDato ? (
                          <span className="text-[11px] italic text-ink-600">Sin dato</span>
                        ) : (
                          <>
                            <span
                              className="block h-full rounded-r-[4px]"
                              style={{ width: `${ancho(valor)}%`, minWidth: Number(valor) > 0 ? 2 : 0, background: COLORES_SERIE[i] }}
                              aria-hidden="true"
                            />
                            <span className="whitespace-nowrap text-[11px] tabular-nums text-ink-600">
                              {formatearValorCorto(valor, unidad)}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 grid grid-cols-[minmax(0,38%)_minmax(0,1fr)] gap-3 px-1" aria-hidden="true">
        <span />
        <div className="relative h-4 pr-16">
          <div className="absolute inset-y-0 left-0 right-16">
            {escala.marcas.map((marca, i) => (
              <span
                key={marca}
                className={`absolute top-0 whitespace-nowrap text-[10px] tabular-nums text-ink-600 ${
                  i === 0 ? '' : i === escala.marcas.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
                }`}
                style={{ left: `${(marca / escala.maximo) * 100}%` }}
              >
                {formatearValorCorto(marca, unidad)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <TooltipGrafica
        visible={Boolean(puntoActivo)}
        x={activo?.x ?? 0}
        y={activo?.y ?? 0}
        titulo={puntoActivo ? etiquetaPunto(puntoActivo) : ''}
        filas={filasTooltip}
      />
    </div>
  );
}
