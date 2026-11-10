/**
 * @file clasificacionMock.js
 * @description Datos y API simulada de clasificación de propuestas (HU-18), solo para Storybook y pruebas.
 * Imita las respuestas y reglas del backend (ClasificacionPropuestaService) sin necesidad de servidor.
 * @module features/clasificacion/mocks/clasificacionMock
 */

import { clasificarPuntuacion, ETIQUETAS_CLASIFICACION, grupoDe, GRUPOS, UMBRALES_POR_DEFECTO } from '../clasificacionUtils';

/** Convocatoria publicada de ejemplo. */
export const CONVOCATORIA_CLASIFICACION_MOCK = {
  id: 10,
  titulo: 'Convocatoria de Ponencias 2026',
  eventoNombre: 'Congreso de Ingeniería de Sistemas',
  estado: 'PUBLICADA',
};

/** Estado de la propuesta que corresponde a cada clasificación aplicada. */
const ESTADO_POR_CLASIFICACION = { aprobada: 'aprobada', aprobada_con_ajustes: 'ajustes', rechazada: 'rechazada' };

/** Propuestas iniciales: una aplicada, una ajustada a mano, dos sin aplicar y dos incompletas. */
function propuestasIniciales() {
  return [
    { propuestaId: 40, titulo: 'Analítica de aprendizaje en cursos de programación', puntuacion: 8.6, pendientes: 0, aplicada: 'aprobada' },
    { propuestaId: 41, titulo: 'Gamificación en la enseñanza de bases de datos', puntuacion: 7.1, pendientes: 0, aplicada: 'aprobada_con_ajustes', manual: true },
    { propuestaId: 42, titulo: 'Microservicios para la gestión académica universitaria', puntuacion: 6.2, pendientes: 0 },
    { propuestaId: 43, titulo: 'Detección de plagio con modelos de lenguaje', puntuacion: 4.3, pendientes: 0 },
    { propuestaId: 44, titulo: 'Robótica educativa en colegios rurales', puntuacion: null, pendientes: 1 },
    { propuestaId: 45, titulo: 'Realidad aumentada para laboratorios de física', puntuacion: null, pendientes: 0, sinEvaluadores: true },
  ].map((p) => ({
    ...p,
    clasificacion: p.aplicada || null,
    fechaClasificacion: p.aplicada ? '2026-11-04T10:30:00' : null,
    estado: p.aplicada ? ESTADO_POR_CLASIFICACION[p.aplicada] : 'en_evaluacion',
    manual: Boolean(p.manual),
  }));
}

/** Historial inicial de las propuestas ya clasificadas. */
function historialInicial() {
  return [
    {
      historialId: 1, propuestaId: 40, tipo: 'automatica', clasificacionAnterior: null, clasificacionNueva: 'aprobada',
      puntuacionPonderada: 8.6, umbralAceptacion: 7, umbralAjustes: 5, motivo: null,
      realizadoPor: 'María Rodríguez', fechaHora: '2026-11-04T10:30:00',
    },
    {
      historialId: 2, propuestaId: 41, tipo: 'automatica', clasificacionAnterior: null, clasificacionNueva: 'aprobada',
      puntuacionPonderada: 7.1, umbralAceptacion: 7, umbralAjustes: 5, motivo: null,
      realizadoPor: 'María Rodríguez', fechaHora: '2026-11-04T10:30:00',
    },
    {
      historialId: 3, propuestaId: 41, tipo: 'manual', clasificacionAnterior: 'aprobada', clasificacionNueva: 'aprobada_con_ajustes',
      puntuacionPonderada: 7.1, umbralAceptacion: 7, umbralAjustes: 5,
      motivo: 'El comité pidió ajustar la metodología antes de aceptarla definitivamente.',
      realizadoPor: 'María Rodríguez', fechaHora: '2026-11-04T11:05:00',
    },
  ];
}

const errorApi = (status, codigo, message, erroresValidacion) => {
  const error = new Error(message);
  error.response = { status, data: { status, codigo, message, erroresValidacion } };
  return error;
};

/**
 * API simulada con estado en memoria. Cada llamada devuelve copias para que la interfaz no comparta objetos.
 * @param {{ demora?: number, umbrales?: { umbralAceptacion: number, umbralAjustes: number },
 *   sinClasificar?: boolean }} [opciones] - Con `sinClasificar` ninguna propuesta empieza clasificada (los umbrales
 *   se pueden editar).
 * @returns {typeof import('../../../api/clasificacionService').clasificacionService}
 */
export function crearClasificacionApiMock({ demora = 250, umbrales = UMBRALES_POR_DEFECTO, sinClasificar = false } = {}) {
  const estado = {
    umbrales: { ...umbrales },
    propuestas: sinClasificar
      ? propuestasIniciales().map((p) => ({ ...p, clasificacion: null, fechaClasificacion: null, estado: 'en_evaluacion', manual: false }))
      : propuestasIniciales(),
    historial: sinClasificar ? [] : historialInicial(),
    siguienteId: 100,
  };
  const esperar = (valor) => new Promise((resolve) => setTimeout(() => resolve(valor), demora));
  const buscar = (propuestaId) => estado.propuestas.find((p) => p.propuestaId === propuestaId);
  const completa = (p) => !p.sinEvaluadores && p.pendientes === 0 && p.puntuacion != null;

  const fila = (p) => {
    const evaluacionCompleta = completa(p);
    const porUmbrales = clasificarPuntuacion(p.puntuacion, estado.umbrales);
    const vigente = evaluacionCompleta ? p.clasificacion || porUmbrales : null;
    return {
      propuestaId: p.propuestaId,
      titulo: p.titulo,
      estadoPropuesta: p.estado,
      evaluacionCompleta,
      asignacionesPendientes: p.pendientes,
      puntuacionPonderada: p.puntuacion,
      clasificacionPorUmbrales: porUmbrales,
      clasificacion: vigente,
      etiqueta: vigente ? ETIQUETAS_CLASIFICACION[vigente] : null,
      ajusteManual: p.manual,
      aplicada: Boolean(evaluacionCompleta && vigente && p.fechaClasificacion && p.estado === ESTADO_POR_CLASIFICACION[vigente]),
      fechaClasificacion: p.fechaClasificacion,
    };
  };

  const motivoIncompleta = (p) => {
    if (p.sinEvaluadores) return 'no tiene evaluadores asignados.';
    if (p.pendientes > 0) return `tiene ${p.pendientes} evaluación(es) pendiente(s) de 2 asignada(s).`;
    return 'aún no tiene puntuación ponderada calculada.';
  };

  const registrar = (p, tipo, anterior, nueva, motivo = null) => {
    estado.historial.unshift({
      historialId: estado.siguienteId++,
      propuestaId: p.propuestaId,
      tipo,
      clasificacionAnterior: anterior,
      clasificacionNueva: nueva,
      puntuacionPonderada: p.puntuacion,
      umbralAceptacion: estado.umbrales.umbralAceptacion,
      umbralAjustes: estado.umbrales.umbralAjustes,
      motivo,
      realizadoPor: 'María Rodríguez',
      fechaHora: new Date().toISOString(),
    });
  };

  const aplicarAutomatica = (p) => {
    const anterior = p.fechaClasificacion ? p.clasificacion : null;
    const nueva = p.manual ? p.clasificacion : clasificarPuntuacion(p.puntuacion, estado.umbrales);
    if (anterior === nueva && p.estado === ESTADO_POR_CLASIFICACION[nueva]) return;
    p.clasificacion = nueva;
    p.fechaClasificacion = new Date().toISOString();
    p.estado = ESTADO_POR_CLASIFICACION[nueva];
    if (!p.manual) registrar(p, 'automatica', anterior, nueva);
  };

  const exigirCompleta = (p) => {
    if (!p) throw errorApi(404, 'RECURSO_NO_ENCONTRADO', 'No se encontró la propuesta.');
    if (!completa(p)) {
      throw errorApi(409, 'PROPUESTA_NO_EVALUADA', `La propuesta no se puede clasificar: ${motivoIncompleta(p)}`);
    }
  };

  return {
    async listarPorConvocatoria(convocatoriaId) {
      const filas = estado.propuestas.map(fila);
      const totales = Object.fromEntries(GRUPOS.map((g) => [g.id, 0]));
      filas.forEach((f) => {
        totales[grupoDe(f)] += 1;
      });
      const orden = GRUPOS.map((g) => g.id);
      filas.sort(
        (a, b) =>
          orden.indexOf(grupoDe(a)) - orden.indexOf(grupoDe(b)) ||
          (b.puntuacionPonderada ?? -1) - (a.puntuacionPonderada ?? -1)
      );
      return esperar({ convocatoriaId, ...estado.umbrales, totales, propuestas: filas });
    },

    async configurarUmbrales(convocatoriaId, { umbralAceptacion, umbralAjustes }) {
      await esperar();
      if (umbralAjustes > umbralAceptacion) {
        throw errorApi(400, 'SOLICITUD_INVALIDA', 'El umbral de aprobación con ajustes no puede ser mayor que el umbral de aprobación.');
      }
      const clasificadas = estado.propuestas.filter((p) => p.fechaClasificacion).length;
      if (clasificadas > 0) {
        throw errorApi(
          409,
          'OPERACION_NO_PERMITIDA',
          `No se pueden cambiar los umbrales: ${clasificadas} propuesta(s) de la convocatoria ya están clasificadas con los actuales. Para corregir el resultado de una propuesta use el ajuste manual.`
        );
      }
      estado.umbrales = { umbralAceptacion, umbralAjustes };
      return { convocatoriaId, umbralAceptacion, umbralAjustes, propuestasPorReaplicar: 0 };
    },

    async aplicarConvocatoria(convocatoriaId) {
      await esperar();
      const clasificadas = [];
      const omitidas = [];
      estado.propuestas.forEach((p) => {
        if (!completa(p)) {
          omitidas.push({ propuestaId: p.propuestaId, titulo: p.titulo, motivo: motivoIncompleta(p) });
          return;
        }
        aplicarAutomatica(p);
        clasificadas.push(fila(p));
      });
      return { convocatoriaId, clasificadas, omitidas };
    },

    async aplicarPropuesta(propuestaId) {
      await esperar();
      const p = buscar(propuestaId);
      exigirCompleta(p);
      aplicarAutomatica(p);
      return fila(p);
    },

    async ajustarClasificacion(propuestaId, { clasificacion, motivo }) {
      await esperar();
      const limpio = (motivo || '').trim();
      if (limpio.length < 10) {
        throw errorApi(400, 'VALIDACION_FALLIDA', 'La solicitud tiene datos inválidos.', {
          motivo: 'El motivo debe tener entre 10 y 1000 caracteres.',
        });
      }
      const p = buscar(propuestaId);
      exigirCompleta(p);
      if (p.fechaClasificacion && p.clasificacion === clasificacion && p.estado === ESTADO_POR_CLASIFICACION[clasificacion]) {
        throw errorApi(400, 'SOLICITUD_INVALIDA', `La propuesta ya está clasificada como '${ETIQUETAS_CLASIFICACION[clasificacion]}'.`);
      }
      const anterior = p.clasificacion || clasificarPuntuacion(p.puntuacion, estado.umbrales);
      p.clasificacion = clasificacion;
      p.manual = true;
      p.fechaClasificacion = new Date().toISOString();
      p.estado = ESTADO_POR_CLASIFICACION[clasificacion];
      registrar(p, 'manual', anterior, clasificacion, limpio);
      return fila(p);
    },

    async listarHistorial(propuestaId) {
      return esperar(estado.historial.filter((h) => h.propuestaId === propuestaId).map((h) => ({ ...h })));
    },
  };
}

/** API simulada en la que el listado falla (para el estado de error). */
export const clasificacionApiMockConError = {
  ...crearClasificacionApiMock({ demora: 0 }),
  listarPorConvocatoria: () => Promise.reject(errorApi(500, 'ERROR_INTERNO', 'Error simulado')),
};
