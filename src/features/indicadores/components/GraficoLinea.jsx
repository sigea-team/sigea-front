import { useEffect, useRef, useState } from 'react';
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
  valorDetalle,
} from '../indicadoresUtils';

/**
 * @file GraficoLinea.jsx
 * @description Línea de una medida en el tiempo para el dashboard de indicadores (HU-29), por ejemplo, el total
 * acumulado de inscripciones. Un solo eje que empieza en cero; el último valor va escrito al final de la línea y el
 * detalle de cada punto (incluidas las medidas que no se dibujan) aparece con una guía vertical al pasar el mouse o
 * al enfocar el punto con el teclado. Mide su ancho real para que el texto no se deforme.
 * @module features/indicadores/components/GraficoLinea
 */

const ALTO = 220;
const MARGEN = { arriba: 18, derecha: 56, abajo: 28, izquierda: 44 };

/** Ancho real del contenedor (con ResizeObserver cuando el navegador lo tiene). */
function useAncho(ref, inicial = 600) {
  const [ancho, setAncho] = useState(inicial);
  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || typeof ResizeObserver === 'undefined') return undefined;
    const observador = new ResizeObserver(([entrada]) => {
      const medido = Math.round(entrada.contentRect.width);
      if (medido > 0) setAncho(medido);
    });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [ref]);
  return ancho;
}

/**
 * @param {{ serie: Object, graficadas: string[], detalle?: string[] }} props - Se dibuja la primera medida de
 * `graficadas`.
 */
export default function GraficoLinea({ serie, graficadas, detalle = [] }) {
  const contenedor = useRef(null);
  const ancho = useAncho(contenedor);
  const [activo, setActivo] = useState(null);

  const medida = medidaDe(serie, graficadas[0]);
  const puntos = serie.puntos;
  const escala = escalaEje(puntos.map((p) => p.valores?.[medida.codigo]));
  const interior = { ancho: Math.max(60, ancho - MARGEN.izquierda - MARGEN.derecha), alto: ALTO - MARGEN.arriba - MARGEN.abajo };
  const paso = puntos.length > 1 ? interior.ancho / (puntos.length - 1) : 0;
  const x = (i) => MARGEN.izquierda + (puntos.length > 1 ? i * paso : interior.ancho / 2);
  const y = (valor) => MARGEN.arriba + interior.alto - (Number(valor || 0) / escala.maximo) * interior.alto;
  const cadaCuanto = Math.max(1, Math.ceil(puntos.length / Math.max(2, Math.floor(interior.ancho / 70))));

  // Un punto sin dato corta la línea: no se dibuja como cero ni se une a los vecinos.
  const sinDato = (p) => {
    const valor = p?.valores?.[medida.codigo];
    return valor === null || valor === undefined || Number.isNaN(Number(valor));
  };
  // Un punto empieza tramo nuevo («M») si es el primero o si el anterior no tiene dato; si no, continúa («L»).
  const trazo = puntos
    .map((p, i) => {
      if (sinDato(p)) return '';
      const comando = i > 0 && !sinDato(puntos[i - 1]) ? 'L' : 'M';
      return `${comando}${x(i)},${y(p.valores[medida.codigo])}`;
    })
    .filter(Boolean)
    .join(' ');
  const indiceUltimo = puntos.map((p) => !sinDato(p)).lastIndexOf(true);
  const ultimo = indiceUltimo >= 0 ? puntos[indiceUltimo] : null;
  const puntoActivo = activo !== null ? puntos[activo] : null;

  return (
    <div ref={contenedor} className="relative" onMouseEnter={() => soltarFocoAjeno(contenedor.current)} onMouseLeave={() => setActivo(null)}>
      <svg width={ancho} height={ALTO} role="img" aria-label={`${serie.titulo}. ${medida.nombre} al final: ${formatearValor(ultimo?.valores?.[medida.codigo], medida.unidad)}`}>
        {escala.marcas.map((marca) => (
          <g key={marca}>
            <line x1={MARGEN.izquierda} x2={MARGEN.izquierda + interior.ancho} y1={y(marca)} y2={y(marca)} stroke="var(--color-border)" strokeWidth="1" />
            <text x={MARGEN.izquierda - 8} y={y(marca)} dy="0.32em" textAnchor="end" fontSize="10" fill="var(--color-ink-600)">
              {formatearValorCorto(marca, medida.unidad)}
            </text>
          </g>
        ))}
        {puntos.map((p, i) =>
          i % cadaCuanto === 0 || i === puntos.length - 1 ? (
            <text key={`x-${p.clave}`} x={x(i)} y={ALTO - 8} textAnchor="middle" fontSize="10" fill="var(--color-ink-600)">
              {etiquetaPunto(p)}
            </text>
          ) : null
        )}
        {puntoActivo && (
          <line x1={x(activo)} x2={x(activo)} y1={MARGEN.arriba} y2={MARGEN.arriba + interior.alto} stroke="var(--color-ink-300)" strokeWidth="1" strokeDasharray="3 3" />
        )}
        <path d={trazo} fill="none" stroke={COLORES_SERIE[0]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {puntos.map((p, i) => sinDato(p) ? null : (
          <circle
            key={p.clave}
            cx={x(i)}
            cy={y(p.valores?.[medida.codigo])}
            r={activo === i ? 5 : 4}
            fill={COLORES_SERIE[0]}
            stroke="var(--color-surface)"
            strokeWidth="2"
          />
        ))}
        {ultimo && (
          <text x={x(indiceUltimo) + 8} y={y(ultimo.valores?.[medida.codigo])} dy="0.32em" fontSize="11" fontWeight="600" fill="var(--color-ink-900)">
            {formatearValorCorto(ultimo.valores?.[medida.codigo], medida.unidad)}
          </text>
        )}
        {puntos.map((p, i) => {
          const izquierda = puntos.length > 1 ? x(i) - paso / 2 : MARGEN.izquierda;
          const anchoZona = puntos.length > 1 ? paso : interior.ancho;
          const resumen = [medida.codigo, ...detalle]
            .map((c) => `${medidaDe(serie, c).nombre}: ${valorDetalle(p.valores?.[c], medidaDe(serie, c).unidad)}`)
            .join(', ');
          return (
            <rect
              key={`zona-${p.clave}`}
              x={Math.max(MARGEN.izquierda - 10, izquierda)}
              y={MARGEN.arriba}
              width={anchoZona}
              height={interior.alto}
              fill="transparent"
              tabIndex={0}
              data-marca-grafica=""
              role="button"
              aria-label={`${etiquetaPunto(p)}. ${resumen}`}
              className="outline-none focus-visible:stroke-brand-600"
              onMouseEnter={() => setActivo(i)}
              onFocus={(e) => focoConTeclado(e) && setActivo(i)}
              onBlur={() => setActivo(null)}
            />
          );
        })}
      </svg>
      <TooltipGrafica
        visible={Boolean(puntoActivo)}
        x={puntoActivo ? Math.min(Math.max(x(activo), 90), ancho - 90) : 0}
        y={puntoActivo ? (sinDato(puntoActivo) ? MARGEN.arriba + interior.alto : y(puntoActivo.valores[medida.codigo])) : 0}
        titulo={puntoActivo ? etiquetaPunto(puntoActivo) : ''}
        filas={
          puntoActivo
            ? [
                { nombre: medida.nombre, valor: valorDetalle(puntoActivo.valores?.[medida.codigo], medida.unidad), color: COLORES_SERIE[0] },
                ...detalle.map((c) => ({ nombre: medidaDe(serie, c).nombre, valor: valorDetalle(puntoActivo.valores?.[c], medidaDe(serie, c).unidad) })),
              ]
            : []
        }
      />
    </div>
  );
}
