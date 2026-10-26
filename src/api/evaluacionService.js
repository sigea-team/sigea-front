import { httpClient } from './httpClient';
import {
  calcularPuntuacionPonderada,
  determinarClasificacion,
} from '../features/evaluaciones/evaluacionUtils';
import { normalizarAsignacionBandeja } from '../features/asignaciones/asignacionUtils';

/**
 * @file evaluacionService.js
 * @description Servicio de API para la gestión de evaluaciones de propuestas académicas (HU-17).
 * Conecta con los endpoints REST del backend en /api/v1/evaluaciones.
 *
 * Implementa almacenamiento en memoria / localStorage para modo de desarrollo o respaldo
 * cuando las asignaciones aún no han sido sembradas en la base de datos remota.
 * @module api/evaluacionService
 */

const CLAVE_LOCAL_EVALUACIONES = 'sigea-evaluaciones-local';

/** Rúbrica estándar de evaluación SIGEA / UFPS */
export const RUBRICA_DEMO = [
  {
    id: 1,
    nombre: 'Originalidad y Novedad del Aporte',
    descripcion: 'Evalúa la innovación de la propuesta frente al estado del arte en el área temática.',
    pesoPorcentual: 35,
  },
  {
    id: 2,
    nombre: 'Rigor Metodológico y Fundamentación Teórica',
    descripcion: 'Validez del marco conceptual, coherencia metodológica y pertinencia de los métodos utilizados.',
    pesoPorcentual: 35,
  },
  {
    id: 3,
    nombre: 'Claridad en la Redacción y Estructura',
    descripcion: 'Calidad sintáctica, ortográfica, organización de las secciones y cumplimiento de normas.',
    pesoPorcentual: 15,
  },
  {
    id: 4,
    nombre: 'Relevancia e Impacto en la Comunidad',
    descripcion: 'Potencial de transferencia, aplicabilidad práctica y pertinencia para el evento académico.',
    pesoPorcentual: 15,
  },
];

/** Asignaciones de ejemplo representativas para pruebas de los 4 criterios de aceptación */
const ASIGNACIONES_SEMILLA = [
  {
    asignacionId: 101,
    propuestaId: 1,
    propuestaTitulo: 'Inteligencia Artificial aplicada al diagnóstico precoz de patologías cardiovasculares',
    propuestaResumen: 'Estudio comparativo de modelos convolucionales profundos entrenados con angiografías para detección temprana de estenosis coronaria en pacientes de alto riesgo.',
    convocatoriaTitulo: 'V Simposio Internacional de Ingeniería y Salud 2026',
    autores: ['Dr. Carlos Mendoza', 'Ing. Sofía Duarte'],
    fechaAsignacion: '2026-10-15T10:00:00',
    fechaCierre: '2026-11-30T23:59:59', // Abierta (Criterio 1 y 2)
    estado: 'pendiente',
    evaluaciones: RUBRICA_DEMO.map((c) => ({
      evaluacionId: null,
      asignacionId: 101,
      criterioId: c.id,
      nombreCriterio: c.nombre,
      descripcionCriterio: c.descripcion,
      pesoPorcentual: c.pesoPorcentual,
      calificacion: null,
      observaciones: '',
    })),
  },
  {
    asignacionId: 102,
    propuestaId: 2,
    propuestaTitulo: 'Marco de Ciberseguridad Zero-Trust para Entornos de Nube Híbrida en el Sector Financiero',
    propuestaResumen: 'Propuesta de arquitectura basada en microsegmentación dinámica, autenticación multifactor continua y telemetría de comportamiento para mitigar movimientos laterales.',
    convocatoriaTitulo: 'Congreso Nacional de Tecnologías Emergentes 2026',
    autores: ['MSc. Valentina Ríos'],
    fechaAsignacion: '2026-10-18T14:30:00',
    fechaCierre: '2026-12-15T18:00:00', // Abierta (Criterio 4: permite recalcular)
    estado: 'completada',
    evaluaciones: [
      {
        evaluacionId: 201,
        asignacionId: 102,
        criterioId: 1,
        nombreCriterio: 'Originalidad y Novedad del Aporte',
        pesoPorcentual: 35,
        calificacion: 8.5,
        observaciones: 'Enfoque muy actual y adaptado al ecosistema bancario local.',
        fechaEvaluacion: '2026-10-20T16:00:00',
      },
      {
        evaluacionId: 202,
        asignacionId: 102,
        criterioId: 2,
        nombreCriterio: 'Rigor Metodológico y Fundamentación Teórica',
        pesoPorcentual: 35,
        calificacion: 8.0,
        observaciones: 'Metodología clara y sólida fundamentación en estándares NIST.',
        fechaEvaluacion: '2026-10-20T16:00:00',
      },
      {
        evaluacionId: 203,
        asignacionId: 102,
        criterioId: 3,
        nombreCriterio: 'Claridad en la Redacción y Estructura',
        pesoPorcentual: 15,
        calificacion: 9.0,
        observaciones: 'Excelente estructuración y uso riguroso del vocabulario técnico.',
        fechaEvaluacion: '2026-10-20T16:00:00',
      },
      {
        evaluacionId: 204,
        asignacionId: 102,
        criterioId: 4,
        nombreCriterio: 'Relevancia e Impacto en la Comunidad',
        pesoPorcentual: 15,
        calificacion: 8.0,
        observaciones: 'Gran aporte para la industria fintech regional.',
        fechaEvaluacion: '2026-10-20T16:00:00',
      },
    ],
  },
  {
    asignacionId: 103,
    propuestaId: 3,
    propuestaTitulo: 'Optimización de Cadenas de Suministro con Algoritmos Genéticos y Gemelos Digitales',
    propuestaResumen: 'Modelado y simulación estocástica de rutas de transporte multimodal para reducir la huella de carbono y costos operativos en empresas de logística urbana.',
    convocatoriaTitulo: 'Jornadas de Investigación en Logística y Operaciones 2026',
    autores: ['Dr. Fernando Castro', 'Dra. María Elena Gómez'],
    fechaAsignacion: '2026-09-01T08:00:00',
    fechaCierre: '2026-09-30T23:59:59', // Cerrada en el pasado (Criterio 4: bloqueada)
    estado: 'completada',
    evaluaciones: [
      {
        evaluacionId: 301,
        asignacionId: 103,
        criterioId: 1,
        nombreCriterio: 'Originalidad y Novedad del Aporte',
        pesoPorcentual: 35,
        calificacion: 6.0,
        observaciones: 'La técnica es conocida aunque la aplicación es válida.',
        fechaEvaluacion: '2026-09-25T11:00:00',
      },
      {
        evaluacionId: 302,
        asignacionId: 103,
        criterioId: 2,
        nombreCriterio: 'Rigor Metodológico y Fundamentación Teórica',
        pesoPorcentual: 35,
        calificacion: 6.5,
        observaciones: 'Se sugiere ampliar el tamaño muestral en la validación.',
        fechaEvaluacion: '2026-09-25T11:00:00',
      },
      {
        evaluacionId: 303,
        asignacionId: 103,
        criterioId: 3,
        nombreCriterio: 'Claridad en la Redacción y Estructura',
        pesoPorcentual: 15,
        calificacion: 7.0,
        observaciones: 'Buena redacción general.',
        fechaEvaluacion: '2026-09-25T11:00:00',
      },
      {
        evaluacionId: 304,
        asignacionId: 103,
        criterioId: 4,
        nombreCriterio: 'Relevancia e Impacto en la Comunidad',
        pesoPorcentual: 15,
        calificacion: 6.5,
        observaciones: 'Aporte de interés regional.',
        fechaEvaluacion: '2026-09-25T11:00:00',
      },
    ],
  },
];

/**
 * Obtiene las asignaciones guardadas en almacenamiento local o semilla.
 * @returns {Array<Object>}
 */
function obtenerAsignacionesLocales() {
  try {
    const raw = localStorage.getItem(CLAVE_LOCAL_EVALUACIONES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Si falla lectura, usar semilla
  }
  return ASIGNACIONES_SEMILLA;
}

/**
 * Guarda las asignaciones modificadas localmente.
 * @param {Array<Object>} lista
 */
function guardarAsignacionesLocales(lista) {
  try {
    localStorage.setItem(CLAVE_LOCAL_EVALUACIONES, JSON.stringify(lista));
  } catch {
    // localStorage no disponible
  }
}

export const evaluacionService = {
  /**
   * Lista las asignaciones de propuestas para el evaluador autenticado (bandeja, HU-16 Criterio 1).
   * Backend endpoint: GET /api/v1/asignaciones/mis-asignaciones?incluirCompletadas=true
   * (se piden también las completadas porque esta vista las filtra con sus propias pestañas).
   *
   * @param {Object} [filtros]
   * @param {number|string} [filtros.propuestaId]
   * @param {string} [filtros.estado]
   * @returns {Promise<Array<Object>>}
   */
  async listarAsignaciones(filtros = {}) {
    try {
      const { data } = await httpClient.get('/asignaciones/mis-asignaciones', {
        params: { incluirCompletadas: true },
      });
      if (Array.isArray(data) && data.length > 0) {
        let reales = data.map((a) => normalizarAsignacionBandeja(a, RUBRICA_DEMO));
        if (filtros.propuestaId) {
          reales = reales.filter((a) => String(a.propuestaId) === String(filtros.propuestaId));
        }
        if (filtros.estado && filtros.estado !== 'todos') {
          reales = reales.filter((a) => a.estado === filtros.estado);
        }
        return reales;
      }
    } catch (err) {
      // Si el endpoint responde 404 o el backend no está disponible en este momento,
      // se utiliza la lista local para garantizar que la interfaz sea 100% funcional.
      console.info('[evaluacionService] Utilizando fuente de asignaciones local / reactiva:', err?.message);
    }

    // Filtrar localmente según parámetros
    let asignaciones = obtenerAsignacionesLocales();
    if (filtros.propuestaId) {
      asignaciones = asignaciones.filter((a) => String(a.propuestaId) === String(filtros.propuestaId));
    }
    if (filtros.estado && filtros.estado !== 'todos') {
      asignaciones = asignaciones.filter((a) => a.estado === filtros.estado);
    }
    return asignaciones;
  },

  /**
   * Obtiene el detalle de una asignación específica, incluyendo sus criterios y calificaciones.
   * Backend endpoint: GET /api/v1/evaluaciones/asignaciones/{asignacionId}
   *
   * @param {number|string} asignacionId
   * @returns {Promise<Object>}
   */
  async obtenerAsignacion(asignacionId) {
    try {
      const { data } = await httpClient.get(`/evaluaciones/asignaciones/${asignacionId}`);
      if (data && data.asignacionId) {
        return data;
      }
    } catch {
      // Fallback a almacenamiento local
    }

    const localList = obtenerAsignacionesLocales();
    const encontrada = localList.find((a) => String(a.asignacionId) === String(asignacionId));
    if (encontrada) return encontrada;

    throw new Error(`No se encontró la asignación de evaluación con ID: ${asignacionId}`);
  },

  /**
   * Registra o actualiza la evaluación de una propuesta (HU-17).
   * Backend endpoint: POST /api/v1/evaluaciones
   *
   * @param {Object} request
   * @param {number} request.asignacionId
   * @param {Array<{ criterioId: number, calificacion: number, observaciones?: string }>} request.calificaciones
   * @returns {Promise<Object>} AsignacionEvaluacionResponse
   */
  async registrarEvaluacion(request) {
    let backendResponse = null;

    try {
      const { data } = await httpClient.post('/evaluaciones', request);
      backendResponse = data;
    } catch (err) {
      const status = err.response?.status;
      // Propagar errores de validación y de periodo cerrado directamente para mostrarlos en UI
      if (status === 400 || status === 409) {
        throw err;
      }
      console.warn('[evaluacionService] Error de red o servidor no disponible al registrar:', err?.message);
    }

    // Actualizar también la réplica local para reflejar inmediatamente el cambio en la UI
    const localList = obtenerAsignacionesLocales();
    const index = localList.findIndex((a) => String(a.asignacionId) === String(request.asignacionId));

    if (index !== -1) {
      const asig = { ...localList[index] };
      asig.estado = 'completada';

      // Mapear calificaciones registradas
      asig.evaluaciones = (asig.evaluaciones || RUBRICA_DEMO).map((criterio) => {
        const calEnviada = request.calificaciones.find(
          (c) => String(c.criterioId) === String(criterio.criterioId || criterio.id)
        );
        return {
          ...criterio,
          calificacion: calEnviada ? Number(calEnviada.calificacion) : criterio.calificacion,
          observaciones: calEnviada ? calEnviada.observaciones || '' : criterio.observaciones || '',
          fechaEvaluacion: new Date().toISOString(),
        };
      });

      localList[index] = asig;
      guardarAsignacionesLocales(localList);

      return backendResponse || asig;
    }

    return backendResponse || { asignacionId: request.asignacionId, estado: 'completada' };
  },

  /**
   * Consulta el resultado de evaluación ponderada de una propuesta (HU-17).
   * Backend endpoint: GET /api/v1/evaluaciones/propuestas/{propuestaId}/resultado
   *
   * @param {number|string} propuestaId
   * @returns {Promise<Object>} ResultadoEvaluacionResponse { propuestaId, puntuacionPonderada, clasificacion, completo }
   */
  async obtenerResultado(propuestaId) {
    try {
      const { data } = await httpClient.get(`/evaluaciones/propuestas/${propuestaId}/resultado`);
      if (data) return data;
    } catch {
      // Fallback a cálculo local
    }

    const localList = obtenerAsignacionesLocales();
    const asignacionesPropuesta = localList.filter((a) => String(a.propuestaId) === String(propuestaId));

    if (asignacionesPropuesta.length === 0) {
      return {
        resultadoId: null,
        propuestaId: Number(propuestaId),
        propuestaTitulo: 'Propuesta',
        puntuacionPonderada: null,
        clasificacion: null,
        completo: false,
      };
    }

    // Criterio 3: si alguna asignación está pendiente, el resultado está incompleto
    const hayPendientes = asignacionesPropuesta.some((a) => a.estado !== 'completada');
    if (hayPendientes) {
      return {
        resultadoId: null,
        propuestaId: Number(propuestaId),
        propuestaTitulo: asignacionesPropuesta[0].propuestaTitulo,
        puntuacionPonderada: null,
        clasificacion: null,
        fechaCalculo: null,
        completo: false,
      };
    }

    // Criterio 1: todas completadas -> calcular ponderación
    const todasCalificaciones = [];
    asignacionesPropuesta.forEach((a) => {
      (a.evaluaciones || []).forEach((ev) => {
        todasCalificaciones.push({
          criterioId: ev.criterioId,
          calificacion: ev.calificacion,
        });
      });
    });

    const puntuacionPonderada = calcularPuntuacionPonderada(todasCalificaciones, RUBRICA_DEMO);
    const clasificacion = determinarClasificacion(puntuacionPonderada);

    return {
      resultadoId: Date.now(),
      propuestaId: Number(propuestaId),
      propuestaTitulo: asignacionesPropuesta[0].propuestaTitulo,
      puntuacionPonderada,
      clasificacion,
      fechaCalculo: new Date().toISOString(),
      completo: true,
    };
  },

  /**
   * Restablece las asignaciones locales de demostración.
   */
  restablecerDatosDemo() {
    guardarAsignacionesLocales(ASIGNACIONES_SEMILLA);
  },
};
