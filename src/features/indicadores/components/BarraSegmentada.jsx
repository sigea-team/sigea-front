import { useRef, useState } from 'react';
import TooltipGrafica from './TooltipGrafica';
import { colorCategoria, focoConTeclado, formatearValor, soltarFocoAjeno, medidaDe, porcentajeDe, totalMedida } from '../indicadoresUtils';

/**
 * @file BarraSegmentada.jsx
 * @description Un todo dividido en partes para el dashboard de indicadores (HU-29), por ejemplo, los inscritos por
 * categoría o las propuestas por estado. Una barra con un segmento por categoría (separados por 2 px del fondo) y
 * debajo la leyenda con el valor y el porcentaje de cada una, así la identidad nunca depende solo del color.
 * @module features/indicadores/components/BarraSegmentada
 */

/** @param {{ serie: Object, graficadas: string[] }} props - Se usa la primera medida de `graficadas`. */
export default function BarraSegmentada({ serie, graficadas }) {
  const contenedor = useRef(null);
  const [activo, setActivo] = useState(null); // { indice, x, y }
  const medida = medidaDe(serie, graficadas[0]);
  const puntos = serie.puntos.filter((p) => Number(p.valores?.[medida.codigo]) > 0);
  const total = totalMedida(puntos, medida.codigo);

  const mostrar = (indice) => (evento) => {
    const caja = contenedor.current?.getBoundingClientRect();
    const segmento = evento.currentTarget.getBoundingClientRect();
    if (!caja) return;
    setActivo({ indice, x: segmento.left - caja.left + segmento.width / 2, y: segmento.top - caja.top });
  };

  const puntoActivo = activo ? puntos[activo.indice] : null;

  return (
    <div ref={contenedor} className="relative space-y-4" onMouseEnter={() => soltarFocoAjeno(contenedor.current)} onMouseLeave={() => setActivo(null)}>
      <div>
        <p className="text-2xl font-semibold text-ink-900">{formatearValor(total, medida.unidad)}</p>
        <p className="text-xs text-ink-600">{medida.nombre} en total</p>
      </div>

      <div className="flex h-7 w-full gap-[2px]" role="img" aria-label={`${serie.titulo}: ${puntos
        .map((p) => `${p.etiqueta} ${formatearValor(p.valores?.[medida.codigo], medida.unidad)}`)
        .join(', ')}`}>
        {puntos.map((p, i) => (
          <span
            key={p.clave}
            className="block h-full first:rounded-l-[4px] last:rounded-r-[4px]"
            style={{
              flexGrow: Number(p.valores?.[medida.codigo]),
              flexBasis: 0,
              minWidth: 2,
              background: colorCategoria(serie.codigo, p.clave, i),
              opacity: activo && activo.indice !== i ? 0.55 : 1,
            }}
            onMouseEnter={mostrar(i)}
          />
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-y-1.5">
        {puntos.map((p, i) => (
          <li
            key={p.clave}
            tabIndex={0}
            data-marca-grafica=""
            onFocus={(e) => focoConTeclado(e) && mostrar(i)(e)}
            onBlur={() => setActivo(null)}
            className="flex items-center justify-between gap-3 rounded-[6px] px-1 py-0.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <span className="flex min-w-0 items-center gap-2 text-ink-900">
              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: colorCategoria(serie.codigo, p.clave, i) }} aria-hidden="true" />
              <span className="truncate" title={p.etiqueta}>{p.etiqueta}</span>
            </span>
            <span className="whitespace-nowrap tabular-nums text-ink-600">
              <span className="font-semibold text-ink-900">{formatearValor(p.valores?.[medida.codigo], medida.unidad)}</span>
              {' · '}
              {porcentajeDe(p.valores?.[medida.codigo], total).toLocaleString('es-CO')} %
            </span>
          </li>
        ))}
      </ul>

      <TooltipGrafica
        visible={Boolean(puntoActivo)}
        x={activo?.x ?? 0}
        y={activo?.y ?? 0}
        titulo={puntoActivo?.etiqueta || ''}
        filas={
          puntoActivo
            ? [
                {
                  nombre: medida.nombre,
                  valor: formatearValor(puntoActivo.valores?.[medida.codigo], medida.unidad),
                  color: colorCategoria(serie.codigo, puntoActivo.clave, activo.indice),
                },
                { nombre: 'Del total', valor: `${porcentajeDe(puntoActivo.valores?.[medida.codigo], total).toLocaleString('es-CO')} %` },
              ]
            : []
        }
      />
    </div>
  );
}
