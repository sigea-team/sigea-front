import { formatearFechaLarga, horaAMinutos } from './agendaUtils';

/**
 * @file agendaPublicacionUtils.js
 * @description Funciones puras de la generación automática y la publicación de la agenda (HU-22).
 * @module features/agenda/agendaPublicacionUtils
 */

/** Estado del backend para una actividad registrada sin fecha, horario ni sala. */
export const ESTADO_POR_PROGRAMAR = 'por_programar';

/** Duración permitida por el backend, en minutos. */
export const DURACION_MINIMA = 5;
export const DURACION_MAXIMA = 1440;

/** Duraciones sugeridas en el formulario. */
export const DURACIONES_SUGERIDAS = [30, 45, 60, 90, 120, 180];

/** Criterio 2: explicación corta de cada motivo por el que una actividad quedó pendiente. */
export const MOTIVOS_PENDIENTE = {
  SIN_SALA_DISPONIBLE: 'Sin sala disponible',
  SIN_DISPONIBILIDAD_PONENTE: 'Ponente sin disponibilidad',
  SIN_FRANJA_COMUN: 'Sin franja que alcance',
  SIN_ESPACIO_LIBRE: 'Todos los horarios chocan',
};

/** Qué puede hacer el organizador según el motivo (se muestra debajo del mensaje del backend). */
export const SUGERENCIA_POR_MOTIVO = {
  SIN_SALA_DISPONIBLE: 'Registra la disponibilidad de una sala compatible con la modalidad en las fechas del evento.',
  SIN_DISPONIBILIDAD_PONENTE: 'Registra la disponibilidad del ponente o asígnala a mano.',
  SIN_FRANJA_COMUN: 'Amplía la disponibilidad de la sala o del ponente, o reduce la duración.',
  SIN_ESPACIO_LIBRE: 'Asígnala a mano, márcala como simultánea si es paralela o libera otro horario.',
};

/**
 * @param {string} motivo
 * @returns {string}
 */
export function etiquetaMotivo(motivo) {
  return MOTIVOS_PENDIENTE[motivo] || 'Pendiente de asignación manual';
}

/**
 * @param {{ estado?: string }} actividad
 * @returns {boolean} true si está registrada sin fecha, horario ni sala.
 */
export function estaPorProgramar(actividad) {
  return String(actividad?.estado || '').toLowerCase() === ESTADO_POR_PROGRAMAR;
}

/**
 * Separa la agenda en lo que ya tiene horario (para la línea de tiempo y la tabla de HU-21) y lo que falta ubicar.
 * Las canceladas no van en ninguna de las dos.
 * @param {Array<Object>} actividades
 * @returns {{ programadas: Array<Object>, porProgramar: Array<Object> }}
 */
export function separarActividades(actividades = []) {
  const programadas = [];
  const porProgramar = [];
  for (const a of Array.isArray(actividades) ? actividades : []) {
    const estado = String(a?.estado || '').toLowerCase();
    if (estado === 'cancelada') continue;
    if (estado === ESTADO_POR_PROGRAMAR || !a.fecha || !a.horaInicio || !a.horaFin) {
      porProgramar.push(a);
    } else {
      programadas.push(a);
    }
  }
  return { programadas, porProgramar };
}

/**
 * "1 h 30 min", "45 min", "2 h".
 * @param {number|string|null} minutos
 * @returns {string}
 */
export function formatearDuracion(minutos) {
  const total = Number(minutos);
  if (!Number.isFinite(total) || total <= 0) return 'Sin duración';
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/**
 * Suma minutos a una hora "HH:mm" (para precargar el formulario de asignación manual).
 * @param {string} hora
 * @param {number} minutos
 * @returns {string} "HH:mm", como máximo "23:59".
 */
export function sumarMinutos(hora, minutos) {
  const total = Math.min(horaAMinutos(hora) + Number(minutos || 0), 23 * 60 + 59);
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Valida el formulario de una actividad por programar con las mismas reglas del backend.
 * @param {{ nombre?: string, tipoActividadId?: string|number, duracionMinutos?: string|number }} form
 * @returns {{ esValido: boolean, errores: Record<string, string> }}
 */
export function validarPorProgramar(form = {}) {
  const errores = {};
  const nombre = (form.nombre || '').trim();
  if (!nombre) {
    errores.nombre = 'El nombre de la actividad es obligatorio.';
  } else if (nombre.length > 200) {
    errores.nombre = 'El nombre no puede superar los 200 caracteres.';
  }
  if (!form.tipoActividadId) {
    errores.tipoActividadId = 'El tipo de actividad es obligatorio.';
  }
  const texto = String(form.duracionMinutos ?? '').trim();
  const duracion = Number(texto);
  if (!texto) {
    errores.duracionMinutos = 'La duración de la actividad es obligatoria.';
  } else if (!Number.isInteger(duracion)) {
    errores.duracionMinutos = 'La duración debe ser un número entero de minutos.';
  } else if (duracion < DURACION_MINIMA) {
    errores.duracionMinutos = `La duración mínima es de ${DURACION_MINIMA} minutos.`;
  } else if (duracion > DURACION_MAXIMA) {
    errores.duracionMinutos = 'La duración no puede superar las 24 horas.';
  }
  return { esValido: Object.keys(errores).length === 0, errores };
}

/**
 * "Miércoles, 10 de marzo de 2027": la fecha larga con solo la primera letra en mayúscula (la clase `capitalize`
 * de Tailwind pondría "De Marzo De").
 * @param {string} fecha - "AAAA-MM-DD"
 * @returns {string}
 */
export function tituloDia(fecha) {
  const texto = formatearFechaLarga(fecha);
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : texto;
}

/**
 * Agrupa por día una lista con `fecha` y `horaInicio` (asignaciones propuestas o actividades publicadas).
 * @param {Array<{ fecha: string, horaInicio: string }>} items
 * @returns {Array<{ fecha: string, fechaTexto: string, items: Array<Object> }>}
 */
export function agruparPorDia(items = []) {
  const ordenados = [...(Array.isArray(items) ? items : [])].sort(
    (a, b) =>
      (a.fecha || '').localeCompare(b.fecha || '') ||
      horaAMinutos(a.horaInicio) - horaAMinutos(b.horaInicio) ||
      (a.salaNombre || '').localeCompare(b.salaNombre || '')
  );
  const mapa = new Map();
  for (const item of ordenados) {
    const f = item.fecha || 'Sin fecha';
    if (!mapa.has(f)) mapa.set(f, []);
    mapa.get(f).push(item);
  }
  return Array.from(mapa.entries()).map(([fecha, lista]) => ({
    fecha,
    fechaTexto: tituloDia(fecha),
    items: lista,
  }));
}

/**
 * "fecha, horario y sala".
 * @param {string[]} faltantes
 * @returns {string}
 */
export function textoFaltantes(faltantes = []) {
  const lista = (Array.isArray(faltantes) ? faltantes : []).filter(Boolean);
  if (lista.length === 0) return '';
  if (lista.length === 1) return lista[0];
  return `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`;
}

/**
 * Criterio 2: resumen de una generación para el aviso de éxito.
 * @param {{ aplicada: boolean, totalPorUbicar: number, asignadas: Array, pendientes: Array }} resultado
 * @returns {string}
 */
export function resumenGeneracion(resultado) {
  const asignadas = resultado?.asignadas?.length || 0;
  const pendientes = resultado?.pendientes?.length || 0;
  if (!resultado || (resultado.totalPorUbicar || 0) === 0) {
    return 'No hay actividades por programar.';
  }
  const ubicadas = `${asignadas} ${asignadas === 1 ? 'actividad ubicada' : 'actividades ubicadas'}`;
  if (pendientes === 0) return `${ubicadas} sin cruces.`;
  return `${ubicadas}; ${pendientes} ${pendientes === 1 ? 'queda pendiente' : 'quedan pendientes'} de asignación manual.`;
}

/**
 * Traduce la respuesta 409 de publicar (Criterios 3 y 4).
 * @param {any} err - Error de Axios.
 * @returns {{ codigo: string|undefined, mensaje: string, incompletas: Array<Object>, conflictos: Array<Object> } | null}
 *   null si no es un rechazo de publicación.
 */
export function interpretarRechazoPublicacion(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  if (status !== 409 || !data) return null;
  return {
    codigo: data.codigo,
    mensaje: typeof data.message === 'string' && data.message ? data.message : 'No se pudo publicar la agenda.',
    incompletas: Array.isArray(data.incompletas) ? data.incompletas : [],
    conflictos: Array.isArray(data.conflictos) ? data.conflictos : [],
  };
}

/**
 * Estado de publicación para mostrar como etiqueta.
 * @param {{ publicada?: boolean, dias?: Array<{ estado: string, actividades: number }> } | null} validacion
 * @returns {{ texto: string, tono: 'publicada'|'parcial'|'borrador' }}
 */
export function estadoPublicacion(validacion) {
  if (!validacion?.publicada) return { texto: 'Sin publicar', tono: 'borrador' };
  const dias = Array.isArray(validacion.dias) ? validacion.dias : [];
  const conActividadesSinPublicar = dias.some((d) => d.estado !== 'publicada' && d.actividades > 0);
  return conActividadesSinPublicar
    ? { texto: 'Publicada con días pendientes', tono: 'parcial' }
    : { texto: 'Publicada', tono: 'publicada' };
}

/**
 * Datos iniciales del formulario de HU-21 para asignar a mano una actividad por programar: conserva sus datos y
 * propone un horario de su misma duración desde las 08:00 del primer día del evento.
 * @param {Object} actividad
 * @param {{ fechaInicio?: string }} [evento]
 * @returns {Object}
 */
export function precargaAsignacionManual(actividad, evento) {
  const inicio = '08:00';
  return {
    ...actividad,
    fecha: actividad?.fecha || evento?.fechaInicio || '',
    horaInicio: inicio,
    horaFin: sumarMinutos(inicio, actividad?.duracionMinutos || 60),
  };
}
