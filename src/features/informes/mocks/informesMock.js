import tiposInforme from './tiposInforme.json';
import informesEvento from './informesEvento.json';

/**
 * @file informesMock.js
 * @description API simulada de los informes (HU-30) para Storybook y las pruebas en navegador. El catálogo y los
 * informes del evento 7 salieron del backend real (servicio y consultas en PostgreSQL con datos de prueba), así que
 * tienen la misma forma que `GET /informes/tipos` y `POST /informes/generar`.
 * - Evento 7: con datos en todos los tipos. Evento 8: sin datos (Criterio 2). Evento 99: no existe (404).
 * - Aplica en el navegador el rango de fechas, el tipo de actividad y las columnas, de forma aproximada.
 * - `muchos: true` repite las filas hasta pasar de 100 (paginación de la vista previa).
 * - `fallosExportacion: n`: las primeras n exportaciones fallan con `EXPORTACION_INFORME_FALLIDA` (Criterio 4).
 * @module features/informes/mocks/informesMock
 */

const espera = (valor, ms) => new Promise((resolver) => setTimeout(() => resolver(valor), ms));

const errorApi = (status, data) => {
  const err = new Error(data?.message || `Error ${status}`);
  err.response = { status, data: { status, ...data } };
  return Promise.reject(err);
};

const sinConexion = () => {
  const err = new Error('Network Error');
  err.request = {};
  return Promise.reject(err);
};

/** Eventos de la lista del formulario. */
export const EVENTOS_MOCK = [
  { id: 7, nombre: 'Congreso de Ingeniería de Sistemas', semestre: '2026-2', fechaInicio: '2026-11-10' },
  { id: 8, nombre: 'Seminario sin registros', semestre: '2026-2', fechaInicio: '2026-12-01' },
  { id: 6, nombre: 'Seminario de IA', semestre: '2026-1', fechaInicio: '2026-04-01' },
];

/** Columna de la fecha de referencia de cada tipo (aproximación del filtro del backend). */
const COLUMNA_FECHA = {
  INSCRIPCIONES: 'fechaInscripcion',
  ASISTENCIA: 'fechaRegistro',
  ACTIVIDADES: 'fecha',
  PROPUESTAS: 'fechaEnvio',
  EVALUACIONES: 'fechaAsignacion',
  GASTOS: 'fechaGasto',
  ENCUESTAS: 'fechaPublicacion',
  CERTIFICADOS: 'fechaEmision',
};

function totales(columnas, filas) {
  const resultado = {};
  if (filas.length === 0) return resultado;
  columnas.filter((c) => c.sumable).forEach((c) => {
    const suma = filas.reduce((acc, f) => acc + (Number(f[c.clave]) || 0), 0);
    resultado[c.clave] = c.tipo === 'ENTERO' ? suma : Math.round(suma * 100) / 100;
  });
  return resultado;
}

function filtrosLegibles(base, parametros, tipo, evento) {
  const filtros = [
    { parametro: 'tipo', etiqueta: 'Tipo de información', valor: tipo.titulo },
    { parametro: 'eventoId', etiqueta: 'Evento', valor: evento ? `${evento.nombre} (${evento.semestre})` : 'Todos los eventos' },
  ];
  if (parametros.semestre) filtros.push({ parametro: 'semestre', etiqueta: 'Semestre', valor: parametros.semestre });
  const etiqueta = base.filtros.find((f) => f.parametro === 'fechas')?.etiqueta || 'Rango de fechas';
  const f = (v) => v.split('-').reverse().join('/');
  let valor = 'Todas las fechas';
  if (parametros.fechaDesde && parametros.fechaHasta) valor = `Del ${f(parametros.fechaDesde)} al ${f(parametros.fechaHasta)}`;
  else if (parametros.fechaDesde) valor = `Desde el ${f(parametros.fechaDesde)}`;
  else if (parametros.fechaHasta) valor = `Hasta el ${f(parametros.fechaHasta)}`;
  filtros.push({ parametro: 'fechas', etiqueta, valor });
  if (parametros.tipoActividad) filtros.push({ parametro: 'tipoActividad', etiqueta: 'Tipo de actividad', valor: parametros.tipoActividad });
  return filtros;
}

/**
 * Arma la respuesta simulada de `POST /informes/generar`.
 * @param {Object} parametros
 * @param {{ muchos?: boolean }} [opciones]
 */
export function informeSimulado(parametros, { muchos = false } = {}) {
  const base = informesEvento[parametros.tipo];
  const tipo = tiposInforme.find((t) => t.codigo === parametros.tipo);
  const evento = EVENTOS_MOCK.find((e) => e.id === Number(parametros.eventoId)) || null;

  let filas = base.filas.map((fila) => ({ ...fila }));
  // Los indicadores de un evento siempre traen sus 16 filas (en cero si no hay información), como en el backend.
  if (evento && evento.id !== 7 && parametros.tipo !== 'INDICADORES') filas = [];
  if (parametros.semestre && parametros.semestre !== '2026-2') filas = [];
  const columnaFecha = COLUMNA_FECHA[parametros.tipo];
  if (columnaFecha) {
    if (parametros.fechaDesde) filas = filas.filter((f) => f[columnaFecha] && String(f[columnaFecha]).slice(0, 10) >= parametros.fechaDesde);
    if (parametros.fechaHasta) filas = filas.filter((f) => f[columnaFecha] && String(f[columnaFecha]).slice(0, 10) <= parametros.fechaHasta);
  }
  if (parametros.tipoActividad) {
    const buscado = parametros.tipoActividad.trim().toLowerCase();
    filas = filas.filter((f) => String(f.tipoActividad || '').trim().toLowerCase() === buscado);
  }
  if (muchos && filas.length > 0) {
    const originales = filas;
    filas = [];
    for (let i = 0; filas.length < 130; i += 1) {
      originales.forEach((f) => filas.push({ ...f, ...(f.participante ? { participante: `${f.participante} ${i + 1}` } : {}) }));
    }
  }

  const columnas = Array.isArray(parametros.columnas) && parametros.columnas.length > 0
    ? base.columnas.filter((c) => parametros.columnas.includes(c.clave))
    : base.columnas;
  filas = filas.map((f) => Object.fromEntries(columnas.map((c) => [c.clave, f[c.clave] ?? null])));
  const hayDatos = filas.length > 0;
  return {
    ...base,
    hayDatos,
    mensaje: hayDatos ? null : mensajeSinDatos(tipo),
    filtros: filtrosLegibles(base, parametros, tipo, evento),
    columnas,
    totalFilas: filas.length,
    filas,
    totales: totales(columnas, filas),
  };
}

function mensajeSinDatos(tipo) {
  const sujeto = {
    INSCRIPCIONES: 'No hay inscripciones registradas',
    ASISTENCIA: 'No hay asistencias registradas',
    ACTIVIDADES: 'No hay actividades registradas',
    PROPUESTAS: 'No hay propuestas registradas',
    EVALUACIONES: 'No hay asignaciones de evaluación',
    PRESUPUESTO: 'No hay rubros presupuestales registrados',
    GASTOS: 'No hay gastos registrados',
    ENCUESTAS: 'No hay encuestas de satisfacción publicadas',
    CERTIFICADOS: 'No hay certificados emitidos',
    INDICADORES: 'No hay eventos',
  }[tipo?.codigo] || 'No hay datos';
  return `${sujeto} para los filtros seleccionados. Pruebe con otro evento, otro rango de fechas u otros filtros.`;
}

/**
 * API simulada con la misma interfaz que `informeService`.
 * @param {{ ms?: number, muchos?: boolean, fallosExportacion?: number, sinConexion?: boolean,
 *   prohibido?: boolean, catalogoFalla?: boolean, demasiadoGrande?: boolean }} [opciones]
 */
export function crearInformesApiMock({
  ms = 200,
  muchos = false,
  fallosExportacion = 0,
  sinConexion: desconectado = false,
  prohibido = false,
  catalogoFalla = false,
  demasiadoGrande = false,
} = {}) {
  let fallosPendientes = fallosExportacion;
  const exportaciones = [];
  return {
    exportaciones,
    listarTipos() {
      if (prohibido) return errorApi(403, { message: 'Acceso denegado' });
      if (catalogoFalla || desconectado) return sinConexion();
      return espera(tiposInforme.map((t) => ({ ...t })), ms);
    },
    generarInforme(parametros) {
      if (desconectado) return sinConexion();
      if (Number(parametros.eventoId) === 99) {
        return errorApi(404, { codigo: 'RECURSO_NO_ENCONTRADO', message: 'No se encontró el evento con ID: 99' });
      }
      if (demasiadoGrande) {
        return errorApi(422, {
          codigo: 'INFORME_DEMASIADO_GRANDE',
          message: 'El informe supera los 20.000 registros. Acote los filtros (evento, semestre o rango de fechas) para generarlo completo.',
        });
      }
      return espera(informeSimulado(parametros, { muchos }), ms);
    },
    exportarInforme(parametros, formato) {
      if (desconectado) return sinConexion();
      const informe = informeSimulado(parametros, { muchos });
      const formatoNombre = formato === 'excel' ? 'Excel' : 'PDF';
      if (!informe.hayDatos) {
        return errorApi(409, { codigo: 'INFORME_SIN_DATOS', message: `${informe.mensaje} No se generó el archivo.` });
      }
      if (fallosPendientes > 0) {
        fallosPendientes -= 1;
        return errorApi(500, {
          codigo: 'EXPORTACION_INFORME_FALLIDA',
          message: `No se pudo generar el archivo ${formatoNombre} del informe por un problema técnico. Intente exportarlo de nuevo.`,
        });
      }
      const extension = formato === 'excel' ? 'xlsx' : 'pdf';
      const nombre = `informe-${parametros.tipo.toLowerCase()}-${parametros.eventoId ? 'congreso-de-ingenieria-de-sistemas-2026-2' : 'todos-los-eventos'}-20261128-1114.${extension}`;
      const tipoMime = formato === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
      const archivo = new Blob([`Archivo simulado ${nombre}`], { type: tipoMime });
      exportaciones.push({ parametros, formato, nombre });
      return espera({ archivo, nombre }, ms * 2);
    },
  };
}

/** Listas del formulario (eventos, semestres y tipos de evento) para Storybook. */
export function crearCatalogosMock({ ms = 100 } = {}) {
  return {
    listarEventos: () => espera(EVENTOS_MOCK.map((e) => ({ ...e })), ms),
    listarSemestres: () => espera(['2026-2', '2026-1'], ms),
    listarTiposEvento: () => espera([{ id: 1, nombre: 'Congreso' }, { id: 2, nombre: 'Seminario' }], ms),
  };
}
