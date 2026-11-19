/**
 * @file encuestaUtils.js
 * @description Reglas y textos de las encuestas de satisfacción (HU-25: RF46, CU-22). Replican las validaciones de
 * `EncuestaService` y `RespuestaEncuestaService` del backend para avisar antes de enviar; el backend sigue siendo
 * quien decide.
 * @module features/encuestas/encuestaUtils
 */

/** Límites (iguales que el backend). */
export const MAX_TITULO = 150;
export const MAX_DESCRIPCION = 2000;
export const MAX_PREGUNTAS = 50;
export const MAX_TEXTO_PREGUNTA = 1000;
export const MIN_OPCIONES = 2;
export const MAX_OPCIONES = 20;
export const MAX_TEXTO_OPCION = 200;
export const MAX_TEXTO_RESPUESTA = 2000;
export const ESCALA_MIN_PERMITIDA = 0;
export const ESCALA_MAX_PERMITIDA = 10;
export const ESCALA_MINIMA_POR_DEFECTO = 1;
export const ESCALA_MAXIMA_POR_DEFECTO = 5;

/**
 * Valor del selector «Se aplica a» para la encuesta general del evento. No es '' porque el componente `Select`
 * reserva '' para su opción deshabilitada «Seleccione una opción».
 */
export const ALCANCE_EVENTO = 'evento';

/** Tipos de pregunta (CHECK `preguntas_encuesta.tipo_respuesta`). */
export const TIPOS_PREGUNTA = {
  escala: { etiqueta: 'Escala', descripcion: 'Un valor dentro de un rango, por ejemplo de 1 a 5.' },
  opcion: { etiqueta: 'Opción única', descripcion: 'Una opción de una lista.' },
  texto: { etiqueta: 'Texto libre', descripcion: 'Una respuesta escrita.' },
};

/** Estados de una encuesta (CHECK `encuestas_estado_check`). */
export const ESTADOS_ENCUESTA = {
  borrador: { etiqueta: 'Borrador', clases: 'bg-white text-ink-600 border-field-border' },
  publicada: { etiqueta: 'Publicada', clases: 'bg-brand-100 text-brand-700 border-brand-600' },
  cerrada: { etiqueta: 'Cerrada', clases: 'bg-surface-muted text-ink-900 border-ink-600' },
};

/** Títulos de los errores de negocio del backend. */
const TITULOS_ERROR = {
  ENCUESTA_CONFIGURACION_INVALIDA: 'Revisa la configuración de la encuesta',
  ENCUESTA_NO_EDITABLE: 'La encuesta ya no se puede modificar',
  ENCUESTA_ESTADO_INVALIDO: 'La encuesta no está en el estado esperado',
  ENCUESTA_INCOMPLETA: 'Falta algo para publicar',
  EVENTO_NO_DISPONIBLE: 'El evento todavía no admite encuestas',
  ACTIVIDAD_NO_DISPONIBLE: 'La actividad no está disponible',
  ENCUESTA_NO_HABILITADA: 'Encuesta no habilitada',
  ENCUESTA_CERRADA: 'La encuesta está cerrada',
  ENCUESTA_YA_RESPONDIDA: 'Ya respondiste esta encuesta',
  RESPUESTAS_INVALIDAS: 'Revisa tus respuestas',
  ENCUESTA_ANONIMA: 'Encuesta anónima',
  VALIDACION_FALLIDA: 'Revisa los datos',
};

const MENSAJE_POR_ESTADO = {
  400: 'Los datos enviados no son válidos.',
  403: 'Tu usuario no tiene permiso para esta acción.',
  404: 'No se encontró la encuesta. Puede que haya sido eliminada.',
  409: 'La operación no se pudo completar por el estado actual de la encuesta.',
  500: 'El servidor tuvo un problema. Intenta de nuevo en unos minutos.',
};

// ──────────────────────────────────────────────────────────────────────────────
// Textos
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Etiqueta y clases del estado de una encuesta.
 * @param {string} estado
 */
export function infoEstadoEncuesta(estado) {
  return ESTADOS_ENCUESTA[estado] || { etiqueta: estado || 'Sin estado', clases: 'bg-white text-ink-600 border-border' };
}

/**
 * A qué se aplica la encuesta.
 * @param {{ actividadId?: number|null, actividadNombre?: string|null }} encuesta
 * @returns {string}
 */
export function textoAlcance(encuesta) {
  if (encuesta?.actividadId) return `Actividad: ${encuesta.actividadNombre || `#${encuesta.actividadId}`}`;
  return 'Evento en general';
}

/**
 * Pluraliza una cantidad: `plural(1, 'respuesta')` → "1 respuesta".
 * @param {number} n
 * @param {string} singular
 * @param {string} [pluralTexto]
 */
export function plural(n, singular, pluralTexto = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

/**
 * Fecha y hora legibles (dd/mm/aaaa hh:mm) de un valor ISO del backend.
 * @param {string|null|undefined} valor
 * @returns {string}
 */
export function formatearFechaHora(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

/**
 * Fecha (dd/mm/aaaa) de un valor ISO o AAAA-MM-DD.
 * @param {string|null|undefined} valor
 */
export function formatearFecha(valor) {
  if (!valor) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(valor);
}

/**
 * Valor para un `<input type="datetime-local">` (AAAA-MM-DDTHH:mm) a partir de lo que envía el backend.
 * @param {string|null|undefined} valor
 */
export function aValorFechaLocal(valor) {
  if (!valor) return '';
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(String(valor));
  return m ? `${m[1]}T${m[2]}` : '';
}

/**
 * Valor para el backend (LocalDateTime con segundos) a partir de un `datetime-local`, o null si está vacío.
 * @param {string} valor
 */
export function aFechaBackend(valor) {
  if (!valor) return null;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor) ? `${valor}:00` : valor;
}

/**
 * Porcentaje legible (35,5 %).
 * @param {number|string|null|undefined} valor
 */
export function formatearPorcentaje(valor) {
  if (valor == null || valor === '') return '—';
  const n = Number(valor);
  if (Number.isNaN(n)) return '—';
  return `${n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} %`;
}

/**
 * Promedio legible con dos decimales (4,25).
 * @param {number|string|null|undefined} valor
 */
export function formatearPromedio(valor) {
  if (valor == null || valor === '') return '—';
  const n = Number(valor);
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ──────────────────────────────────────────────────────────────────────────────
// Organizador: acciones permitidas
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Qué puede hacer el organizador con la encuesta, con el motivo cuando no se permite. Replica las reglas del backend.
 * @param {{ estado: string, totalRespuestas?: number, preguntas?: Array, fechaCierre?: string|null }} encuesta
 * @param {{ estado?: string }} [evento]
 * @param {Date} [ahora=new Date()]
 * @returns {{ editar: {permitido:boolean,motivo:string|null}, publicar: {permitido:boolean,motivo:string|null},
 *   cerrar: {permitido:boolean,motivo:string|null}, eliminar: {permitido:boolean,motivo:string|null},
 *   resultados: {permitido:boolean,motivo:string|null} }}
 */
export function accionesEncuesta(encuesta, evento, ahora = new Date()) {
  const permitido = { permitido: true, motivo: null };
  const no = (motivo) => ({ permitido: false, motivo });
  const borrador = encuesta?.estado === 'borrador';
  const respuestas = Number(encuesta?.totalRespuestas || 0);

  let publicar = permitido;
  if (!borrador) publicar = no('La encuesta ya fue publicada.');
  else if (evento?.estado === 'en_configuracion') {
    publicar = no('El evento está en configuración: todavía nadie ha podido asistir.');
  } else if (!encuesta?.preguntas || encuesta.preguntas.length === 0) {
    publicar = no('Agrega al menos una pregunta.');
  } else if (encuesta.fechaCierre && new Date(encuesta.fechaCierre) <= ahora) {
    publicar = no('La fecha de cierre ya pasó. Cámbiala o déjala vacía.');
  }

  return {
    editar: borrador ? permitido : no('Una encuesta publicada no se modifica: cambiar las preguntas alteraría las respuestas.'),
    publicar,
    cerrar: encuesta?.estado === 'publicada' ? permitido : no(borrador ? 'Todavía no está publicada.' : 'Ya está cerrada.'),
    eliminar: respuestas > 0 ? no(`Tiene ${plural(respuestas, 'respuesta')}. Puedes cerrarla para que no reciba más.`) : permitido,
    resultados: borrador ? no('Publica la encuesta para recibir respuestas.') : permitido,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Organizador: formulario de configuración
// ──────────────────────────────────────────────────────────────────────────────

let contadorClave = 0;
/** Clave local para las listas del formulario (no se envía al backend). */
function nuevaClave() {
  contadorClave += 1;
  return `k${contadorClave}`;
}

/**
 * Pregunta vacía del formulario.
 * @param {'escala'|'opcion'|'texto'} [tipo='escala']
 */
export function preguntaVacia(tipo = 'escala') {
  return {
    clave: nuevaClave(),
    texto: '',
    tipoRespuesta: tipo,
    obligatoria: true,
    escalaMinima: String(ESCALA_MINIMA_POR_DEFECTO),
    escalaMaxima: String(ESCALA_MAXIMA_POR_DEFECTO),
    opciones: tipo === 'opcion' ? ['', ''] : [],
  };
}

/** Formulario vacío de una encuesta nueva. */
export function formularioVacio() {
  return {
    titulo: '',
    descripcion: '',
    actividadId: ALCANCE_EVENTO,
    anonima: true,
    fechaCierre: '',
    preguntas: [preguntaVacia('escala')],
  };
}

/**
 * Cambia el tipo de una pregunta del formulario conservando el texto y preparando sus campos.
 * @param {Object} pregunta
 * @param {'escala'|'opcion'|'texto'} tipo
 */
export function cambiarTipoPregunta(pregunta, tipo) {
  const opciones = tipo === 'opcion' ? (pregunta.opciones?.length ? pregunta.opciones : ['', '']) : pregunta.opciones || [];
  return { ...pregunta, tipoRespuesta: tipo, opciones };
}

/**
 * Formulario a partir de una encuesta del backend (para editar un borrador).
 * @param {Object} encuesta - EncuestaResponse.
 */
export function aFormulario(encuesta) {
  return {
    titulo: encuesta?.titulo || '',
    descripcion: encuesta?.descripcion || '',
    actividadId: encuesta?.actividadId ? String(encuesta.actividadId) : ALCANCE_EVENTO,
    anonima: Boolean(encuesta?.anonima),
    fechaCierre: aValorFechaLocal(encuesta?.fechaCierre),
    preguntas: (encuesta?.preguntas || []).map((p) => ({
      clave: nuevaClave(),
      texto: p.texto || '',
      tipoRespuesta: p.tipoRespuesta,
      obligatoria: p.obligatoria !== false,
      escalaMinima: String(p.escalaMinima ?? ESCALA_MINIMA_POR_DEFECTO),
      escalaMaxima: String(p.escalaMaxima ?? ESCALA_MAXIMA_POR_DEFECTO),
      opciones: (p.opciones || []).map((o) => o.texto),
    })),
  };
}

const entero = (valor) => (valor === '' || valor == null ? NaN : Number(valor));

/**
 * Valida el formulario como lo hace el backend.
 * @param {Object} form - Ver {@link formularioVacio}.
 * @param {Date} [ahora=new Date()]
 * @returns {{ valido: boolean, errores: { titulo?: string, descripcion?: string, fechaCierre?: string,
 *   actividadId?: string, preguntasGeneral?: string, preguntas: Record<number, Record<string, string>> } }}
 */
export function validarEncuesta(form, ahora = new Date()) {
  const errores = { preguntas: {} };
  const titulo = (form.titulo || '').trim();
  if (!titulo) errores.titulo = 'El título es obligatorio.';
  else if (titulo.length > MAX_TITULO) errores.titulo = `El título no puede superar ${MAX_TITULO} caracteres.`;

  if ((form.descripcion || '').length > MAX_DESCRIPCION) {
    errores.descripcion = `La descripción no puede superar ${MAX_DESCRIPCION} caracteres.`;
  }

  if (form.fechaCierre) {
    const fecha = new Date(form.fechaCierre);
    if (Number.isNaN(fecha.getTime())) errores.fechaCierre = 'La fecha de cierre no es válida.';
    else if (fecha <= ahora) errores.fechaCierre = 'La fecha de cierre debe ser posterior a la fecha y hora actual.';
  }

  const preguntas = form.preguntas || [];
  if (preguntas.length > MAX_PREGUNTAS) errores.preguntasGeneral = `La encuesta no puede tener más de ${MAX_PREGUNTAS} preguntas.`;

  preguntas.forEach((p, i) => {
    const e = {};
    const texto = (p.texto || '').trim();
    if (!texto) e.texto = 'Escribe la pregunta.';
    else if (texto.length > MAX_TEXTO_PREGUNTA) e.texto = `La pregunta no puede superar ${MAX_TEXTO_PREGUNTA} caracteres.`;

    if (p.tipoRespuesta === 'escala') {
      const min = entero(p.escalaMinima);
      const max = entero(p.escalaMaxima);
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < ESCALA_MIN_PERMITIDA || max > ESCALA_MAX_PERMITIDA || min >= max) {
        e.escala = `La escala debe ir de un mínimo a un máximo mayor, entre ${ESCALA_MIN_PERMITIDA} y ${ESCALA_MAX_PERMITIDA}.`;
      }
    }

    if (p.tipoRespuesta === 'opcion') {
      const opciones = p.opciones || [];
      const vistas = new Set();
      const porOpcion = {};
      opciones.forEach((o, j) => {
        const t = (o || '').trim();
        if (!t) porOpcion[j] = 'Escribe la opción.';
        else if (t.length > MAX_TEXTO_OPCION) porOpcion[j] = `Máximo ${MAX_TEXTO_OPCION} caracteres.`;
        else if (vistas.has(t.toLowerCase())) porOpcion[j] = 'Opción repetida.';
        else vistas.add(t.toLowerCase());
      });
      if (Object.keys(porOpcion).length) e.porOpcion = porOpcion;
      if (opciones.length < MIN_OPCIONES || opciones.length > MAX_OPCIONES) {
        e.opciones = `Necesita entre ${MIN_OPCIONES} y ${MAX_OPCIONES} opciones.`;
      }
    }

    if (Object.keys(e).length) errores.preguntas[i] = e;
  });

  const valido =
    !errores.titulo && !errores.descripcion && !errores.fechaCierre && !errores.preguntasGeneral &&
    Object.keys(errores.preguntas).length === 0;
  return { valido, errores };
}

/**
 * Cuerpo para crear o modificar la encuesta (EncuestaRequest del backend).
 * @param {Object} form
 */
export function aEncuestaRequest(form) {
  return {
    titulo: (form.titulo || '').trim(),
    descripcion: (form.descripcion || '').trim() || null,
    actividadId: form.actividadId && form.actividadId !== ALCANCE_EVENTO ? Number(form.actividadId) : null,
    anonima: Boolean(form.anonima),
    fechaCierre: aFechaBackend(form.fechaCierre),
    preguntas: (form.preguntas || []).map((p) => ({
      texto: (p.texto || '').trim(),
      tipoRespuesta: p.tipoRespuesta,
      obligatoria: p.obligatoria !== false,
      escalaMinima: p.tipoRespuesta === 'escala' ? Number(p.escalaMinima) : null,
      escalaMaxima: p.tipoRespuesta === 'escala' ? Number(p.escalaMaxima) : null,
      opciones: p.tipoRespuesta === 'opcion' ? (p.opciones || []).map((o) => (o || '').trim()) : [],
    })),
  };
}

/**
 * Convierte los `erroresValidacion` del backend (claves como `titulo`, `preguntas[1].opciones`,
 * `preguntas[0].opciones[2]` o `preguntas[3].escalaMaxima`) a la forma de {@link validarEncuesta}.
 * @param {Record<string, string>} campos
 */
export function erroresDeBackend(campos) {
  const errores = { preguntas: {} };
  Object.entries(campos || {}).forEach(([clave, mensaje]) => {
    const m = /^preguntas\[(\d+)\](?:\.(\w+)(?:\[(\d+)\])?)?$/.exec(clave);
    if (!m) {
      if (clave === 'preguntas') errores.preguntasGeneral = mensaje;
      else errores[clave] = mensaje;
      return;
    }
    const i = Number(m[1]);
    const campo = m[2];
    const e = errores.preguntas[i] || (errores.preguntas[i] = {});
    if (!campo) e.texto = mensaje;
    else if (campo === 'opciones' && m[3] != null) {
      e.porOpcion = { ...(e.porOpcion || {}), [Number(m[3])]: mensaje };
    } else if (campo === 'opciones') e.opciones = mensaje;
    else if (campo === 'escalaMinima' || campo === 'escalaMaxima') e.escala = mensaje;
    else e[campo] = mensaje;
  });
  return errores;
}

/**
 * Opciones del selector «Se aplica a»: el evento en general y las actividades que admiten encuesta
 * (no canceladas ni por programar), en orden cronológico.
 * @param {Array<{ id: number, nombre: string, fecha?: string|null, horaInicio?: string|null, estado?: string }>} actividades
 * @returns {Array<{ value: string, label: string }>}
 */
export function opcionesAlcance(actividades) {
  const validas = (actividades || []).filter((a) => a && a.estado !== 'cancelada' && a.estado !== 'por_programar');
  return [
    { value: ALCANCE_EVENTO, label: 'Evento en general (quienes asistieron a alguna actividad)' },
    ...validas.map((a) => ({
      value: String(a.id),
      label: `${a.nombre}${a.fecha ? ` — ${formatearFecha(a.fecha)}${a.horaInicio ? ` ${a.horaInicio}` : ''}` : ''}`,
    })),
  ];
}

// ──────────────────────────────────────────────────────────────────────────────
// Participante: responder
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Valores vacíos del formulario de respuestas, por pregunta.
 * @param {Array<{ preguntaId: number }>} preguntas
 * @returns {Record<number, string>}
 */
export function respuestasVacias(preguntas) {
  const valores = {};
  (preguntas || []).forEach((p) => {
    valores[p.preguntaId] = '';
  });
  return valores;
}

/**
 * Valores posibles de una pregunta de escala.
 * @param {{ escalaMinima?: number, escalaMaxima?: number }} pregunta
 * @returns {number[]}
 */
export function valoresEscala(pregunta) {
  const min = Number(pregunta?.escalaMinima ?? ESCALA_MINIMA_POR_DEFECTO);
  const max = Number(pregunta?.escalaMaxima ?? ESCALA_MAXIMA_POR_DEFECTO);
  const valores = [];
  for (let v = min; v <= max; v += 1) valores.push(v);
  return valores;
}

/**
 * Valida las respuestas antes de enviarlas (las mismas reglas del backend).
 * @param {Array<Object>} preguntas - PreguntaEncuestaResponse.
 * @param {Record<number, string>} valores - Valor elegido por pregunta (texto, valor o id de opción).
 * @returns {{ valido: boolean, errores: Record<number, string>, general: string|null }}
 */
export function validarRespuestas(preguntas, valores) {
  const errores = {};
  let respondidas = 0;
  (preguntas || []).forEach((p) => {
    const valor = String(valores?.[p.preguntaId] ?? '').trim();
    if (!valor) {
      if (p.obligatoria) errores[p.preguntaId] = 'Esta pregunta es obligatoria.';
      return;
    }
    if (p.tipoRespuesta === 'escala') {
      const n = Number(valor);
      if (!Number.isInteger(n) || n < p.escalaMinima || n > p.escalaMaxima) {
        errores[p.preguntaId] = `Elige un valor de ${p.escalaMinima} a ${p.escalaMaxima}.`;
        return;
      }
    } else if (p.tipoRespuesta === 'opcion') {
      if (!(p.opciones || []).some((o) => String(o.opcionId) === valor)) {
        errores[p.preguntaId] = 'Elige una de las opciones.';
        return;
      }
    } else if (valor.length > MAX_TEXTO_RESPUESTA) {
      errores[p.preguntaId] = `La respuesta no puede superar ${MAX_TEXTO_RESPUESTA} caracteres.`;
      return;
    }
    respondidas += 1;
  });
  const general = Object.keys(errores).length === 0 && respondidas === 0 ? 'Responde al menos una pregunta.' : null;
  return { valido: Object.keys(errores).length === 0 && !general, errores, general };
}

/**
 * Cuerpo de las respuestas (solo las preguntas respondidas).
 * @param {Array<Object>} preguntas
 * @param {Record<number, string>} valores
 * @returns {Array<{ preguntaId: number, valorEscala?: number, opcionId?: number, texto?: string }>}
 */
export function aRespuestasRequest(preguntas, valores) {
  const respuestas = [];
  (preguntas || []).forEach((p) => {
    const valor = String(valores?.[p.preguntaId] ?? '').trim();
    if (!valor) return;
    if (p.tipoRespuesta === 'escala') respuestas.push({ preguntaId: p.preguntaId, valorEscala: Number(valor) });
    else if (p.tipoRespuesta === 'opcion') respuestas.push({ preguntaId: p.preguntaId, opcionId: Number(valor) });
    else respuestas.push({ preguntaId: p.preguntaId, texto: valor });
  });
  return respuestas;
}

/**
 * Errores por pregunta del backend (claves `pregunta_<id>`) indexados por id de pregunta.
 * @param {Record<string, string>} campos
 * @returns {{ porPregunta: Record<number, string>, general: string|null }}
 */
export function erroresRespuestasDeBackend(campos) {
  const porPregunta = {};
  let general = null;
  Object.entries(campos || {}).forEach(([clave, mensaje]) => {
    const m = /^pregunta_(\d+)$/.exec(clave);
    if (m) porPregunta[Number(m[1])] = mensaje;
    else general = general ? `${general} ${mensaje}` : mensaje;
  });
  return { porPregunta, general };
}

/**
 * Situación de una encuesta para el participante.
 * @param {{ respondida?: boolean, recibeRespuestas?: boolean }} encuesta
 * @returns {{ id: 'pendiente'|'respondida'|'cerrada', etiqueta: string, clases: string }}
 */
export function situacionParticipante(encuesta) {
  if (encuesta?.respondida) {
    return { id: 'respondida', etiqueta: 'Respondida', clases: 'bg-surface-muted text-ink-900 border-ink-600' };
  }
  if (encuesta?.recibeRespuestas) {
    return { id: 'pendiente', etiqueta: 'Por responder', clases: 'bg-brand-100 text-brand-700 border-brand-600' };
  }
  return { id: 'cerrada', etiqueta: 'Cerrada', clases: 'bg-white text-ink-600 border-field-border' };
}

/**
 * Ordena las encuestas del participante: primero las que puede responder (las que cierran antes, primero) y
 * después las respondidas (la más reciente primero).
 * @param {Array<Object>} encuestas
 */
export function ordenarMisEncuestas(encuestas) {
  const lista = [...(encuestas || [])];
  const peso = (e) => (situacionParticipante(e).id === 'pendiente' ? 0 : 1);
  return lista.sort((a, b) => {
    if (peso(a) !== peso(b)) return peso(a) - peso(b);
    if (peso(a) === 0) {
      const fa = a.fechaCierre ? new Date(a.fechaCierre).getTime() : Infinity;
      const fb = b.fechaCierre ? new Date(b.fechaCierre).getTime() : Infinity;
      return fa - fb;
    }
    return new Date(b.fechaRespuesta || 0).getTime() - new Date(a.fechaRespuesta || 0).getTime();
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Resultados (Criterio 4)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Ancho de la barra (0 a 100) de un conteo respecto del mayor de la pregunta, para que la opción más elegida
 * llene la barra.
 * @param {number} cantidad
 * @param {Array<{ cantidad: number }>} distribucion
 */
export function anchoBarra(cantidad, distribucion) {
  const maximo = Math.max(0, ...(distribucion || []).map((d) => Number(d.cantidad) || 0));
  if (!maximo) return 0;
  return Math.round(((Number(cantidad) || 0) / maximo) * 100);
}

/**
 * Resumen de una pregunta de los resultados en una línea.
 * @param {Object} pregunta - ResultadoPreguntaResponse.
 */
export function resumenPregunta(pregunta) {
  const total = Number(pregunta?.totalRespuestas || 0);
  if (total === 0) return 'Sin respuestas todavía.';
  const partes = [plural(total, 'respuesta')];
  if (pregunta.tipoRespuesta === 'escala' && pregunta.promedio != null) {
    partes.push(`promedio ${formatearPromedio(pregunta.promedio)} de ${pregunta.escalaMaxima}`);
  }
  if (pregunta.omitidas > 0) partes.push(`${pregunta.omitidas} la omitieron`);
  return partes.join(' · ');
}

// ──────────────────────────────────────────────────────────────────────────────
// Errores
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Interpreta un error de la API de encuestas (ErrorResponse del backend: message, codigo, erroresValidacion).
 * @param {any} err
 * @returns {{ titulo: string, mensaje: string, codigo: string|undefined, status: number|undefined,
 *   campos: Record<string, string> }}
 */
export function interpretarErrorEncuesta(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const codigo = data?.codigo;
  const campos = data?.erroresValidacion && typeof data.erroresValidacion === 'object' ? { ...data.erroresValidacion } : {};
  const mensajeBackend = typeof data?.message === 'string' && data.message.trim() ? data.message : null;

  let mensaje;
  if (status === 401) mensaje = 'Tu sesión expiró. Inicia sesión de nuevo.';
  // El 403 de «no asistió» trae un mensaje propio que sí hay que mostrar (Criterio 3).
  else if (status === 403 && codigo !== 'ENCUESTA_NO_HABILITADA') mensaje = MENSAJE_POR_ESTADO[403];
  else if (mensajeBackend) mensaje = mensajeBackend;
  else if (err?.request && !err?.response) {
    mensaje = 'No fue posible conectarse con el servidor. Verifica que el backend esté activo.';
  } else {
    mensaje = MENSAJE_POR_ESTADO[status] || (status >= 500 ? MENSAJE_POR_ESTADO[500] : 'Ocurrió un error inesperado. Intenta de nuevo.');
  }

  return {
    titulo: TITULOS_ERROR[codigo] || (status === 403 ? 'Acceso denegado' : 'No se pudo completar la operación'),
    mensaje,
    codigo,
    status,
    campos,
  };
}
