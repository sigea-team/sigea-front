/**
 * @file asignacionesMock.js
 * @description Datos y API simulada de asignación de propuestas a evaluadores (HU-16), solo para
 * Storybook y pruebas. Imita las respuestas y reglas del backend (AsignacionEvaluacionService)
 * sin necesidad de servidor.
 * @module features/asignaciones/mocks/asignacionesMock
 */

import { ESTADOS_PROPUESTA_ASIGNABLES, NIVELES_CONFLICTO } from '../asignacionUtils';

/** Convocatoria publicada de ejemplo. */
export const CONVOCATORIA_MOCK = {
  id: 10,
  titulo: 'Convocatoria de Ponencias 2026',
  eventoNombre: 'Congreso de Ingeniería de Sistemas',
  estado: 'PUBLICADA',
  fechaCierre: '2026-11-30T23:59:00',
};

/** Personas (afiliación 1 = UFPS, 2 = UIS, 3 = UNAB). */
const PERSONAS = {
  21: { nombre: 'Ana Pérez', correo: 'ana.perez@uis.edu.co', afiliacionId: 2, afiliacion: 'UIS' },
  22: { nombre: 'Luis Gómez', correo: 'luis.gomez@uis.edu.co', afiliacionId: 3, afiliacion: 'UNAB' },
  27: { nombre: 'Sofía Mora', correo: 'sofia.mora@ufps.edu.co', afiliacionId: 1, afiliacion: 'UFPS' },
  30: { nombre: 'Carlos Ruiz', correo: 'carlos.ruiz@ufps.edu.co', afiliacionId: 1, afiliacion: 'UFPS' },
  31: { nombre: 'Daniela Vera', correo: 'daniela.vera@unab.edu.co', afiliacionId: 3, afiliacion: 'UNAB' },
};

/** Comité evaluador de la convocatoria 10. Carlos Ruiz (persona 30) también es autor de la propuesta 40. */
export const EVALUADORES_MOCK = [
  { comiteEvaluadorId: 3, personaId: 21, areaExperticia: 'Ingeniería de software' },
  { comiteEvaluadorId: 5, personaId: 22, areaExperticia: 'Ciencia de datos' },
  { comiteEvaluadorId: 7, personaId: 27, areaExperticia: 'Educación virtual' },
  { comiteEvaluadorId: 8, personaId: 30, areaExperticia: 'Analítica educativa' },
];

/** Propuestas de la convocatoria 10 con sus autores (IDs de persona). */
export const PROPUESTAS_MOCK = [
  {
    propuestaId: 40,
    titulo: 'Analítica de datos en la educación superior',
    estado: 'recibida',
    fechaEnvio: '2026-10-20T09:00:00',
    autoresIds: [30, 31],
  },
  {
    propuestaId: 41,
    titulo: 'Gemelos digitales para laboratorios de redes',
    estado: 'en_evaluacion',
    fechaEnvio: '2026-10-18T15:30:00',
    autoresIds: [31],
  },
  {
    propuestaId: 42,
    titulo: 'Ciberseguridad en entornos universitarios',
    estado: 'aprobada',
    fechaEnvio: '2026-10-02T11:00:00',
    autoresIds: [31],
  },
];

/** Asignaciones iniciales: la propuesta 41 ya tiene evaluadores; una de ellas completada. */
export const ASIGNACIONES_MOCK = [
  { asignacionId: 12, propuestaId: 41, comiteEvaluadorId: 3, estado: 'pendiente', fechaAsignacion: '2026-10-21T10:00:00' },
  { asignacionId: 13, propuestaId: 41, comiteEvaluadorId: 5, estado: 'completada', fechaAsignacion: '2026-10-21T10:00:00' },
  { asignacionId: 14, propuestaId: 42, comiteEvaluadorId: 3, estado: 'completada', fechaAsignacion: '2026-10-03T08:00:00' },
];

/** Historial inicial coherente con las asignaciones (incluye una reasignación en la propuesta 41). */
export const HISTORIAL_MOCK = [
  { historialId: 1, asignacionId: 12, propuestaId: 41, tipoOperacion: 'asignacion', anterior: null, nuevo: 7, conflictoAdvertido: false, motivo: null, fechaHora: '2026-10-19T09:00:00' },
  { historialId: 2, asignacionId: 13, propuestaId: 41, tipoOperacion: 'asignacion', anterior: null, nuevo: 5, conflictoAdvertido: false, motivo: null, fechaHora: '2026-10-19T09:00:00' },
  { historialId: 3, asignacionId: 12, propuestaId: 41, tipoOperacion: 'reasignacion', anterior: 7, nuevo: 3, conflictoAdvertido: false, motivo: 'La evaluadora inicial no tiene disponibilidad', fechaHora: '2026-10-21T10:00:00' },
  { historialId: 4, asignacionId: 14, propuestaId: 42, tipoOperacion: 'asignacion', anterior: null, nuevo: 3, conflictoAdvertido: false, motivo: null, fechaHora: '2026-10-03T08:00:00' },
];

const ORGANIZADOR = 'María Rodríguez';
const esperar = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function errorApi(status, message, codigo) {
  const err = new Error(message);
  err.response = { status, data: { status, message, codigo } };
  return err;
}

/**
 * Crea una API simulada con estado en memoria y las mismas reglas del backend.
 * @param {Object} [opciones]
 * @param {number} [opciones.demora=300] - Milisegundos de espera simulada (0 en pruebas).
 * @param {Date} [opciones.ahora] - Fecha para las nuevas asignaciones.
 */
export function crearAsignacionesApiMock({ demora = 300, ahora } = {}) {
  const propuestas = PROPUESTAS_MOCK.map((p) => ({ ...p, autoresIds: [...p.autoresIds] }));
  let asignaciones = ASIGNACIONES_MOCK.map((a) => ({ ...a }));
  let historial = HISTORIAL_MOCK.map((h) => ({ ...h }));
  let siguienteAsignacion = Math.max(...asignaciones.map((a) => a.asignacionId)) + 1;
  let siguienteHistorial = Math.max(...historial.map((h) => h.historialId)) + 1;

  const fechaActual = () => (ahora || new Date()).toISOString().slice(0, 19);
  const evaluador = (id) => EVALUADORES_MOCK.find((e) => e.comiteEvaluadorId === Number(id));
  const persona = (id) => PERSONAS[id];
  const nombreEvaluador = (id) => (evaluador(id) ? persona(evaluador(id).personaId).nombre : null);

  const buscarPropuesta = (id) => {
    const propuesta = propuestas.find((p) => p.propuestaId === Number(id));
    if (!propuesta) throw errorApi(404, `No se encontró la propuesta con ID: ${id}`, 'RECURSO_NO_ENCONTRADO');
    return propuesta;
  };

  const validarAsignable = (propuesta) => {
    if (!ESTADOS_PROPUESTA_ASIGNABLES.includes(propuesta.estado)) {
      throw errorApi(
        409,
        `La propuesta '${propuesta.titulo}' está en estado '${propuesta.estado}'. Solo se asignan propuestas recibidas o en evaluación.`,
        'OPERACION_NO_PERMITIDA'
      );
    }
  };

  /** Misma regla que AsignacionEvaluacionService.evaluarConflicto. */
  const conflicto = (comiteEvaluadorId, propuesta) => {
    const ev = evaluador(comiteEvaluadorId);
    const p = persona(ev.personaId);
    if (propuesta.autoresIds.includes(ev.personaId)) {
      return {
        nivel: NIVELES_CONFLICTO.BLOQUEANTE,
        detalle: `${p.nombre} figura como autor principal de la propuesta. Un evaluador no puede evaluar una propuesta propia.`,
      };
    }
    const autorMismaAfiliacion = propuesta.autoresIds.map(persona).find((a) => a.afiliacionId === p.afiliacionId);
    if (autorMismaAfiliacion) {
      return {
        nivel: NIVELES_CONFLICTO.ADVERTENCIA,
        detalle: `${p.nombre} comparte la afiliación '${p.afiliacion}' con el autor ${autorMismaAfiliacion.nombre}.`,
      };
    }
    return { nivel: NIVELES_CONFLICTO.NINGUNO, detalle: null };
  };

  const aRespuesta = (a, advertencias = []) => {
    const propuesta = buscarPropuesta(a.propuestaId);
    const ev = evaluador(a.comiteEvaluadorId);
    const p = persona(ev.personaId);
    return {
      asignacionId: a.asignacionId,
      propuestaId: propuesta.propuestaId,
      propuestaTitulo: propuesta.titulo,
      estadoPropuesta: propuesta.estado,
      convocatoriaId: CONVOCATORIA_MOCK.id,
      convocatoriaTitulo: CONVOCATORIA_MOCK.titulo,
      comiteEvaluadorId: ev.comiteEvaluadorId,
      evaluadorPersonaId: ev.personaId,
      evaluadorNombre: p.nombre,
      evaluadorCorreo: p.correo,
      areaExperticia: ev.areaExperticia,
      fechaAsignacion: a.fechaAsignacion,
      estado: a.estado,
      advertencias,
    };
  };

  const registrarHistorial = (asignacionId, propuestaId, tipoOperacion, anterior, nuevo, conflictoAdvertido, motivo) => {
    historial.push({
      historialId: siguienteHistorial++,
      asignacionId,
      propuestaId,
      tipoOperacion,
      anterior,
      nuevo,
      conflictoAdvertido,
      motivo: motivo || null,
      fechaHora: fechaActual(),
    });
  };

  const exigirConfirmacion = (advertencias, confirmado) => {
    if (advertencias.length > 0 && !confirmado) {
      throw errorApi(
        409,
        `Posible conflicto de interés: ${advertencias.join(' ')} Confirme la asignación (confirmarConflicto = true) para continuar.`,
        'CONFIRMACION_REQUERIDA'
      );
    }
  };

  return {
    async listarPropuestasConvocatoria(convocatoriaId) {
      await esperar(demora);
      if (Number(convocatoriaId) !== CONVOCATORIA_MOCK.id) return [];
      return [...propuestas]
        .sort((a, b) => b.fechaEnvio.localeCompare(a.fechaEnvio))
        .map((p) => {
          const propias = asignaciones.filter((a) => a.propuestaId === p.propuestaId);
          return {
            propuestaId: p.propuestaId,
            titulo: p.titulo,
            estado: p.estado,
            fechaEnvio: p.fechaEnvio,
            autores: p.autoresIds.map((id) => persona(id).nombre),
            evaluadores: propias.map((a) => nombreEvaluador(a.comiteEvaluadorId)),
            asignacionesTotales: propias.length,
            asignacionesCompletadas: propias.filter((a) => a.estado === 'completada').length,
          };
        });
    },

    async listarAsignaciones(propuestaId) {
      await esperar(demora);
      buscarPropuesta(propuestaId);
      return asignaciones
        .filter((a) => a.propuestaId === Number(propuestaId))
        .sort((a, b) => b.fechaAsignacion.localeCompare(a.fechaAsignacion) || b.asignacionId - a.asignacionId)
        .map((a) => aRespuesta(a));
    },

    async listarEvaluadoresDisponibles(propuestaId) {
      await esperar(demora);
      const propuesta = buscarPropuesta(propuestaId);
      return EVALUADORES_MOCK.map((ev) => {
        const p = persona(ev.personaId);
        const c = conflicto(ev.comiteEvaluadorId, propuesta);
        return {
          comiteEvaluadorId: ev.comiteEvaluadorId,
          personaId: ev.personaId,
          nombre: p.nombre,
          correo: p.correo,
          areaExperticia: ev.areaExperticia,
          asignacionesAbiertas: asignaciones.filter(
            (a) => a.comiteEvaluadorId === ev.comiteEvaluadorId && a.estado !== 'completada'
          ).length,
          yaAsignado: asignaciones.some(
            (a) => a.propuestaId === propuesta.propuestaId && a.comiteEvaluadorId === ev.comiteEvaluadorId
          ),
          conflicto: c.nivel,
          detalleConflicto: c.detalle,
        };
      }).sort((a, b) => a.nombre.localeCompare(b.nombre));
    },

    async listarHistorial(propuestaId) {
      await esperar(demora);
      buscarPropuesta(propuestaId);
      return historial
        .filter((h) => h.propuestaId === Number(propuestaId))
        .sort((a, b) => b.fechaHora.localeCompare(a.fechaHora) || b.historialId - a.historialId)
        .map((h) => ({
          historialId: h.historialId,
          asignacionId: h.asignacionId,
          propuestaId: h.propuestaId,
          tipoOperacion: h.tipoOperacion,
          evaluadorAnteriorId: h.anterior,
          evaluadorAnteriorNombre: h.anterior ? nombreEvaluador(h.anterior) : null,
          evaluadorNuevoId: h.nuevo,
          evaluadorNuevoNombre: nombreEvaluador(h.nuevo),
          conflictoAdvertido: h.conflictoAdvertido,
          motivo: h.motivo,
          realizadoPor: ORGANIZADOR,
          fechaHora: h.fechaHora,
        }));
    },

    async asignarEvaluadores(propuestaId, comiteEvaluadorIds, confirmarConflicto = false) {
      await esperar(demora);
      const propuesta = buscarPropuesta(propuestaId);
      validarAsignable(propuesta);
      const ids = [...new Set(comiteEvaluadorIds.map(Number))];
      if (ids.length === 0) throw errorApi(400, 'Debe indicar al menos un evaluador.', 'VALIDACION_FALLIDA');

      const conflictos = ids.map((id) => {
        const ev = evaluador(id);
        if (!ev) throw errorApi(404, `No se encontró el evaluador del comité con ID: ${id}`, 'RECURSO_NO_ENCONTRADO');
        if (asignaciones.some((a) => a.propuestaId === propuesta.propuestaId && a.comiteEvaluadorId === id)) {
          throw errorApi(409, `La propuesta '${propuesta.titulo}' ya está asignada a ${nombreEvaluador(id)}.`, 'ASIGNACION_DUPLICADA');
        }
        const c = conflicto(id, propuesta);
        if (c.nivel === NIVELES_CONFLICTO.BLOQUEANTE) throw errorApi(409, c.detalle, 'CONFLICTO_INTERES');
        return { id, ...c };
      });
      exigirConfirmacion(
        conflictos.filter((c) => c.nivel === NIVELES_CONFLICTO.ADVERTENCIA).map((c) => c.detalle),
        confirmarConflicto
      );

      const creadas = conflictos.map((c) => {
        const nueva = {
          asignacionId: siguienteAsignacion++,
          propuestaId: propuesta.propuestaId,
          comiteEvaluadorId: c.id,
          estado: 'pendiente',
          fechaAsignacion: fechaActual(),
        };
        asignaciones = [...asignaciones, nueva];
        const advertido = c.nivel === NIVELES_CONFLICTO.ADVERTENCIA;
        registrarHistorial(nueva.asignacionId, propuesta.propuestaId, 'asignacion', null, c.id, advertido, null);
        return aRespuesta(nueva, advertido ? [c.detalle] : []);
      });
      if (propuesta.estado === 'recibida') propuesta.estado = 'en_evaluacion';
      return creadas;
    },

    async reasignar(asignacionId, { comiteEvaluadorId, motivo, confirmarConflicto = false }) {
      await esperar(demora);
      const actual = asignaciones.find((a) => a.asignacionId === Number(asignacionId));
      if (!actual) throw errorApi(404, `No se encontró la asignación de evaluación con ID: ${asignacionId}`, 'RECURSO_NO_ENCONTRADO');
      const propuesta = buscarPropuesta(actual.propuestaId);
      validarAsignable(propuesta);
      if (actual.estado === 'completada') {
        throw errorApi(409, 'No es posible reasignar: el evaluador ya registró calificaciones para esta propuesta.', 'OPERACION_NO_PERMITIDA');
      }
      const nuevoId = Number(comiteEvaluadorId);
      if (actual.comiteEvaluadorId === nuevoId) {
        throw errorApi(400, 'La propuesta ya está asignada a ese evaluador. Elija otro evaluador.', 'SOLICITUD_INVALIDA');
      }
      if (!evaluador(nuevoId)) throw errorApi(404, `No se encontró el evaluador del comité con ID: ${nuevoId}`, 'RECURSO_NO_ENCONTRADO');
      if (asignaciones.some((a) => a.propuestaId === propuesta.propuestaId && a.comiteEvaluadorId === nuevoId)) {
        throw errorApi(409, `La propuesta '${propuesta.titulo}' ya está asignada a ${nombreEvaluador(nuevoId)}.`, 'ASIGNACION_DUPLICADA');
      }
      const c = conflicto(nuevoId, propuesta);
      if (c.nivel === NIVELES_CONFLICTO.BLOQUEANTE) throw errorApi(409, c.detalle, 'CONFLICTO_INTERES');
      const advertido = c.nivel === NIVELES_CONFLICTO.ADVERTENCIA;
      exigirConfirmacion(advertido ? [c.detalle] : [], confirmarConflicto);

      const anterior = actual.comiteEvaluadorId;
      const actualizada = { ...actual, comiteEvaluadorId: nuevoId, estado: 'pendiente', fechaAsignacion: fechaActual() };
      asignaciones = asignaciones.map((a) => (a.asignacionId === actual.asignacionId ? actualizada : a));
      registrarHistorial(actual.asignacionId, propuesta.propuestaId, 'reasignacion', anterior, nuevoId, advertido, motivo?.trim());
      return aRespuesta(actualizada, advertido ? [c.detalle] : []);
    },

    async miBandeja(incluirCompletadas = false) {
      await esperar(demora);
      return asignaciones
        .filter((a) => a.comiteEvaluadorId === 3 && (incluirCompletadas || a.estado !== 'completada'))
        .map((a) => aRespuesta(a));
    },
  };
}

/** API que falla al cargar, para la story de error. */
export const asignacionesApiMockConError = {
  listarPropuestasConvocatoria: () => Promise.reject(errorApi(500, 'Error interno')),
  listarAsignaciones: () => Promise.reject(errorApi(500, 'Error interno')),
  listarEvaluadoresDisponibles: () => Promise.reject(errorApi(500, 'Error interno')),
  listarHistorial: () => Promise.reject(errorApi(500, 'Error interno')),
  asignarEvaluadores: () => Promise.reject(errorApi(500, 'Error interno')),
  reasignar: () => Promise.reject(errorApi(500, 'Error interno')),
  miBandeja: () => Promise.reject(errorApi(500, 'Error interno')),
};
