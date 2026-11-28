import { esAdministrador, tienePermiso } from '../../utils/permisos';

/**
 * @file indicadoresUtils.js
 * @description Reglas y formatos del dashboard de indicadores de un evento (HU-29: CU-25, RF50, RF51), sin
 * dependencias de React para poder probarlas por separado. El backend calcula todo
 * (`GET /api/v1/eventos/{id}/indicadores`); aquí solo se ordena, se formatea y se decide cómo graficar cada serie.
 * @module features/indicadores/indicadoresUtils
 */

/** Permisos con los que el backend entrega los indicadores (además de ser administrador). */
export const PERMISOS_INDICADORES = ['REPORTES_VER', 'EVENTOS_EDITAR'];

/**
 * Colores de las series, en orden fijo (paleta categórica validada para daltonismo sobre fondo blanco). Como cuatro
 * de ellos tienen menos de 3:1 de contraste con el fondo, cada gráfica muestra sus valores en texto y tiene su vista
 * de tabla. El texto nunca usa estos colores.
 */
export const COLORES_SERIE = ['#257de0', '#f47230', '#00b894', '#f2a600', '#ee7fac', '#008a17', '#6a4ce2', '#ec4647'];

/**
 * Color fijo de cada categoría de las series de partes de un todo: el color sigue a la categoría, no a su posición,
 * así que no cambia aunque el orden por cantidad cambie al actualizar.
 */
const ORDEN_COLOR_CLAVES = {
  INSCRIPCIONES_POR_CATEGORIA: ['estudiante', 'egresado', 'docente', 'particular', 'administrativo'],
  PROPUESTAS_POR_ESTADO: ['recibida', 'en_evaluacion', 'ajustes', 'aprobada', 'rechazada'],
};

/**
 * Color de una categoría (punto) de una serie segmentada.
 * @param {string} serieCodigo
 * @param {string} clave
 * @param {number} indice - Posición del punto, solo para categorías que no están en la lista fija.
 */
export function colorCategoria(serieCodigo, clave, indice) {
  const orden = ORDEN_COLOR_CLAVES[serieCodigo] || [];
  const posicion = orden.indexOf(String(clave));
  const i = posicion >= 0 ? posicion : orden.length + indice;
  return COLORES_SERIE[i % COLORES_SERIE.length];
}

/** Indicadores que se muestran como tarjetas arriba del dashboard, en este orden. */
export const INDICADORES_TARJETA = [
  'INSCRITOS',
  'ASISTENTES',
  'TASA_ASISTENCIA',
  'SATISFACCION_PROMEDIO',
  'TASA_APROBACION',
  'EJECUCION_PRESUPUESTAL',
];

/**
 * Cómo se grafica cada serie que envía el backend:
 * - `forma`: `segmentada` (un todo dividido en partes), `linea` o `barras` (horizontales).
 * - `graficadas`: medidas que se dibujan (todas con la misma unidad: nunca dos ejes).
 * - `detalle`: medidas que solo se muestran en el texto, el tooltip y la tabla.
 * - `maximo`: escala fija (por ejemplo, 100 para porcentajes).
 */
const CONFIGURACION_SERIES = {
  INSCRIPCIONES_POR_CATEGORIA: { forma: 'segmentada', graficadas: ['inscritos'], detalle: [] },
  PROPUESTAS_POR_ESTADO: { forma: 'segmentada', graficadas: ['propuestas'], detalle: [] },
  INSCRIPCIONES_POR_FECHA: { forma: 'linea', graficadas: ['acumulado'], detalle: ['inscripciones'] },
  ASISTENCIA_POR_ACTIVIDAD: { forma: 'barras', graficadas: ['inscritos', 'asistentes'], detalle: ['tasaAsistencia'] },
  ASISTENCIA_POR_DIA: { forma: 'barras', graficadas: ['inscritos', 'asistentes'], detalle: ['tasaAsistencia'] },
  SATISFACCION_POR_ENCUESTA: { forma: 'barras', graficadas: ['satisfaccion'], detalle: ['respuestas'], maximo: 100 },
  PRESUPUESTO_POR_RUBRO: { forma: 'barras', graficadas: ['proyectado', 'ejecutado'], detalle: [] },
};

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Indica si la sesión puede ver los indicadores de los eventos. La API también lo valida.
 * @param {Object|null|undefined} usuario
 */
export function veIndicadoresEvento(usuario) {
  return esAdministrador(usuario) || PERMISOS_INDICADORES.some((p) => tienePermiso(usuario, p));
}

/** Ruta de la página de indicadores de un evento. */
export function rutaIndicadores(eventoId) {
  return `/eventos/${eventoId}/indicadores`;
}

const numeroValido = (valor) => valor !== null && valor !== undefined && valor !== '' && !Number.isNaN(Number(valor));

/** Pesos colombianos sin decimales. */
export function formatearPesos(valor) {
  if (!numeroValido(valor)) return '—';
  return `$ ${Math.round(Number(valor)).toLocaleString('es-CO')}`;
}

/**
 * Valor con su unidad: porcentajes con un decimal, pesos sin decimales y el resto con separador de miles.
 * @param {number|null|undefined} valor
 * @param {string} [unidad]
 */
export function formatearValor(valor, unidad) {
  if (!numeroValido(valor)) return '—';
  const numero = Number(valor);
  if (unidad === '%') return `${numero.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;
  if (unidad === 'COP') return formatearPesos(numero);
  return numero.toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

/**
 * Valor corto para los ejes: los pesos en miles o millones.
 * @param {number} valor
 * @param {string} [unidad]
 */
export function formatearValorCorto(valor, unidad) {
  if (!numeroValido(valor)) return '—';
  const numero = Number(valor);
  if (unidad === 'COP') {
    if (Math.abs(numero) >= 1_000_000) {
      return `$ ${(numero / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`;
    }
    if (Math.abs(numero) >= 1_000) return `$ ${(numero / 1_000).toLocaleString('es-CO', { maximumFractionDigits: 0 })} mil`;
    return formatearPesos(numero);
  }
  if (unidad === '%') return `${numero.toLocaleString('es-CO', { maximumFractionDigits: 0 })} %`;
  return numero.toLocaleString('es-CO', { maximumFractionDigits: 1 });
}

/**
 * Fecha AAAA-MM-DD como «1 nov» (o «1 nov 2026» con `conAnio`). Se arma a mano para no depender de la zona horaria.
 * @param {string} valor
 * @param {boolean} [conAnio]
 */
export function etiquetaFecha(valor, conAnio = false) {
  const coincide = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor || ''));
  if (!coincide) return String(valor ?? '');
  const [, anio, mes, dia] = coincide;
  const texto = `${Number(dia)} ${MESES[Number(mes) - 1] || mes}`;
  return conAnio ? `${texto} ${anio}` : texto;
}

/** Fecha y hora del cálculo (dd/mm/aaaa hh:mm). */
export function formatearFechaCalculo(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

/**
 * Indicadores de las tarjetas, en el orden de {@link INDICADORES_TARJETA}; los que no llegan se omiten.
 * @param {Array<{ codigo: string }>} indicadores
 */
export function indicadoresTarjeta(indicadores) {
  const porCodigo = new Map((indicadores || []).map((i) => [i.codigo, i]));
  return INDICADORES_TARJETA.map((codigo) => porCodigo.get(codigo)).filter(Boolean);
}

/**
 * Indicadores agrupados para la vista en tabla, en el orden de los grupos que envía el backend. Los indicadores de
 * un grupo que no llegó en `grupos` se agregan al final con su código como nombre.
 * @param {{ grupos?: Array<Object>, indicadores?: Array<Object> }} respuesta
 * @returns {Array<{ codigo: string, nombre: string, hayDatos: boolean, mensaje: string|null,
 *   indicadores: Array<Object> }>}
 */
export function indicadoresPorGrupo(respuesta) {
  const grupos = (respuesta?.grupos || []).map((g) => ({ ...g, indicadores: [] }));
  const porCodigo = new Map(grupos.map((g) => [g.codigo, g]));
  (respuesta?.indicadores || []).forEach((indicador) => {
    let grupo = porCodigo.get(indicador.grupo);
    if (!grupo) {
      grupo = { codigo: indicador.grupo || 'OTROS', nombre: 'Otros indicadores', hayDatos: true, mensaje: null, indicadores: [] };
      porCodigo.set(grupo.codigo, grupo);
      grupos.push(grupo);
    }
    grupo.indicadores.push(indicador);
  });
  return grupos.filter((g) => g.indicadores.length > 0);
}

/**
 * Cómo graficar una serie. Las series conocidas tienen su configuración; las demás se deducen del tipo de gráfico
 * sugerido por el backend, dibujando solo las medidas con la misma unidad que la primera (nunca dos ejes).
 * @param {{ codigo: string, grafico?: string, medidas?: Array<{ codigo: string, unidad: string }> }} serie
 * @returns {{ forma: 'segmentada'|'linea'|'barras', graficadas: string[], detalle: string[], maximo?: number }}
 */
export function configuracionSerie(serie) {
  const medidas = serie?.medidas || [];
  const conocida = CONFIGURACION_SERIES[serie?.codigo];
  if (conocida) {
    const existentes = new Set(medidas.map((m) => m.codigo));
    const graficadas = conocida.graficadas.filter((m) => existentes.has(m));
    if (graficadas.length > 0) {
      return { ...conocida, graficadas, detalle: conocida.detalle.filter((m) => existentes.has(m)) };
    }
  }
  const primera = medidas[0];
  if (!primera) return { forma: 'barras', graficadas: [], detalle: [] };
  const forma = serie?.grafico === 'circular' ? 'segmentada' : serie?.grafico === 'linea' ? 'linea' : 'barras';
  const graficadas =
    serie?.grafico === 'barras_agrupadas'
      ? medidas.filter((m) => m.unidad === primera.unidad).map((m) => m.codigo)
      : [primera.codigo];
  const detalle = medidas.map((m) => m.codigo).filter((c) => !graficadas.includes(c));
  return { forma, graficadas, detalle };
}

/** Series que ocupan todo el ancho del dashboard cuando tienen datos (muchas filas con nombres largos). */
export const SERIES_ANCHAS = ['ASISTENCIA_POR_ACTIVIDAD', 'PRESUPUESTO_POR_RUBRO'];

/**
 * Qué gráficas del dashboard ocupan todo el ancho en la cuadrícula de dos columnas: las de {@link SERIES_ANCHAS} con
 * datos y, para no dejar huecos, la de media columna que quedaría sola en su fila (antes de una ancha o al final).
 * @param {Array<{ codigo: string, hayDatos: boolean }>} series - En el orden en que se muestran.
 * @returns {Set<string>} Códigos de las series a todo el ancho.
 */
export function seriesAnchoCompleto(series) {
  const lista = series || [];
  const esAncha = (s) => SERIES_ANCHAS.includes(s.codigo) && s.hayDatos;
  const anchas = new Set();
  let columna = 0;
  lista.forEach((serie, i) => {
    if (esAncha(serie)) {
      anchas.add(serie.codigo);
      columna = 0;
      return;
    }
    const siguiente = lista[i + 1];
    if (columna === 0 && (!siguiente || esAncha(siguiente))) {
      anchas.add(serie.codigo);
      return;
    }
    columna = columna === 0 ? 1 : 0;
  });
  return anchas;
}

/**
 * Escala «redonda» para un eje que empieza en cero: máximo y marcas (0, ¼, ½, ¾ y máximo).
 * @param {Array<number|null>} valores
 * @param {number} [fijo] - Máximo fijo (por ejemplo, 100 para porcentajes).
 * @returns {{ maximo: number, marcas: number[] }}
 */
export function escalaEje(valores, fijo) {
  let maximo = fijo;
  if (!maximo) {
    const numeros = (valores || []).filter(numeroValido).map(Number);
    const mayor = Math.max(0, ...numeros);
    if (mayor <= 0) {
      maximo = 1;
    } else {
      // Paso «redondo» (1, 2, 2,5 o 5 × 10ⁿ) para cuatro divisiones; con conteos, nunca menor que 1.
      const potencia = 10 ** Math.floor(Math.log10(mayor / 4));
      let paso = [1, 2, 2.5, 5, 10].map((f) => f * potencia).find((p) => p * 4 >= mayor);
      if (numeros.every(Number.isInteger)) paso = Math.max(1, Math.ceil(paso));
      maximo = paso * 4;
    }
  }
  const marcas = [0, 1, 2, 3, 4].map((i) => Number(((maximo * i) / 4).toPrecision(12)));
  return { maximo, marcas };
}

/** Suma de una medida en todos los puntos (los nulos no cuentan). */
export function totalMedida(puntos, medida) {
  return (puntos || []).reduce((suma, p) => suma + (numeroValido(p?.valores?.[medida]) ? Number(p.valores[medida]) : 0), 0);
}

/** `parte / total` en porcentaje con un decimal; 0 si el total es 0. */
export function porcentajeDe(parte, total) {
  if (!total) return 0;
  return Math.round((Number(parte) / total) * 1000) / 10;
}

/** Medida de la serie por su código. */
export function medidaDe(serie, codigo) {
  return (serie?.medidas || []).find((m) => m.codigo === codigo) || { codigo, nombre: codigo, unidad: '' };
}

/**
 * Etiqueta visible de un punto: las fechas (AAAA-MM-DD) se muestran como «1 nov».
 * @param {{ clave: string, etiqueta: string }} punto
 */
export function etiquetaPunto(punto) {
  const etiqueta = punto?.etiqueta ?? punto?.clave ?? '';
  return /^\d{4}-\d{2}-\d{2}$/.test(String(etiqueta)) ? etiquetaFecha(etiqueta) : String(etiqueta);
}

/**
 * Filas de la vista en tabla de una serie: etiqueta del punto y el valor formateado de cada medida.
 * @param {Object} serie
 * @returns {{ columnas: Array<{ codigo: string, nombre: string, unidad: string }>,
 *   filas: Array<{ clave: string, etiqueta: string, celdas: string[] }> }}
 */
export function tablaSerie(serie) {
  const columnas = serie?.medidas || [];
  const filas = (serie?.puntos || []).map((p) => ({
    clave: String(p.clave),
    etiqueta: etiquetaPunto(p),
    celdas: columnas.map((m) => formatearValor(p.valores?.[m.codigo], m.unidad)),
  }));
  return { columnas, filas };
}

/**
 * Indica si el foco llegó con el teclado (`:focus-visible`). Las gráficas muestran el detalle al enfocar con el
 * teclado; con el mouse ya lo muestran al pasar por encima, y así un clic no deja un recuadro abierto.
 * @param {{ currentTarget?: Element }} evento
 */
export function focoConTeclado(evento) {
  try {
    return Boolean(evento?.currentTarget?.matches?.(':focus-visible'));
  } catch {
    return true;
  }
}

/**
 * Quita el foco de una marca de otra gráfica (atributo `data-marca-grafica`) cuando el mouse entra en esta, para que
 * nunca haya dos recuadros de detalle abiertos a la vez.
 * @param {Element|null} contenedor - Contenedor de la gráfica que se activa.
 */
export function soltarFocoAjeno(contenedor) {
  const activo = typeof document !== 'undefined' ? document.activeElement : null;
  if (activo && activo.hasAttribute?.('data-marca-grafica') && !contenedor?.contains(activo)) activo.blur();
}

const MENSAJE_POR_ESTADO = {
  403: 'Tu usuario no tiene permiso para ver los indicadores de este evento.',
  404: 'No se encontró el evento.',
  500: 'El servidor tuvo un problema. Intenta de nuevo en unos minutos.',
};

/**
 * Traduce un error de la API de indicadores.
 * @param {any} err
 * @returns {{ titulo: string, mensaje: string, status?: number }}
 */
export function interpretarErrorIndicadores(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const mensajeBackend = typeof data?.message === 'string' && data.message.trim() ? data.message : null;

  let mensaje;
  if (status === 401) mensaje = 'Tu sesión expiró. Inicia sesión de nuevo.';
  else if (status === 403) mensaje = MENSAJE_POR_ESTADO[403];
  else if (status === 404) mensaje = mensajeBackend || MENSAJE_POR_ESTADO[404];
  else if (err?.request && !err?.response) {
    mensaje = 'No fue posible conectarse con el servidor. Verifica que el backend esté activo.';
  } else if (status >= 500) mensaje = MENSAJE_POR_ESTADO[500];
  else mensaje = mensajeBackend || 'No fue posible calcular los indicadores. Intenta de nuevo.';

  const titulo =
    status === 403 ? 'Acceso denegado' : status === 404 ? 'Evento no encontrado' : 'No se pudieron calcular los indicadores';
  return { titulo, mensaje, status };
}
