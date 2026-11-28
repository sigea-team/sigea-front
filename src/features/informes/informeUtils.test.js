import { describe, expect, it } from 'vitest';
import tiposInforme from './mocks/tiposInforme.json';
import informesEvento from './mocks/informesEvento.json';
import { crearInformesApiMock, informeSimulado } from './mocks/informesMock';
import {
  FILTROS_INICIALES,
  buscarTipo,
  cambiarTipo,
  columnasElegidas,
  construirParametros,
  esNumerico,
  etiquetaEvento,
  etiquetaRegistros,
  formatearNumero,
  formatearValor,
  interpretarErrorInforme,
  mismosParametros,
  nombreArchivoDeCabecera,
  nombreRespaldo,
  normalizarInforme,
  normalizarTipos,
  ordenarEventos,
  paginar,
  rutaInformes,
  validarFiltros,
  veInformes,
} from './informeUtils';

const tipos = normalizarTipos(tiposInforme);
const actividades = buscarTipo(tipos, 'ACTIVIDADES');
const gastos = buscarTipo(tipos, 'GASTOS');

describe('veInformes', () => {
  it('lo ve el administrador o quien tiene REPORTES_VER o EVENTOS_EDITAR', () => {
    expect(veInformes({ roles: ['ADMIN'] })).toBe(true);
    expect(veInformes({ roles: ['ORGANIZADOR'], permisos: ['REPORTES_VER'] })).toBe(true);
    expect(veInformes({ roles: ['ORGANIZADOR'], permisos: ['eventos_editar'] })).toBe(true);
    expect(veInformes({ roles: ['ASISTENTE'], permisos: ['EVENTOS_VER'] })).toBe(false);
    expect(veInformes(null)).toBe(false);
  });

  it('el administrador que entró como asistente no lo ve por su rol', () => {
    expect(veInformes({ roles: ['ADMIN'], modoIngreso: 'ASISTENTE' })).toBe(false);
  });
});

describe('catálogo', () => {
  it('tiene los 10 tipos del backend y solo asistencia y actividades admiten tipo de actividad', () => {
    expect(tipos).toHaveLength(10);
    expect(tipos.filter((t) => t.admiteTipoActividad).map((t) => t.codigo)).toEqual(['ASISTENCIA', 'ACTIVIDADES']);
    expect(tipos.every((t) => t.columnas.length > 0)).toBe(true);
  });

  it('normaliza respuestas incompletas', () => {
    expect(normalizarTipos(null)).toEqual([]);
    expect(normalizarTipos([{ codigo: 'X' }])[0]).toEqual({ codigo: 'X', admiteTipoActividad: false, columnas: [] });
    const informe = normalizarInforme({ filas: [{ a: 1 }] });
    expect(informe).toMatchObject({ hayDatos: false, filtros: [], columnas: [], totalFilas: 1, totales: {} });
  });
});

describe('cambiarTipo y columnas', () => {
  it('al cambiar de tipo vuelven todas las columnas y se borra el tipo de actividad si no aplica', () => {
    const filtros = { ...FILTROS_INICIALES, tipo: 'ACTIVIDADES', tipoActividad: 'Taller', columnas: ['actividad'], eventoId: '7' };
    expect(cambiarTipo(filtros, gastos)).toMatchObject({ tipo: 'GASTOS', tipoActividad: '', columnas: null, eventoId: '7' });
    expect(cambiarTipo(filtros, buscarTipo(tipos, 'ASISTENCIA'))).toMatchObject({ tipoActividad: 'Taller' });
  });

  it('columnasElegidas respeta el orden del catálogo', () => {
    const filtros = { ...FILTROS_INICIALES, tipo: 'GASTOS', columnas: ['valor', 'rubro'] };
    expect(columnasElegidas(filtros, gastos)).toEqual(['rubro', 'valor']);
    expect(columnasElegidas({ ...filtros, columnas: null }, gastos)).toHaveLength(gastos.columnas.length);
  });
});

describe('validarFiltros', () => {
  it('exige el tipo, un rango en orden y al menos una columna', () => {
    expect(validarFiltros(FILTROS_INICIALES, null)).toHaveProperty('tipo');
    const rango = { ...FILTROS_INICIALES, tipo: 'GASTOS', fechaDesde: '2026-12-01', fechaHasta: '2026-11-01' };
    expect(validarFiltros(rango, gastos)).toEqual({ fechas: 'La fecha inicial no puede ser posterior a la fecha final.' });
    expect(validarFiltros({ ...FILTROS_INICIALES, tipo: 'GASTOS', columnas: [] }, gastos)).toHaveProperty('columnas');
    expect(validarFiltros({ ...FILTROS_INICIALES, tipo: 'GASTOS', fechaDesde: '2026-11-10', fechaHasta: '2026-11-10' }, gastos)).toEqual({});
  });
});

describe('construirParametros', () => {
  it('solo envía los filtros con valor, con los tipos que espera el backend', () => {
    expect(construirParametros({ ...FILTROS_INICIALES, tipo: 'GASTOS' }, gastos)).toEqual({ tipo: 'GASTOS' });
    const filtros = {
      ...FILTROS_INICIALES,
      tipo: 'ACTIVIDADES',
      eventoId: '7',
      semestre: '2026-2',
      tipoEventoId: '2',
      fechaDesde: '2026-11-01',
      fechaHasta: '2026-11-30',
      tipoActividad: '  Taller   de  IA ',
      columnas: ['tasaAsistencia', 'actividad'],
    };
    expect(construirParametros(filtros, actividades)).toEqual({
      tipo: 'ACTIVIDADES',
      eventoId: 7,
      semestre: '2026-2',
      tipoEventoId: 2,
      fechaDesde: '2026-11-01',
      fechaHasta: '2026-11-30',
      tipoActividad: 'Taller de IA',
      columnas: ['actividad', 'tasaAsistencia'],
    });
  });

  it('no envía el tipo de actividad a un tipo que no lo admite ni las columnas si son todas', () => {
    const filtros = { ...FILTROS_INICIALES, tipo: 'GASTOS', tipoActividad: 'Taller', columnas: gastos.columnas.map((c) => c.clave) };
    expect(construirParametros(filtros, gastos)).toEqual({ tipo: 'GASTOS' });
  });

  it('mismosParametros no depende del orden de las claves', () => {
    expect(mismosParametros({ tipo: 'GASTOS', eventoId: 7 }, { eventoId: 7, tipo: 'GASTOS' })).toBe(true);
    expect(mismosParametros({ tipo: 'GASTOS', eventoId: 7 }, { tipo: 'GASTOS' })).toBe(false);
    expect(mismosParametros(null, { tipo: 'GASTOS' })).toBe(false);
  });
});

describe('formatearValor (mismo formato del PDF)', () => {
  it('números, pesos y porcentajes en formato colombiano', () => {
    expect(formatearNumero(1234567)).toBe('1.234.567');
    expect(formatearNumero(-0.004)).toBe('0');
    expect(formatearValor(1234567, 'ENTERO')).toBe('1.234.567');
    expect(formatearValor(8.5, 'DECIMAL')).toBe('8,5');
    expect(formatearValor(8.5, 'MONEDA')).toBe('$ 8,50');
    expect(formatearValor(850050, 'MONEDA')).toBe('$ 850.050');
    expect(formatearValor(350000.25, 'MONEDA')).toBe('$ 350.000,25');
    expect(formatearValor(-1000, 'MONEDA')).toBe('-$ 1.000');
    expect(formatearValor(87.5, 'PORCENTAJE')).toBe('87,50 %');
    expect(formatearValor(0, 'ENTERO')).toBe('0');
  });

  it('fechas y horas sin depender de la zona horaria del navegador', () => {
    expect(formatearValor('2026-11-10', 'FECHA')).toBe('10/11/2026');
    expect(formatearValor('08:05:00', 'HORA')).toBe('08:05');
    expect(formatearValor('2026-11-10T08:05:00', 'FECHA_HORA')).toBe('10/11/2026 08:05');
    expect(formatearValor('2026-11-10T00:00:00', 'FECHA_HORA')).toBe('10/11/2026 00:00');
  });

  it('el texto llega completo y los vacíos quedan en blanco', () => {
    const largo = 'x'.repeat(5000);
    expect(formatearValor(largo, 'TEXTO')).toBe(largo);
    expect(formatearValor(null, 'MONEDA')).toBe('');
    expect(formatearValor(undefined, 'FECHA')).toBe('');
  });

  it('esNumerico decide la alineación', () => {
    expect(['ENTERO', 'DECIMAL', 'MONEDA', 'PORCENTAJE'].every(esNumerico)).toBe(true);
    expect(esNumerico('FECHA')).toBe(false);
  });
});

describe('paginar y etiquetas', () => {
  it('pagina de 50 en 50 y ajusta páginas fuera de rango', () => {
    const filas = Array.from({ length: 120 }, (_, i) => ({ n: i }));
    expect(paginar(filas, 1)).toMatchObject({ pagina: 1, paginas: 3, desde: 1, hasta: 50 });
    expect(paginar(filas, 3)).toMatchObject({ pagina: 3, desde: 101, hasta: 120 });
    expect(paginar(filas, 9).pagina).toBe(3);
    expect(paginar([], 1)).toMatchObject({ pagina: 1, paginas: 1, desde: 0, hasta: 0 });
  });

  it('etiquetas legibles', () => {
    expect(etiquetaRegistros(1)).toBe('1 registro');
    expect(etiquetaRegistros(20000)).toBe('20.000 registros');
    expect(etiquetaEvento({ id: 7, nombre: 'Congreso', semestre: '2026-2' })).toBe('Congreso (2026-2)');
    expect(ordenarEventos([{ nombre: 'A', fechaInicio: '2026-04-01' }, { nombre: 'B', fechaInicio: '2026-11-10' }])[0].nombre).toBe('B');
    expect(rutaInformes({ tipo: 'INDICADORES', eventoId: 7 })).toBe('/informes?tipo=INDICADORES&eventoId=7');
    expect(rutaInformes()).toBe('/informes');
  });
});

describe('nombre del archivo', () => {
  it('lee Content-Disposition con filename o filename*', () => {
    expect(nombreArchivoDeCabecera('attachment; filename="informe-gastos-20261128-1114.pdf"', 'x')).toBe('informe-gastos-20261128-1114.pdf');
    expect(nombreArchivoDeCabecera("attachment; filename*=UTF-8''informe-a%C3%B1o.xlsx", 'x')).toBe('informe-año.xlsx');
    expect(nombreArchivoDeCabecera(undefined, nombreRespaldo('GASTOS', 'excel'))).toBe('informe-gastos.xlsx');
  });
});

describe('interpretarErrorInforme', () => {
  const error = (status, data) => ({ response: { status, data } });

  it('Criterio 4: falla técnica o sin conexión → reintentable', () => {
    const fallo = interpretarErrorInforme(
      error(500, { codigo: 'EXPORTACION_INFORME_FALLIDA', message: 'No se pudo generar el archivo PDF del informe por un problema técnico. Intente exportarlo de nuevo.' }),
      { exportando: true, formato: 'pdf' }
    );
    expect(fallo).toMatchObject({ titulo: 'No se pudo exportar a PDF', reintentable: true, codigo: 'EXPORTACION_INFORME_FALLIDA' });
    expect(fallo.mensaje).toContain('Intente exportarlo de nuevo');
    expect(interpretarErrorInforme({ request: {}, message: 'Network Error' }).reintentable).toBe(true);
    expect(interpretarErrorInforme(error(503, {})).reintentable).toBe(true);
  });

  it('Criterio 2 y validaciones: no se reintenta y se muestra el mensaje del backend', () => {
    expect(interpretarErrorInforme(error(409, { codigo: 'INFORME_SIN_DATOS', message: 'No hay gastos.' }), { exportando: true, formato: 'excel' }))
      .toMatchObject({ titulo: 'No hay datos para exportar', mensaje: 'No hay gastos.', reintentable: false });
    expect(interpretarErrorInforme(error(422, { codigo: 'INFORME_DEMASIADO_GRANDE', message: 'Acote los filtros.' })))
      .toMatchObject({ titulo: 'El informe es demasiado grande', reintentable: false });
    expect(interpretarErrorInforme(error(400, { codigo: 'VALIDACION_FALLIDA', message: 'Datos inválidos', erroresValidacion: { tipo: 'Seleccione el tipo de información del informe.' } })).mensaje)
      .toBe('Seleccione el tipo de información del informe.');
    expect(interpretarErrorInforme(error(403, {})).titulo).toBe('Acceso denegado');
    expect(interpretarErrorInforme(error(404, { message: 'No se encontró el evento con ID: 99' })).mensaje).toBe('No se encontró el evento con ID: 99');
  });
});

describe('API simulada (forma del backend)', () => {
  it('los informes del mock salieron del backend y cada fila tiene un valor por columna', () => {
    Object.values(informesEvento).forEach((informe) => {
      expect(informe.hayDatos).toBe(true);
      informe.filas.forEach((fila) => expect(Object.keys(fila)).toEqual(informe.columnas.map((c) => c.clave)));
    });
  });

  it('aplica columnas, rango y evento sin datos', () => {
    const informe = informeSimulado({ tipo: 'GASTOS', eventoId: 7, columnas: ['rubro', 'valor'], fechaDesde: '2026-11-10', fechaHasta: '2026-11-10' });
    expect(informe.columnas.map((c) => c.clave)).toEqual(['rubro', 'valor']);
    expect(informe.totalFilas).toBe(1);
    expect(informe.totales).toEqual({ valor: 400000 });
    expect(informeSimulado({ tipo: 'GASTOS', eventoId: 8 })).toMatchObject({ hayDatos: false, totalFilas: 0 });
  });

  it('la exportación falla las veces pedidas y luego descarga (Criterio 4)', async () => {
    const api = crearInformesApiMock({ ms: 0, fallosExportacion: 1 });
    await expect(api.exportarInforme({ tipo: 'GASTOS', eventoId: 7 }, 'pdf')).rejects.toMatchObject({
      response: { status: 500, data: { codigo: 'EXPORTACION_INFORME_FALLIDA' } },
    });
    const { nombre } = await api.exportarInforme({ tipo: 'GASTOS', eventoId: 7 }, 'pdf');
    expect(nombre).toMatch(/\.pdf$/);
  });
});
