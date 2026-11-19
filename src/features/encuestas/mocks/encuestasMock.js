/**
 * @file encuestasMock.js
 * @description API simulada de encuestas de satisfacción (HU-25), solo para Storybook y pruebas. Imita las reglas de
 * `EncuestaService` y `RespuestaEncuestaService` del backend sin servidor: borrador → publicada → cerrada,
 * habilitación por asistencia, anónimas o identificadas, una respuesta por persona y resultados consolidados.
 * Al guardar y publicar aplica las mismas validaciones (actividad cancelada o por programar, fecha de cierre vencida,
 * sin preguntas, evento en configuración) y devuelve los mismos códigos de error.
 * @module features/encuestas/mocks/encuestasMock
 */

const espera = (ms = 200) => new Promise((r) => setTimeout(r, ms));

/** Error con la forma de axios. */
function errorApi(status, codigo, message, erroresValidacion) {
  const err = new Error(message);
  err.response = { status, data: { status, codigo, message, ...(erroresValidacion ? { erroresValidacion } : {}) } };
  return err;
}

const copia = (o) => JSON.parse(JSON.stringify(o));
const ahoraIso = () => new Date().toISOString().slice(0, 19);

/** Actividades de ejemplo del evento 1. */
export function actividadesEjemplo() {
  return [
    { id: 201, eventoId: 1, nombre: 'Taller de Spring Boot', fecha: '2026-11-20', horaInicio: '09:00', estado: 'programada' },
    { id: 202, eventoId: 1, nombre: 'Conferencia: IA en la educación', fecha: '2026-11-20', horaInicio: '14:00', estado: 'programada' },
    { id: 203, eventoId: 1, nombre: 'Mesa redonda (cancelada)', fecha: '2026-11-21', horaInicio: '10:00', estado: 'cancelada' },
  ];
}

/** Encuestas de ejemplo: una publicada de actividad (anónima, con respuestas), una general en borrador. */
export function encuestasEjemplo() {
  return [
    {
      encuestaId: 7,
      eventoId: 1,
      eventoNombre: 'Semana de Ingeniería de Sistemas',
      actividadId: 201,
      actividadNombre: 'Taller de Spring Boot',
      ambito: 'actividad',
      titulo: '¿Cómo te pareció el taller?',
      descripcion: 'Tus respuestas nos ayudan a mejorar los próximos talleres.',
      anonima: true,
      estado: 'publicada',
      fechaCreacion: '2026-11-19T08:00:00',
      fechaPublicacion: '2026-11-20T12:00:00',
      fechaCierre: '2026-12-15T23:59:00',
      totalHabilitados: 24,
      preguntas: [
        { preguntaId: 40, orden: 1, texto: '¿Qué tan satisfecho quedaste con el contenido?', tipoRespuesta: 'escala', obligatoria: true, escalaMinima: 1, escalaMaxima: 5 },
        {
          preguntaId: 41, orden: 2, texto: '¿Recomendarías el taller?', tipoRespuesta: 'opcion', obligatoria: true,
          opciones: [
            { opcionId: 410, texto: 'Sí', orden: 1 },
            { opcionId: 411, texto: 'No', orden: 2 },
            { opcionId: 412, texto: 'Tal vez', orden: 3 },
          ],
        },
        { preguntaId: 42, orden: 3, texto: '¿Qué mejorarías?', tipoRespuesta: 'texto', obligatoria: false },
      ],
    },
    {
      encuestaId: 8,
      eventoId: 1,
      eventoNombre: 'Semana de Ingeniería de Sistemas',
      actividadId: null,
      actividadNombre: null,
      ambito: 'evento',
      titulo: 'Encuesta general del evento',
      descripcion: null,
      anonima: false,
      estado: 'borrador',
      fechaCreacion: '2026-11-19T09:00:00',
      fechaPublicacion: null,
      fechaCierre: null,
      totalHabilitados: 60,
      preguntas: [
        { preguntaId: 50, orden: 1, texto: 'Organización general del evento', tipoRespuesta: 'escala', obligatoria: true, escalaMinima: 0, escalaMaxima: 10 },
      ],
    },
  ];
}

/** Respuestas de ejemplo de la encuesta 7 (anónimas): [personaId, {preguntaId: valor}]. */
function respuestasEjemplo() {
  return [
    { encuestaId: 7, personaId: 101, nombre: null, fecha: '2026-11-20T16:10:00', valores: { 40: 5, 41: 410, 42: 'Más ejercicios prácticos.' } },
    { encuestaId: 7, personaId: 102, nombre: null, fecha: '2026-11-20T17:30:00', valores: { 40: 4, 41: 410 } },
    { encuestaId: 7, personaId: 103, nombre: null, fecha: '2026-11-21T08:05:00', valores: { 40: 4, 41: 412, 42: 'El tiempo se quedó corto.' } },
    { encuestaId: 7, personaId: 104, nombre: null, fecha: '2026-11-21T09:45:00', valores: { 40: 2, 41: 411 } },
  ];
}

/**
 * Crea una API simulada.
 * @param {Object} [opciones]
 * @param {Array} [opciones.encuestas] - Encuestas iniciales (forma EncuestaResponse).
 * @param {Array} [opciones.actividades] - Actividades del evento.
 * @param {Array} [opciones.respuestas] - Respuestas iniciales.
 * @param {string} [opciones.estadoEvento='en_ejecucion'] - Estado del evento (para publicar).
 * @param {number[]} [opciones.asistio] - Encuestas a las que el participante actual asistió (Criterio 3).
 * @param {number[]} [opciones.respondidas] - Encuestas que el participante actual ya respondió.
 * @param {boolean} [opciones.falla] - Si es true, todas las llamadas fallan (para ver el estado de error).
 */
export function crearEncuestasApiMock(opciones = {}) {
  const estado = {
    encuestas: copia(opciones.encuestas || encuestasEjemplo()),
    actividades: copia(opciones.actividades || actividadesEjemplo()),
    respuestas: copia(opciones.respuestas || respuestasEjemplo()),
    estadoEvento: opciones.estadoEvento || 'en_ejecucion',
    asistio: new Set(opciones.asistio || [7, 8]),
    participanteId: 999,
  };
  (opciones.respondidas || []).forEach((id) => {
    estado.respuestas.push({ encuestaId: id, personaId: estado.participanteId, nombre: 'Ana Pérez', fecha: '2026-11-21T10:00:00', valores: {} });
  });
  let siguienteId = 100;
  let siguienteHijo = 1000;

  const fallar = async () => {
    await espera();
    if (opciones.falla) {
      const err = new Error('Network Error');
      err.request = {};
      throw err;
    }
  };

  const buscar = (encuestaId) => {
    const e = estado.encuestas.find((x) => x.encuestaId === Number(encuestaId));
    if (!e) throw errorApi(404, 'RECURSO_NO_ENCONTRADO', `No se encontró la encuesta con ID ${encuestaId} en este evento.`);
    return e;
  };
  const respuestasDe = (encuestaId) => estado.respuestas.filter((r) => r.encuestaId === Number(encuestaId));
  const recibe = (e) => e.estado === 'publicada' && (!e.fechaCierre || new Date(e.fechaCierre) > new Date());
  const conTotales = (e) => ({ ...copia(e), recibeRespuestas: recibe(e), totalRespuestas: respuestasDe(e.encuestaId).length });

  /** Construye la encuesta a partir de la solicitud, con las validaciones del backend. */
  const aplicar = (e, solicitud) => {
    const errores = {};
    let actividad = null;
    if (solicitud.actividadId) {
      actividad = estado.actividades.find((a) => a.id === Number(solicitud.actividadId));
      if (!actividad) throw errorApi(404, 'RECURSO_NO_ENCONTRADO', `No se encontró la actividad con ID ${solicitud.actividadId} en este evento.`);
      if (actividad.estado === 'cancelada' || actividad.estado === 'por_programar') {
        errores.actividadId = `La actividad «${actividad.nombre}» ${actividad.estado === 'cancelada' ? 'está cancelada' : 'aún no está programada'}; no se le puede aplicar una encuesta.`;
      }
    }
    if (solicitud.fechaCierre && new Date(solicitud.fechaCierre) <= new Date()) {
      errores.fechaCierre = 'La fecha de cierre debe ser posterior a la fecha y hora actual.';
    }
    (solicitud.preguntas || []).forEach((p, i) => {
      if (p.tipoRespuesta === 'opcion' && (p.opciones || []).length < 2) {
        errores[`preguntas[${i}].opciones`] = 'Una pregunta de opción necesita entre 2 y 20 opciones.';
      }
    });
    if (Object.keys(errores).length) {
      throw errorApi(400, 'ENCUESTA_CONFIGURACION_INVALIDA', 'Revise la configuración de la encuesta.', errores);
    }
    Object.assign(e, {
      titulo: solicitud.titulo,
      descripcion: solicitud.descripcion,
      actividadId: actividad ? actividad.id : null,
      actividadNombre: actividad ? actividad.nombre : null,
      ambito: actividad ? 'actividad' : 'evento',
      anonima: Boolean(solicitud.anonima),
      fechaCierre: solicitud.fechaCierre,
      totalHabilitados: actividad ? 24 : 60,
      preguntas: (solicitud.preguntas || []).map((p, i) => ({
        preguntaId: siguienteHijo++,
        orden: i + 1,
        texto: p.texto,
        tipoRespuesta: p.tipoRespuesta,
        obligatoria: p.obligatoria !== false,
        ...(p.tipoRespuesta === 'escala' ? { escalaMinima: p.escalaMinima ?? 1, escalaMaxima: p.escalaMaxima ?? 5 } : {}),
        ...(p.tipoRespuesta === 'opcion'
          ? { opciones: p.opciones.map((t, j) => ({ opcionId: siguienteHijo++, texto: t, orden: j + 1 })) }
          : {}),
      })),
    });
    return e;
  };

  const resultados = (e) => {
    const lista = respuestasDe(e.encuestaId);
    const total = lista.length;
    const pct = (n, d) => (d > 0 ? Math.round((n * 1000) / d) / 10 : 0);
    return {
      encuestaId: e.encuestaId,
      titulo: e.titulo,
      eventoId: e.eventoId,
      eventoNombre: e.eventoNombre,
      actividadId: e.actividadId,
      actividadNombre: e.actividadNombre,
      ambito: e.ambito,
      anonima: e.anonima,
      estado: e.estado,
      totalHabilitados: e.totalHabilitados,
      totalRespuestas: total,
      tasaRespuesta: e.totalHabilitados > 0 ? pct(total, e.totalHabilitados) : null,
      fechaConsulta: ahoraIso(),
      preguntas: e.preguntas.map((p) => {
        const valores = lista.map((r) => r.valores[p.preguntaId]).filter((v) => v !== undefined && v !== '');
        const base = {
          preguntaId: p.preguntaId, orden: p.orden, texto: p.texto, tipoRespuesta: p.tipoRespuesta,
          obligatoria: p.obligatoria, totalRespuestas: valores.length, omitidas: total - valores.length,
        };
        if (p.tipoRespuesta === 'escala') {
          const distribucion = [];
          for (let v = p.escalaMinima; v <= p.escalaMaxima; v += 1) {
            const c = valores.filter((x) => Number(x) === v).length;
            distribucion.push({ valor: v, etiqueta: String(v), cantidad: c, porcentaje: pct(c, valores.length) });
          }
          const suma = valores.reduce((s, v) => s + Number(v), 0);
          return { ...base, escalaMinima: p.escalaMinima, escalaMaxima: p.escalaMaxima, promedio: valores.length ? Math.round((suma * 100) / valores.length) / 100 : null, distribucion };
        }
        if (p.tipoRespuesta === 'opcion') {
          return {
            ...base,
            distribucion: p.opciones.map((o) => {
              const c = valores.filter((x) => Number(x) === o.opcionId).length;
              return { opcionId: o.opcionId, etiqueta: o.texto, cantidad: c, porcentaje: pct(c, valores.length) };
            }),
          };
        }
        return {
          ...base,
          respuestasTexto: lista
            .filter((r) => r.valores[p.preguntaId])
            .map((r) => ({ texto: r.valores[p.preguntaId], fecha: r.fecha.slice(0, 10), ...(e.anonima ? {} : { participanteNombre: r.nombre || 'Participante' }) })),
        };
      }),
    };
  };

  const vistaParticipante = (e, conPreguntas) => {
    const mia = respuestasDe(e.encuestaId).find((r) => r.personaId === estado.participanteId);
    return {
      encuestaId: e.encuestaId, eventoId: e.eventoId, eventoNombre: e.eventoNombre, actividadId: e.actividadId,
      actividadNombre: e.actividadNombre, ambito: e.ambito, titulo: e.titulo, descripcion: e.descripcion,
      anonima: e.anonima, estado: e.estado, fechaCierre: e.fechaCierre,
      recibeRespuestas: recibe(e) && !mia, respondida: Boolean(mia), fechaRespuesta: mia ? mia.fecha : null,
      totalPreguntas: e.preguntas.length, ...(conPreguntas ? { preguntas: copia(e.preguntas) } : {}),
    };
  };

  const noHabilitada = (e) =>
    errorApi(403, 'ENCUESTA_NO_HABILITADA', e.actividadId
      ? `La encuesta solo está habilitada para quienes asistieron a la actividad «${e.actividadNombre}», y no tienes asistencia registrada en ella.`
      : `La encuesta solo está habilitada para quienes asistieron al evento «${e.eventoNombre}», y no tienes asistencia registrada en él.`);

  return {
    /** Para que las pruebas lean el estado interno. */
    _estado: estado,

    async listarEncuestas() {
      await fallar();
      return estado.encuestas.map(conTotales);
    },
    async crearEncuesta(eventoId, solicitud) {
      await fallar();
      const e = aplicar({ encuestaId: siguienteId++, eventoId: Number(eventoId), eventoNombre: 'Semana de Ingeniería de Sistemas', estado: 'borrador', fechaCreacion: ahoraIso(), fechaPublicacion: null }, solicitud);
      estado.encuestas.unshift(e);
      return conTotales(e);
    },
    async actualizarEncuesta(eventoId, encuestaId, solicitud) {
      await fallar();
      const e = buscar(encuestaId);
      if (e.estado !== 'borrador') throw errorApi(409, 'ENCUESTA_NO_EDITABLE', `La encuesta «${e.titulo}» ya fue ${e.estado} y no se puede modificar.`);
      aplicar(e, solicitud);
      return conTotales(e);
    },
    async eliminarEncuesta(eventoId, encuestaId) {
      await fallar();
      const e = buscar(encuestaId);
      const n = respuestasDe(encuestaId).length;
      if (n > 0) throw errorApi(409, 'ENCUESTA_NO_EDITABLE', `La encuesta «${e.titulo}» ya tiene ${n} respuesta(s) y no se puede eliminar. Puede cerrarla para que no reciba más.`);
      estado.encuestas = estado.encuestas.filter((x) => x !== e);
    },
    async publicarEncuesta(eventoId, encuestaId) {
      await fallar();
      const e = buscar(encuestaId);
      if (e.estado !== 'borrador') throw errorApi(409, 'ENCUESTA_ESTADO_INVALIDO', `La encuesta «${e.titulo}» ya está ${e.estado}.`);
      if (estado.estadoEvento === 'en_configuracion') {
        throw errorApi(409, 'EVENTO_NO_DISPONIBLE', 'El evento está en configuración: todavía nadie ha podido asistir. Publique la encuesta cuando el evento esté habilitado.');
      }
      const actividad = e.actividadId ? estado.actividades.find((a) => a.id === e.actividadId) : null;
      if (actividad && (actividad.estado === 'cancelada' || actividad.estado === 'por_programar')) {
        throw errorApi(409, 'ACTIVIDAD_NO_DISPONIBLE', `La actividad «${actividad.nombre}» ${actividad.estado === 'cancelada' ? 'está cancelada' : 'aún no está programada'}; no se puede publicar su encuesta.`);
      }
      const faltantes = {};
      if (e.preguntas.length === 0) faltantes.preguntas = 'Agregue al menos una pregunta antes de publicar.';
      if (e.fechaCierre && new Date(e.fechaCierre) <= new Date()) {
        faltantes.fechaCierre = 'La fecha de cierre ya pasó. Cámbiela o déjela vacía.';
      }
      if (Object.keys(faltantes).length) {
        throw errorApi(409, 'ENCUESTA_INCOMPLETA', 'La encuesta no se puede publicar todavía.', faltantes);
      }
      e.estado = 'publicada';
      e.fechaPublicacion = ahoraIso();
      return conTotales(e);
    },
    async cerrarEncuesta(eventoId, encuestaId) {
      await fallar();
      const e = buscar(encuestaId);
      if (e.estado !== 'publicada') throw errorApi(409, 'ENCUESTA_ESTADO_INVALIDO', `La encuesta «${e.titulo}» ya está cerrada.`);
      e.estado = 'cerrada';
      if (!e.fechaCierre || new Date(e.fechaCierre) > new Date()) e.fechaCierre = ahoraIso();
      return conTotales(e);
    },
    async obtenerResultados(eventoId, encuestaId) {
      await fallar();
      return resultados(buscar(encuestaId));
    },
    async listarRespuestasPorParticipante(eventoId, encuestaId) {
      await fallar();
      const e = buscar(encuestaId);
      if (e.anonima) throw errorApi(409, 'ENCUESTA_ANONIMA', `La encuesta «${e.titulo}» es anónima: sus respuestas no están asociadas a los participantes.`);
      return respuestasDe(encuestaId).map((r) => ({
        personaId: r.personaId,
        participanteNombre: r.nombre || 'Participante',
        numeroDocumento: String(1090000000 + r.personaId),
        correo: `participante${r.personaId}@ufps.edu.co`,
        fechaRespuesta: r.fecha,
        respuestas: e.preguntas
          .filter((p) => r.valores[p.preguntaId] !== undefined)
          .map((p) => ({
            preguntaId: p.preguntaId,
            orden: p.orden,
            pregunta: p.texto,
            respuesta: p.tipoRespuesta === 'opcion'
              ? p.opciones.find((o) => o.opcionId === r.valores[p.preguntaId])?.texto
              : String(r.valores[p.preguntaId]),
          })),
      }));
    },
    async listarActividadesEvento() {
      await fallar();
      return copia(estado.actividades);
    },

    async listarMisEncuestas() {
      await fallar();
      return estado.encuestas
        .filter((e) => e.estado !== 'borrador' && estado.asistio.has(e.encuestaId))
        .map((e) => vistaParticipante(e, false))
        .filter((e) => e.recibeRespuestas || e.respondida);
    },
    async obtenerFormulario(encuestaId) {
      await fallar();
      const e = buscar(encuestaId);
      if (e.estado === 'borrador') throw errorApi(404, 'RECURSO_NO_ENCONTRADO', `No se encontró la encuesta con ID ${encuestaId}.`);
      if (!estado.asistio.has(e.encuestaId)) throw noHabilitada(e);
      return vistaParticipante(e, true);
    },
    async responderEncuesta(encuestaId, respuestas) {
      await fallar();
      const e = buscar(encuestaId);
      if (e.estado === 'borrador') throw errorApi(404, 'RECURSO_NO_ENCONTRADO', `No se encontró la encuesta con ID ${encuestaId}.`);
      if (!estado.asistio.has(e.encuestaId)) throw noHabilitada(e);
      if (!recibe(e)) throw errorApi(409, 'ENCUESTA_CERRADA', `La encuesta «${e.titulo}» está cerrada; ya no recibe respuestas.`);
      if (respuestasDe(encuestaId).some((r) => r.personaId === estado.participanteId)) {
        throw errorApi(409, 'ENCUESTA_YA_RESPONDIDA', `Ya respondiste la encuesta «${e.titulo}». No se registró de nuevo.`);
      }
      const errores = {};
      e.preguntas.forEach((p) => {
        const r = respuestas.find((x) => x.preguntaId === p.preguntaId);
        if (!r && p.obligatoria) errores[`pregunta_${p.preguntaId}`] = 'Esta pregunta es obligatoria.';
      });
      if (Object.keys(errores).length) throw errorApi(400, 'RESPUESTAS_INVALIDAS', 'Revise sus respuestas antes de enviar la encuesta.', errores);
      const valores = {};
      respuestas.forEach((r) => {
        valores[r.preguntaId] = r.valorEscala ?? r.opcionId ?? r.texto;
      });
      const fecha = ahoraIso();
      estado.respuestas.push({ encuestaId: e.encuestaId, personaId: estado.participanteId, nombre: 'Ana Pérez', fecha, valores });
      return {
        encuestaId: e.encuestaId,
        titulo: e.titulo,
        anonima: e.anonima,
        preguntasRespondidas: respuestas.length,
        fechaRespuesta: fecha,
        mensaje: e.anonima
          ? 'Gracias por responder. Tus respuestas se guardaron de forma anónima.'
          : 'Gracias por responder. Tus respuestas quedaron registradas.',
      };
    },
  };
}
