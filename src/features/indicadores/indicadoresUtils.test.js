import { describe, expect, it } from 'vitest';
import {
  COLORES_SERIE,
  colorCategoria,
  configuracionSerie,
  escalaEje,
  etiquetaFecha,
  etiquetaPunto,
  formatearFechaCalculo,
  formatearValor,
  formatearValorCorto,
  indicadoresPorGrupo,
  indicadoresTarjeta,
  interpretarErrorIndicadores,
  porcentajeDe,
  rutaIndicadores,
  seriesAnchoCompleto,
  tablaSerie,
  totalMedida,
  veIndicadoresEvento,
} from './indicadoresUtils';

describe('veIndicadoresEvento', () => {
  it('lo ve el administrador o quien tiene REPORTES_VER o EVENTOS_EDITAR', () => {
    expect(veIndicadoresEvento({ roles: ['ADMIN'] })).toBe(true);
    expect(veIndicadoresEvento({ roles: ['ORGANIZADOR'], permisos: ['REPORTES_VER'] })).toBe(true);
    expect(veIndicadoresEvento({ roles: ['ORGANIZADOR'], permisos: ['eventos_editar'] })).toBe(true);
  });

  it('no lo ve un participante ni el administrador que entró como asistente', () => {
    expect(veIndicadoresEvento({ roles: ['PARTICIPANTE'], permisos: ['EVENTOS_VER'] })).toBe(false);
    expect(veIndicadoresEvento({ roles: ['ADMIN'], modoIngreso: 'ASISTENTE' })).toBe(false);
    expect(veIndicadoresEvento(null)).toBe(false);
  });
});

describe('formatos', () => {
  it('formatea porcentajes, pesos y cantidades', () => {
    expect(formatearValor(75, '%')).toBe('75 %');
    expect(formatearValor(54.17, '%')).toBe('54,2 %');
    expect(formatearValor(1200000, 'COP')).toBe('$ 1.200.000');
    expect(formatearValor(1250, 'personas')).toBe('1.250');
    expect(formatearValor(null, '%')).toBe('—');
    expect(formatearValor(undefined)).toBe('—');
    expect(formatearValor(0, 'personas')).toBe('0');
  });

  it('acorta los valores de los ejes', () => {
    expect(formatearValorCorto(1500000, 'COP')).toBe('$ 1,5 M');
    expect(formatearValorCorto(250000, 'COP')).toBe('$ 250 mil');
    expect(formatearValorCorto(500, 'COP')).toBe('$ 500');
    expect(formatearValorCorto(50, '%')).toBe('50 %');
    expect(formatearValorCorto(2.5, 'personas')).toBe('2,5');
  });

  it('muestra las fechas sin depender de la zona horaria', () => {
    expect(etiquetaFecha('2026-11-01')).toBe('1 nov');
    expect(etiquetaFecha('2026-01-20', true)).toBe('20 ene 2026');
    expect(etiquetaFecha('otra')).toBe('otra');
    expect(etiquetaPunto({ clave: '2026-12-05', etiqueta: '2026-12-05' })).toBe('5 dic');
    expect(etiquetaPunto({ clave: '7', etiqueta: 'Taller IA' })).toBe('Taller IA');
  });

  it('formatea la fecha del cálculo', () => {
    expect(formatearFechaCalculo('2026-11-26T08:05:00')).toBe('26/11/2026 08:05');
    expect(formatearFechaCalculo(null)).toBe('—');
    expect(formatearFechaCalculo('x')).toBe('x');
  });

  it('arma la ruta de la página', () => {
    expect(rutaIndicadores(7)).toBe('/eventos/7/indicadores');
  });
});

describe('indicadores', () => {
  const respuesta = {
    grupos: [
      { codigo: 'PARTICIPACION', nombre: 'Participación', hayDatos: true, mensaje: null },
      { codigo: 'ASISTENCIA', nombre: 'Asistencia', hayDatos: false, mensaje: 'No hay asistencia registrada.' },
      { codigo: 'PRESUPUESTO', nombre: 'Presupuesto', hayDatos: false, mensaje: 'Sin presupuesto.' },
    ],
    indicadores: [
      { codigo: 'INSCRITOS', grupo: 'PARTICIPACION', valor: 4 },
      { codigo: 'TASA_ASISTENCIA', grupo: 'ASISTENCIA', valor: null },
      { codigo: 'ASISTENTES', grupo: 'ASISTENCIA', valor: null },
      { codigo: 'NUEVO', grupo: 'OTRO', valor: 1 },
    ],
  };

  it('agrupa en el orden de los grupos, omite los vacíos y agrega los desconocidos al final', () => {
    const grupos = indicadoresPorGrupo(respuesta);
    expect(grupos.map((g) => g.codigo)).toEqual(['PARTICIPACION', 'ASISTENCIA', 'OTRO']);
    expect(grupos[1].indicadores.map((i) => i.codigo)).toEqual(['TASA_ASISTENCIA', 'ASISTENTES']);
    expect(grupos[1].mensaje).toBe('No hay asistencia registrada.');
    expect(grupos[2].nombre).toBe('Otros indicadores');
    expect(indicadoresPorGrupo(null)).toEqual([]);
  });

  it('elige las tarjetas en orden fijo', () => {
    expect(indicadoresTarjeta(respuesta.indicadores).map((i) => i.codigo)).toEqual(['INSCRITOS', 'ASISTENTES', 'TASA_ASISTENCIA']);
  });
});

describe('configuracionSerie', () => {
  const medidas = (...codigos) => codigos.map(([codigo, unidad]) => ({ codigo, nombre: codigo, unidad }));

  it('usa la configuración de las series conocidas', () => {
    expect(configuracionSerie({ codigo: 'ASISTENCIA_POR_ACTIVIDAD', grafico: 'barras_agrupadas',
      medidas: medidas(['inscritos', 'personas'], ['asistentes', 'personas'], ['tasaAsistencia', '%']) }))
      .toEqual({ forma: 'barras', graficadas: ['inscritos', 'asistentes'], detalle: ['tasaAsistencia'] });
    expect(configuracionSerie({ codigo: 'INSCRIPCIONES_POR_FECHA', grafico: 'linea',
      medidas: medidas(['inscripciones', 'personas'], ['acumulado', 'personas']) }).forma).toBe('linea');
    expect(configuracionSerie({ codigo: 'SATISFACCION_POR_ENCUESTA', medidas: medidas(['satisfaccion', '%'], ['respuestas', 'r']) }).maximo).toBe(100);
  });

  it('deduce las series nuevas sin mezclar unidades en un eje', () => {
    expect(configuracionSerie({ codigo: 'X', grafico: 'barras_agrupadas',
      medidas: medidas(['a', 'COP'], ['b', 'COP'], ['c', '%']) }))
      .toEqual({ forma: 'barras', graficadas: ['a', 'b'], detalle: ['c'] });
    expect(configuracionSerie({ codigo: 'Y', grafico: 'circular', medidas: medidas(['n', 'u']) }).forma).toBe('segmentada');
    expect(configuracionSerie({ codigo: 'Z', grafico: 'linea', medidas: medidas(['n', 'u'], ['m', 'u']) }))
      .toEqual({ forma: 'linea', graficadas: ['n'], detalle: ['m'] });
    expect(configuracionSerie({ codigo: 'W', medidas: [] }).graficadas).toEqual([]);
  });
});

describe('escalaEje', () => {
  it('redondea el máximo y reparte cinco marcas desde cero', () => {
    expect(escalaEje([7, 3])).toEqual({ maximo: 8, marcas: [0, 2, 4, 6, 8] });
    expect(escalaEje([650000])).toEqual({ maximo: 800000, marcas: [0, 200000, 400000, 600000, 800000] });
    expect(escalaEje([1])).toEqual({ maximo: 4, marcas: [0, 1, 2, 3, 4] });
    expect(escalaEje([0, null])).toEqual({ maximo: 1, marcas: [0, 0.25, 0.5, 0.75, 1] });
    expect(escalaEje([30], 100).marcas).toEqual([0, 25, 50, 75, 100]);
    expect(escalaEje([90]).maximo).toBe(100);
    expect(escalaEje([186]).maximo).toBe(200);
    expect(escalaEje([5]).marcas).toEqual([0, 2, 4, 6, 8]);
    expect(escalaEje([0.3]).maximo).toBe(0.4);
  });
});

describe('series', () => {
  const serie = {
    medidas: [{ codigo: 'inscritos', nombre: 'Inscritos', unidad: 'personas' }, { codigo: 'tasa', nombre: 'Tasa', unidad: '%' }],
    puntos: [
      { clave: '1', etiqueta: 'Apertura', valores: { inscritos: 4, tasa: 75 } },
      { clave: '2', etiqueta: 'Cierre', valores: { inscritos: 1, tasa: null } },
    ],
  };

  it('suma una medida y calcula porcentajes sin dividir por cero', () => {
    expect(totalMedida(serie.puntos, 'inscritos')).toBe(5);
    expect(totalMedida(serie.puntos, 'tasa')).toBe(75);
    expect(porcentajeDe(1, 3)).toBe(33.3);
    expect(porcentajeDe(1, 0)).toBe(0);
  });

  it('arma la vista en tabla con los valores formateados', () => {
    const tabla = tablaSerie(serie);
    expect(tabla.columnas.map((c) => c.nombre)).toEqual(['Inscritos', 'Tasa']);
    expect(tabla.filas[0]).toEqual({ clave: '1', etiqueta: 'Apertura', celdas: ['4', '75 %'] });
    expect(tabla.filas[1].celdas[1]).toBe('—');
  });
});

describe('interpretarErrorIndicadores', () => {
  it('traduce permisos, evento inexistente, red y servidor', () => {
    expect(interpretarErrorIndicadores({ response: { status: 403, data: {} } })).toMatchObject({ titulo: 'Acceso denegado' });
    expect(interpretarErrorIndicadores({ response: { status: 404, data: { message: 'No se encontró el evento con ID: 9' } } }).mensaje)
      .toBe('No se encontró el evento con ID: 9');
    expect(interpretarErrorIndicadores({ request: {} }).mensaje).toMatch(/conectarse con el servidor/);
    expect(interpretarErrorIndicadores({ response: { status: 503, data: {} } }).mensaje).toMatch(/servidor tuvo un problema/);
    expect(interpretarErrorIndicadores({ response: { status: 401 } }).mensaje).toMatch(/sesión expiró/);
  });
});

describe('colorCategoria', () => {
  it('el color sigue a la categoría aunque cambie su posición', () => {
    expect(colorCategoria('INSCRIPCIONES_POR_CATEGORIA', 'docente', 0)).toBe(COLORES_SERIE[2]);
    expect(colorCategoria('INSCRIPCIONES_POR_CATEGORIA', 'docente', 3)).toBe(COLORES_SERIE[2]);
    expect(colorCategoria('PROPUESTAS_POR_ESTADO', 'rechazada', 0)).toBe(COLORES_SERIE[4]);
  });

  it('las categorías desconocidas toman los colores siguientes', () => {
    expect(colorCategoria('INSCRIPCIONES_POR_CATEGORIA', 'otra', 0)).toBe(COLORES_SERIE[5]);
    expect(colorCategoria('NUEVA', 'x', 1)).toBe(COLORES_SERIE[1]);
  });
});

describe('seriesAnchoCompleto', () => {
  const s = (codigo, hayDatos = true) => ({ codigo, hayDatos });

  it('las anchas con datos ocupan la fila y la de media columna que quedaría sola también', () => {
    const anchas = seriesAnchoCompleto([
      s('INSCRIPCIONES_POR_CATEGORIA'), s('INSCRIPCIONES_POR_FECHA'), s('ASISTENCIA_POR_ACTIVIDAD'),
      s('ASISTENCIA_POR_DIA'), s('PROPUESTAS_POR_ESTADO'), s('SATISFACCION_POR_ENCUESTA'), s('PRESUPUESTO_POR_RUBRO'),
    ]);
    expect([...anchas].sort()).toEqual(['ASISTENCIA_POR_ACTIVIDAD', 'PRESUPUESTO_POR_RUBRO', 'SATISFACCION_POR_ENCUESTA']);
  });

  it('sin datos ninguna es ancha salvo la última si queda sola', () => {
    const anchas = seriesAnchoCompleto([s('A', false), s('ASISTENCIA_POR_ACTIVIDAD', false), s('C', false)]);
    expect([...anchas]).toEqual(['C']);
    expect([...seriesAnchoCompleto([s('A'), s('B')])]).toEqual([]);
    expect([...seriesAnchoCompleto(null)]).toEqual([]);
  });
});
