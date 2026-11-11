/**
 * @file observacionesMock.js
 * @description API simulada de observaciones y versión definitiva (HU-19), solo para Storybook y pruebas.
 * Imita las reglas de `ObservacionPropuestaService` del backend sin servidor.
 * @module features/observaciones/mocks/observacionesMock
 */

const espera = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** Error con la forma de axios. */
function errorApi(status, codigo, message, extra = {}) {
  const err = new Error(message);
  err.response = { status, data: { status, codigo, message, ...extra } };
  return err;
}

/** Calcula el estado que devuelve el backend para una observación. */
function estadoDe(o) {
  if (o.resuelto) return 'resuelta';
  if (!o.requiereAjuste) return 'comentario';
  return o.versionAtencionNumero != null ? 'atendida' : 'pendiente';
}

/** Observaciones de ejemplo sobre la versión 1: un ajuste ya atendido en la v2, uno pendiente y un comentario. */
export function observacionesEjemplo() {
  return [
    {
      id: 60,
      descripcion: 'Ampliar la sección de metodología indicando el tamaño y la selección de la muestra.',
      requiereAjuste: true,
      numeroVersion: 1,
      versionAtencionNumero: 2,
      resuelto: false,
      registradaPor: 'Elena Ruiz',
      registradaPorEvaluador: true,
      fecha: '2026-11-03T10:15:00',
    },
    {
      id: 61,
      descripcion: 'Actualizar las referencias: la mayoría son anteriores a 2015.',
      requiereAjuste: true,
      numeroVersion: 2,
      versionAtencionNumero: null,
      resuelto: false,
      registradaPor: 'María Rodríguez',
      registradaPorEvaluador: false,
      fecha: '2026-11-06T16:40:00',
    },
    {
      id: 62,
      descripcion: 'El marco teórico está bien planteado.',
      requiereAjuste: false,
      numeroVersion: 1,
      versionAtencionNumero: null,
      resuelto: false,
      registradaPor: 'Elena Ruiz',
      registradaPorEvaluador: true,
      fecha: '2026-11-03T10:15:00',
    },
  ];
}

/**
 * Crea una API simulada con estado en memoria.
 * @param {Object} [opciones]
 * @param {string} [opciones.estado='ajustes'] - Estado de la propuesta.
 * @param {number} [opciones.versionActual=2]
 * @param {number|null} [opciones.versionDefinitiva=null]
 * @param {Array<Object>} [opciones.observaciones] - Observaciones iniciales.
 * @param {boolean} [opciones.falla=false] - Si es true, la consulta falla (para ver el estado de error).
 * @returns {{ listarObservaciones: Function, registrarObservaciones: Function, resolverObservacion: Function,
 *   aprobarVersionDefinitiva: Function, subirVersion: Function }}
 */
export function crearObservacionesApiMock({
  estado = 'ajustes',
  versionActual = 2,
  versionDefinitiva = null,
  observaciones = observacionesEjemplo(),
  falla = false,
} = {}) {
  const db = {
    estado,
    versionActual,
    versionDefinitiva,
    fechaDefinitiva: versionDefinitiva != null ? '2026-11-08T09:00:00' : null,
    observaciones: observaciones.map((o) => ({ ...o })),
    siguienteId: 100,
  };

  const conEstado = (o) => ({ ...o, estado: estadoDe(o) });
  const pendientes = () => db.observaciones.filter((o) => o.requiereAjuste && !o.resuelto);

  const motivo = () => {
    if (db.estado === 'rechazada') return 'La propuesta fue rechazada; no se puede aprobar su versión definitiva.';
    if (!['aprobada', 'ajustes'].includes(db.estado)) {
      return 'La propuesta aún no ha sido evaluada y clasificada; no se puede aprobar su versión definitiva.';
    }
    if (db.versionDefinitiva === db.versionActual) return `La versión ${db.versionActual} ya es la versión definitiva.`;
    const p = pendientes();
    if (p.length) {
      const sinAtender = p.filter((o) => o.versionAtencionNumero == null).length;
      return `No se puede aprobar la versión definitiva: la propuesta tiene ${p.length} ajuste(s) sin resolver (${
        sinAtender ? `${sinAtender} aún sin una versión del autor que los atienda` : 'todos atendidos por el autor, pendientes de revisión'
      }).`;
    }
    if (db.estado === 'ajustes' && !db.observaciones.some((o) => o.requiereAjuste)) {
      return 'No se puede aprobar la versión definitiva: la propuesta fue clasificada como aprobada con ajustes y todavía no se han registrado los ajustes requeridos.';
    }
    return null;
  };

  const resumen = (propuestaId) => {
    const m = motivo();
    const p = pendientes();
    return {
      propuestaId: Number(propuestaId),
      titulo: 'Analítica de aprendizaje en cursos de programación',
      estadoPropuesta: db.estado,
      versionActual: db.versionActual,
      versionDefinitiva: db.versionDefinitiva,
      fechaDefinitiva: db.fechaDefinitiva,
      ajustesPendientes: p.length,
      ajustesPorAtender: p.filter((o) => o.versionAtencionNumero == null).length,
      puedeAprobarse: m == null,
      motivoNoAprobable: m,
      observaciones: db.observaciones.map(conEstado),
    };
  };

  return {
    async listarObservaciones(propuestaId) {
      await espera();
      if (falla) throw errorApi(500, 'ERROR_INTERNO', 'No se pudieron cargar las observaciones.');
      return resumen(propuestaId);
    },

    async registrarObservaciones(propuestaId, nuevas) {
      await espera();
      if (db.versionDefinitiva != null) {
        throw errorApi(409, 'PROPUESTA_BLOQUEADA', 'La propuesta ya tiene versión definitiva aprobada y no admite nuevas observaciones.');
      }
      if (db.estado === 'aprobada') {
        throw errorApi(409, 'OPERACION_NO_PERMITIDA', 'La propuesta fue aceptada sin modificaciones y no requiere ajustes; su versión definitiva se puede aprobar directamente.');
      }
      nuevas.forEach((n) => {
        db.observaciones.push({
          id: db.siguienteId++,
          descripcion: n.descripcion.trim(),
          requiereAjuste: n.requiereAjuste !== false,
          numeroVersion: db.versionActual,
          versionAtencionNumero: null,
          resuelto: false,
          registradaPor: 'Elena Ruiz',
          registradaPorEvaluador: true,
          fecha: new Date().toISOString(),
        });
      });
      return resumen(propuestaId);
    },

    async resolverObservacion(propuestaId, observacionId) {
      await espera();
      const o = db.observaciones.find((x) => x.id === observacionId);
      if (!o) throw errorApi(404, 'RECURSO_NO_ENCONTRADO', 'No se encontró la observación.');
      if (o.resuelto) throw errorApi(409, 'OPERACION_NO_PERMITIDA', 'La observación ya fue resuelta.');
      if (o.requiereAjuste && o.versionAtencionNumero == null) {
        throw errorApi(409, 'OPERACION_NO_PERMITIDA', 'El autor aún no ha subido una versión que atienda este ajuste; no se puede dar por resuelto.');
      }
      Object.assign(o, { resuelto: true, resueltaPor: 'María Rodríguez', fechaResolucion: new Date().toISOString() });
      return conEstado(o);
    },

    async aprobarVersionDefinitiva(propuestaId) {
      await espera();
      const m = motivo();
      if (m) {
        const p = pendientes();
        const codigo = p.length ? 'OBSERVACIONES_PENDIENTES' : db.estado === 'ajustes' ? 'AJUSTES_SIN_REGISTRAR' : 'OPERACION_NO_PERMITIDA';
        throw errorApi(409, codigo, m, { pendientes: p.map(conEstado) });
      }
      const anterior = db.versionDefinitiva;
      db.versionDefinitiva = db.versionActual;
      db.fechaDefinitiva = new Date().toISOString();
      db.estado = 'aprobada';
      return {
        propuestaId: Number(propuestaId),
        titulo: 'Analítica de aprendizaje en cursos de programación',
        estadoPropuesta: 'aprobada',
        numeroVersion: db.versionActual,
        versionDefinitivaAnterior: anterior,
        fechaDefinitiva: db.fechaDefinitiva,
        aprobadaPor: 'María Rodríguez',
        ajustesResueltos: db.observaciones.filter((o) => o.requiereAjuste && o.resuelto).length,
        mensaje: `La versión ${db.versionActual} quedó aprobada como definitiva.`,
      };
    },

    /** Simula que el autor sube una versión nueva: los ajustes sin resolver quedan vinculados a ella. */
    subirVersion() {
      db.versionActual += 1;
      db.observaciones.forEach((o) => {
        if (o.requiereAjuste && !o.resuelto) o.versionAtencionNumero = db.versionActual;
      });
    },
  };
}
