/**
 * @file indicadoresMock.js
 * @description API simulada de los indicadores de un evento (HU-29) para Storybook y las pruebas en navegador.
 * Responde con la misma forma que `GET /api/v1/eventos/{id}/indicadores`, incluidos los errores 403 y 404.
 * Eventos: 7 completo, 8 sin datos, 9 con datos parciales, 10 archivado (memoria histórica), 99 inexistente.
 * Con `crece: true`, cada llamada al evento 7 suma inscripciones y asistencias (para probar «Actualizar», Criterio 3).
 * @module features/indicadores/mocks/indicadoresMock
 */

const espera = (valor, ms = 150) => new Promise((resolver) => setTimeout(() => resolver(valor), ms));

const errorApi = (status, message) => {
  const err = new Error(message);
  err.response = { status, data: { status, message } };
  return Promise.reject(err);
};

const GRUPOS = [
  ['PARTICIPACION', 'Participación', 'El evento no tiene inscripciones ni conferencistas registrados.'],
  ['ASISTENCIA', 'Asistencia', 'No hay asistencia registrada en las actividades del evento.'],
  ['ACTIVIDADES', 'Actividades', 'El evento no tiene actividades programadas.'],
  ['PROPUESTAS', 'Propuestas', 'El evento no tiene propuestas recibidas en sus convocatorias.'],
  ['SATISFACCION', 'Satisfacción', 'No hay respuestas a encuestas de satisfacción del evento.'],
  ['PRESUPUESTO', 'Presupuesto', 'El evento no tiene presupuesto aprobado ni gastos registrados.'],
];

const DEFINICION = [
  ['INSCRITOS', 'Participantes inscritos', 'PARTICIPACION', 'personas'],
  ['ASISTENTES', 'Participantes con asistencia registrada', 'ASISTENCIA', 'personas'],
  ['TASA_ASISTENCIA', 'Tasa de asistencia de los inscritos', 'ASISTENCIA', '%'],
  ['ASISTENCIAS_REGISTRADAS', 'Registros de asistencia a actividades', 'ASISTENCIA', 'registros'],
  ['ACTIVIDADES_REALIZADAS', 'Actividades programadas (no canceladas)', 'ACTIVIDADES', 'actividades'],
  ['ACTIVIDADES_CANCELADAS', 'Actividades canceladas', 'ACTIVIDADES', 'actividades'],
  ['PROPUESTAS_RECIBIDAS', 'Propuestas recibidas', 'PROPUESTAS', 'propuestas'],
  ['PROPUESTAS_APROBADAS', 'Propuestas aprobadas (incluye con ajustes)', 'PROPUESTAS', 'propuestas'],
  ['PROPUESTAS_RECHAZADAS', 'Propuestas rechazadas', 'PROPUESTAS', 'propuestas'],
  ['TASA_APROBACION', 'Tasa de aprobación de propuestas', 'PROPUESTAS', '%'],
  ['CONFERENCISTAS', 'Conferencistas y ponentes', 'PARTICIPACION', 'personas'],
  ['RESPUESTAS_ENCUESTAS', 'Respuestas a encuestas de satisfacción', 'SATISFACCION', 'respuestas'],
  ['SATISFACCION_PROMEDIO', 'Satisfacción promedio (preguntas de escala)', 'SATISFACCION', '%'],
  ['PRESUPUESTO_APROBADO', 'Presupuesto aprobado', 'PRESUPUESTO', 'COP'],
  ['PRESUPUESTO_EJECUTADO', 'Presupuesto ejecutado', 'PRESUPUESTO', 'COP'],
  ['EJECUCION_PRESUPUESTAL', 'Porcentaje de ejecución presupuestal', 'PRESUPUESTO', '%'],
];

const MOTIVOS = {
  TASA_ASISTENCIA: 'No hay inscripciones registradas para calcular la tasa de asistencia.',
  TASA_APROBACION: 'No hay propuestas recibidas para calcular la tasa de aprobación.',
  SATISFACCION_PROMEDIO: 'Las respuestas recibidas no incluyen preguntas de escala; no se puede calcular la satisfacción promedio.',
  PRESUPUESTO_APROBADO: 'El evento no tiene presupuesto aprobado.',
  EJECUCION_PRESUPUESTAL: 'Sin presupuesto aprobado (o aprobado en cero) no se puede calcular el porcentaje de ejecución.',
};

const redondear = (n) => Math.round(n * 100) / 100;
const tasa = (parte, total) => (total > 0 ? redondear((100 * parte) / total) : null);

/** Aplica las reglas de disponibilidad del backend (ReglasIndicadoresEvento) a los valores calculados. */
function armarIndicadores(valores) {
  const conDatos = {};
  DEFINICION.forEach(([codigo, , grupo]) => {
    conDatos[grupo] = conDatos[grupo] || (valores[codigo] !== null && valores[codigo] > 0);
  });
  const grupos = GRUPOS.map(([codigo, nombre, mensaje]) => ({
    codigo,
    nombre,
    hayDatos: Boolean(conDatos[codigo]),
    mensaje: conDatos[codigo] ? null : mensaje,
  }));
  const indicadores = DEFINICION.map(([codigo, nombre, grupo, unidad]) => {
    const valor = valores[codigo];
    if (!conDatos[grupo]) {
      return { codigo, nombre, grupo, valor: null, unidad, disponible: false, motivo: GRUPOS.find((g) => g[0] === grupo)[2] };
    }
    if (valor === null || valor === undefined) {
      return { codigo, nombre, grupo, valor: null, unidad, disponible: false, motivo: MOTIVOS[codigo] || 'No hay datos suficientes para calcular este indicador.' };
    }
    return { codigo, nombre, grupo, valor, unidad, disponible: true, motivo: null };
  });
  return { grupos, indicadores, hayDatos: Object.values(conDatos).some(Boolean) };
}

const serie = (codigo, titulo, grafico, medidas, puntos, mensaje) => ({
  codigo,
  titulo,
  grafico,
  hayDatos: puntos.length > 0,
  mensaje: puntos.length > 0 ? null : mensaje,
  medidas: medidas.map(([c, nombre, unidad]) => ({ codigo: c, nombre, unidad })),
  puntos,
});

const SIN_INSCRIPCIONES = 'El evento no tiene inscripciones registradas.';
const SIN_ACTIVIDADES = 'El evento no tiene actividades programadas.';

/** Series vacías, con los mensajes del backend. */
function seriesVacias() {
  return [
    serie('INSCRIPCIONES_POR_CATEGORIA', 'Inscritos por categoría de participante', 'circular', [['inscritos', 'Inscritos', 'personas']], [], SIN_INSCRIPCIONES),
    serie('INSCRIPCIONES_POR_FECHA', 'Evolución de las inscripciones', 'linea', [['inscripciones', 'Inscripciones del día', 'personas'], ['acumulado', 'Total acumulado', 'personas']], [], SIN_INSCRIPCIONES),
    serie('ASISTENCIA_POR_ACTIVIDAD', 'Inscritos y asistentes por actividad', 'barras_agrupadas', [['inscritos', 'Inscritos', 'personas'], ['asistentes', 'Asistentes', 'personas'], ['tasaAsistencia', 'Tasa de asistencia', '%']], [], SIN_ACTIVIDADES),
    serie('ASISTENCIA_POR_DIA', 'Inscripciones a actividades y asistencias por día', 'barras_agrupadas', [['inscritos', 'Inscripciones a actividades', 'inscripciones'], ['asistentes', 'Asistencias registradas', 'registros'], ['tasaAsistencia', 'Tasa de asistencia', '%']], [], SIN_ACTIVIDADES),
    serie('PROPUESTAS_POR_ESTADO', 'Propuestas por estado', 'circular', [['propuestas', 'Propuestas', 'propuestas']], [], 'El evento no tiene propuestas recibidas en sus convocatorias.'),
    serie('SATISFACCION_POR_ENCUESTA', 'Satisfacción por encuesta', 'barras', [['satisfaccion', 'Satisfacción promedio', '%'], ['respuestas', 'Respuestas', 'respuestas']], [], 'El evento no tiene encuestas de satisfacción publicadas.'),
    serie('PRESUPUESTO_POR_RUBRO', 'Presupuesto proyectado y ejecutado por rubro', 'barras_agrupadas', [['proyectado', 'Proyectado', 'COP'], ['ejecutado', 'Ejecutado', 'COP']], [], 'El evento no tiene rubros de presupuesto registrados.'),
  ];
}

const reemplazar = (series, codigo, puntos) =>
  series.map((s) => (s.codigo === codigo ? { ...s, hayDatos: puntos.length > 0, mensaje: puntos.length > 0 ? null : s.mensaje, puntos } : s));

const valoresAsistencia = (inscritos, asistentes) => ({ inscritos, asistentes, tasaAsistencia: tasa(asistentes, inscritos) });

/** Evento con información en todos los grupos. `extra` suma inscripciones y asistencias (refresco). */
function eventoCompleto(extra = 0) {
  const categorias = [['estudiante', 'Estudiante', 112 + extra], ['egresado', 'Egresado', 31], ['docente', 'Docente', 27], ['particular', 'Particular', 16]];
  const inscritos = categorias.reduce((s, c) => s + c[2], 0);
  const actividades = [
    [101, 'Conferencia inaugural: IA en la ingeniería', '2026-11-18', 150 + extra, 131 + extra],
    [102, 'Taller de desarrollo web con React', '2026-11-18', 40, 36],
    [103, 'Panel: retos de la transformación digital', '2026-11-19', 120, 88],
    [104, 'Ponencias del semillero de investigación', '2026-11-19', 64, 41],
    [105, 'Taller de ciberseguridad ofensiva', '2026-11-20', 35, 33],
    [106, 'Conferencia de cierre y premiación', '2026-11-20', 140, 97],
  ];
  const registros = actividades.reduce((s, a) => s + a[4], 0);
  const asistentes = 152 + extra;
  const fechas = [['2026-10-20', 24], ['2026-10-27', 41], ['2026-11-03', 38], ['2026-11-10', 52], ['2026-11-15', 31 + extra]];
  const encuestas = [
    [31, 'Satisfacción general del evento', null, 74, 84.25],
    [32, 'Taller de desarrollo web', 'Taller de desarrollo web con React', 23, 91.3],
    [33, 'Panel de transformación digital', 'Panel: retos de la transformación digital', 0, null],
  ];
  const rubros = [[1, 'Refrigerios y estación de café', 4200000, 3850000], [2, 'Viáticos de conferencistas', 3600000, 3600000], [3, 'Material impreso y certificados', 1200000, 640000], [4, 'Publicidad en redes', 800000, 310000]];
  const aprobado = 10000000;
  const ejecutado = rubros.reduce((s, r) => s + r[3], 0);

  const base = armarIndicadores({
    INSCRITOS: inscritos,
    ASISTENTES: asistentes,
    TASA_ASISTENCIA: tasa(asistentes, inscritos),
    ASISTENCIAS_REGISTRADAS: registros,
    ACTIVIDADES_REALIZADAS: actividades.length,
    ACTIVIDADES_CANCELADAS: 1,
    PROPUESTAS_RECIBIDAS: 42,
    PROPUESTAS_APROBADAS: 27,
    PROPUESTAS_RECHAZADAS: 11,
    TASA_APROBACION: tasa(27, 42),
    CONFERENCISTAS: 9,
    RESPUESTAS_ENCUESTAS: 97,
    SATISFACCION_PROMEDIO: 85.96,
    PRESUPUESTO_APROBADO: aprobado,
    PRESUPUESTO_EJECUTADO: ejecutado,
    EJECUCION_PRESUPUESTAL: tasa(ejecutado, aprobado),
  });

  let acumulado = 0;
  const porDia = new Map();
  actividades.forEach(([, , fecha, ins, asi]) => {
    const d = porDia.get(fecha) || [0, 0];
    porDia.set(fecha, [d[0] + ins, d[1] + asi]);
  });

  let series = seriesVacias();
  series = reemplazar(series, 'INSCRIPCIONES_POR_CATEGORIA',
    [...categorias].sort((a, b) => b[2] - a[2]).map(([clave, etiqueta, n]) => ({ clave, etiqueta, valores: { inscritos: n } })));
  series = reemplazar(series, 'INSCRIPCIONES_POR_FECHA', fechas.map(([dia, n]) => {
    acumulado += n;
    return { clave: dia, etiqueta: dia, valores: { inscripciones: n, acumulado } };
  }));
  series = reemplazar(series, 'ASISTENCIA_POR_ACTIVIDAD',
    actividades.map(([id, nombre, , ins, asi]) => ({ clave: String(id), etiqueta: nombre, valores: valoresAsistencia(ins, asi) })));
  series = reemplazar(series, 'ASISTENCIA_POR_DIA',
    [...porDia].map(([dia, [ins, asi]]) => ({ clave: dia, etiqueta: dia, valores: valoresAsistencia(ins, asi) })));
  series = reemplazar(series, 'PROPUESTAS_POR_ESTADO', [
    ['en_evaluacion', 'En evaluación', 4], ['ajustes', 'Aprobadas con ajustes', 9], ['aprobada', 'Aprobadas', 18], ['rechazada', 'Rechazadas', 11],
  ].map(([clave, etiqueta, n]) => ({ clave, etiqueta, valores: { propuestas: n } })));
  series = reemplazar(series, 'SATISFACCION_POR_ENCUESTA', encuestas.map(([id, titulo, actividad, respuestas, sat]) => ({
    clave: String(id),
    etiqueta: actividad ? `${titulo} — ${actividad}` : titulo,
    valores: { satisfaccion: respuestas > 0 ? sat : null, respuestas },
  })));
  series = reemplazar(series, 'PRESUPUESTO_POR_RUBRO',
    rubros.map(([id, nombre, p, e]) => ({ clave: String(id), etiqueta: nombre, valores: { proyectado: p, ejecutado: e } })));
  return { ...base, series };
}

/** Evento con inscritos pero sin asistencia, propuestas ni presupuesto aprobado; encuesta solo de texto. */
function eventoParcial() {
  const base = armarIndicadores({
    INSCRITOS: 38, ASISTENTES: 0, TASA_ASISTENCIA: 0, ASISTENCIAS_REGISTRADAS: 0,
    ACTIVIDADES_REALIZADAS: 3, ACTIVIDADES_CANCELADAS: 0,
    PROPUESTAS_RECIBIDAS: 0, PROPUESTAS_APROBADAS: 0, PROPUESTAS_RECHAZADAS: 0, TASA_APROBACION: null,
    CONFERENCISTAS: 2, RESPUESTAS_ENCUESTAS: 5, SATISFACCION_PROMEDIO: null,
    PRESUPUESTO_APROBADO: null, PRESUPUESTO_EJECUTADO: 0, EJECUCION_PRESUPUESTAL: null,
  });
  let series = seriesVacias();
  series = reemplazar(series, 'INSCRIPCIONES_POR_CATEGORIA',
    [['estudiante', 'Estudiante', 30], ['docente', 'Docente', 8]].map(([clave, etiqueta, n]) => ({ clave, etiqueta, valores: { inscritos: n } })));
  series = reemplazar(series, 'INSCRIPCIONES_POR_FECHA',
    [['2026-11-20', 12, 12], ['2026-11-24', 26, 38]].map(([d, n, a]) => ({ clave: d, etiqueta: d, valores: { inscripciones: n, acumulado: a } })));
  series = series.map((s) => (s.codigo.startsWith('ASISTENCIA_') ? { ...s, mensaje: 'Las actividades del evento no tienen inscritos ni asistencia registrada.' } : s));
  series = reemplazar(series, 'SATISFACCION_POR_ENCUESTA', [{ clave: '41', etiqueta: 'Comentarios del seminario', valores: { satisfaccion: null, respuestas: 5 } }]);
  series = reemplazar(series, 'PRESUPUESTO_POR_RUBRO', [{ clave: '9', etiqueta: 'Publicidad', valores: { proyectado: 200000, ejecutado: 0 } }]);
  return { ...base, series };
}

function eventoVacio() {
  const base = armarIndicadores(Object.fromEntries(DEFINICION.map(([c, , , u]) => [c, u === '%' || c === 'PRESUPUESTO_APROBADO' ? null : 0])));
  return { ...base, series: seriesVacias() };
}

const EVENTOS = {
  7: { nombreEvento: 'Semana de Ingeniería de Sistemas 2026', estadoEvento: 'en_ejecucion', archivado: false, datos: eventoCompleto },
  8: { nombreEvento: 'Encuentro de Semilleros 2027', estadoEvento: 'en_configuracion', archivado: false, datos: eventoVacio },
  9: { nombreEvento: 'Seminario de Arquitectura de Software', estadoEvento: 'habilitado', archivado: false, datos: eventoParcial },
  10: { nombreEvento: 'Congreso de Ingeniería 2025', estadoEvento: 'cerrado', archivado: true, datos: eventoCompleto },
};

export const MENSAJE_SIN_DATOS = 'El evento todavía no tiene inscripciones, asistencia, actividades, propuestas, encuestas ni presupuesto registrados. Los indicadores se mostrarán a medida que se registre información.';
export const MENSAJE_ARCHIVADO = 'El evento fue cerrado formalmente y está en la memoria histórica: su información ya no cambia y estos indicadores son definitivos.';

/**
 * Crea la API simulada.
 * @param {{ crece?: boolean, prohibido?: boolean, falla?: boolean, ms?: number }} [opciones]
 * - `crece`: cada llamada al evento 7 suma 3 inscripciones y asistencias (Criterio 3).
 * - `prohibido`: responde 403. `falla`: simula que el servidor no responde.
 */
export function crearIndicadoresApiMock({ crece = false, prohibido = false, falla = false, ms = 150 } = {}) {
  let llamadas = 0;
  return {
    llamadas: () => llamadas,
    generarIndicadores(eventoId) {
      llamadas += 1;
      if (prohibido) return errorApi(403, 'Acceso denegado');
      if (falla) {
        const err = new Error('Network Error');
        err.request = {};
        return Promise.reject(err);
      }
      const evento = EVENTOS[Number(eventoId)];
      if (!evento) return errorApi(404, `No se encontró el evento con ID: ${eventoId}`);
      const extra = crece && Number(eventoId) === 7 ? (llamadas - 1) * 3 : 0;
      const datos = evento.datos(extra);
      const ahora = new Date(2026, 10, 26, 8, 0 + llamadas);
      const dos = (n) => String(n).padStart(2, '0');
      const fechaCalculo = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}T${dos(ahora.getHours())}:${dos(ahora.getMinutes())}:00`;
      let mensaje = null;
      if (!datos.hayDatos) mensaje = MENSAJE_SIN_DATOS;
      else if (evento.archivado) mensaje = MENSAJE_ARCHIVADO;
      return espera({
        eventoId: Number(eventoId),
        nombreEvento: evento.nombreEvento,
        estadoEvento: evento.estadoEvento,
        archivado: evento.archivado,
        fechaCalculo,
        mensaje,
        ...datos,
      }, ms);
    },
  };
}
