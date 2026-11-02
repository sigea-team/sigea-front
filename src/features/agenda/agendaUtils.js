/**
 * @file agendaUtils.js
 * @description Utilidades, validaciones y motor de detección de conflictos de la agenda (HU-21).
 * Implementa la lógica para los criterios de aceptación:
 * - Criterio 1: Ordenamiento cronológico de actividades en la agenda.
 * - Criterio 2: Detección y notificación de conflictos de horario, sala y ponente.
 * - Criterio 3: Soporte para actividades simultáneas intencionales (sin conflicto de horario entre ellas,
 *   pero validando que no compartan sala ni ponente).
 * - Criterio 4: Validación estricta de campos obligatorios (nombre, fecha, hora inicio, hora fin, sala).
 * - Criterio 5: Revalidación de conflictos al modificar horario, sala o ponente excluyendo la actividad en edición.
 * @module features/agenda/agendaUtils
 */

/** Modalidades permitidas para las actividades */
export const MODALIDADES_ACTIVIDAD = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hibrida', label: 'Híbrida' },
];

/**
 * Convierte una hora "HH:mm" a minutos desde las 00:00 para comparaciones numéricas seguras.
 * @param {string} hora - Formato "HH:mm"
 * @returns {number}
 */
export function horaAMinutos(hora) {
  if (!hora || typeof hora !== 'string') return 0;
  const [h, m] = hora.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Formatea una hora "HH:mm" a formato am/pm legible para usuarios.
 * @param {string} hora - ej: "14:30"
 * @returns {string} - ej: "02:30 p. m."
 */
export function formatearHora(hora) {
  if (!hora) return '—';
  const [h, m] = hora.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hora;
  const periodo = h >= 12 ? 'p. m.' : 'a. m.';
  const horas12 = h % 12 === 0 ? 12 : h % 12;
  const minutos = String(m).padStart(2, '0');
  return `${String(horas12).padStart(2, '0')}:${minutos} ${periodo}`;
}

/**
 * Formatea una fecha ISO "YYYY-MM-DD" en texto en español legible.
 * @param {string} fechaStr - "2026-10-21"
 * @returns {string} - ej: "Miércoles, 21 de octubre de 2026"
 */
export function formatearFechaLarga(fechaStr) {
  if (!fechaStr) return '—';
  try {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return fechaStr;
  }
}

/**
 * Determina si dos intervalos horarios se solapan (intersecan) en el tiempo.
 * Dos rangos [I1, F1] e [I2, F2] se traslapan si max(I1, I2) < min(F1, F2).
 * Nota: Si una actividad termina exactamente a la hora que empieza otra (ej. 10:00 a 11:00 y 11:00 a 12:00),
 * no hay traslape porque 11:00 < 11:00 es falso.
 *
 * @param {string} inicio1 - "HH:mm"
 * @param {string} fin1 - "HH:mm"
 * @param {string} inicio2 - "HH:mm"
 * @param {string} fin2 - "HH:mm"
 * @returns {boolean}
 */
export function seSolapanHorarios(inicio1, fin1, inicio2, fin2) {
  const i1 = horaAMinutos(inicio1);
  const f1 = horaAMinutos(fin1);
  const i2 = horaAMinutos(inicio2);
  const f2 = horaAMinutos(fin2);

  return Math.max(i1, i2) < Math.min(f1, f2);
}

/**
 * Verifica si un rango de fecha y hora está completamente contenido dentro de al menos
 * una de las franjas de disponibilidad registradas.
 *
 * @param {{ fecha: string, horaInicio: string, horaFin: string }} actividad
 * @param {Array<{ fecha: string, horaInicio: string, horaFin: string }>} franjas
 * @returns {boolean}
 */
export function estaCubiertoPorDisponibilidad(actividad, franjas = []) {
  if (!actividad || !actividad.fecha || !actividad.horaInicio || !actividad.horaFin) return false;
  if (!Array.isArray(franjas) || franjas.length === 0) return false;

  const actInicio = horaAMinutos(actividad.horaInicio);
  const actFin = horaAMinutos(actividad.horaFin);

  return franjas.some((f) => {
    if (f.fecha !== actividad.fecha) return false;
    const fInicio = horaAMinutos(f.horaInicio);
    const fFin = horaAMinutos(f.horaFin);
    return actInicio >= fInicio && actFin <= fFin;
  });
}

/**
 * Criterio 4: Validación de campos obligatorios antes de confirmar el registro o cambio.
 * Rechaza la operación si falta nombre, fecha, horas o sala.
 *
 * @param {Object} form - Datos del formulario de actividad
 * @returns {{ esValido: boolean, errores: Object }}
 */
export function validarActividad(form = {}) {
  const errores = {};

  const nombreLimpio = (form.nombre || '').trim();
  if (!nombreLimpio) {
    errores.nombre = 'El nombre de la actividad es obligatorio.';
  } else if (nombreLimpio.length > 200) {
    errores.nombre = 'El nombre no puede superar los 200 caracteres.';
  }

  if (!form.fecha) {
    errores.fecha = 'La fecha de la actividad es obligatoria.';
  }

  if (!form.horaInicio) {
    errores.horaInicio = 'La hora de inicio es obligatoria.';
  }

  if (!form.horaFin) {
    errores.horaFin = 'La hora de finalización es obligatoria.';
  }

  if (form.horaInicio && form.horaFin) {
    const minInicio = horaAMinutos(form.horaInicio);
    const minFin = horaAMinutos(form.horaFin);
    if (minFin <= minInicio) {
      errores.horaFin = 'La hora de fin debe ser estrictamente posterior a la hora de inicio.';
    }
  }

  if (!form.salaId || String(form.salaId).trim() === '') {
    errores.salaId = 'La asignación de sala o espacio es obligatoria.';
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores,
  };
}

/**
 * Criterios 2, 3 y 5: Motor de detección de conflictos de agenda.
 *
 * Evalúa una actividad contra el resto de la agenda y la disponibilidad configurada:
 * 1. Conflicto de Sala: No pueden haber dos actividades en la misma sala en el mismo horario
 *    (incluso si ambas están marcadas como simultáneas, a menos que la sala lo admita expresamente).
 * 2. Conflicto de Ponente: Un mismo ponente no puede estar programado en dos actividades que se cruzan.
 * 3. Conflicto de Horario: Dos actividades que se traslapan en horario sin estar explícitamente
 *    marcadas como simultáneas por los organizadores (Criterio 3).
 * 4. Fuera de disponibilidad: Si la sala o ponente tienen franjas configuradas y la actividad queda por fuera.
 *
 * @param {Object} actividad - Actividad a evaluar ({ id, nombre, fecha, horaInicio, horaFin, salaId, ponenteId, permiteSimultaneidad })
 * @param {Array<Object>} actividadesExistentes - Todas las demás actividades registradas en el evento
 * @param {Object} [opciones]
 * @param {Array<Object>} [opciones.salas] - Catálogo de salas con sus nombres y disponibilidad
 * @param {Array<Object>} [opciones.ponentes] - Catálogo de ponentes con sus nombres y disponibilidad
 * @param {number|string|null} [opciones.actividadIdExcluir] - ID a excluir (para Criterio 5 al editar)
 * @returns {{
 *   hayConflicto: boolean,
 *   conflictosHorario: Array<Object>,
 *   conflictosSala: Array<Object>,
 *   conflictosPonente: Array<Object>,
 *   conflictosDisponibilidad: Array<Object>,
 *   motivos: Array<string>
 * }}
 */
export function detectarConflictosActividad(
  actividad,
  actividadesExistentes = [],
  { salas = [], ponentes = [], actividadIdExcluir = null } = {}
) {
  const motivos = [];
  const conflictosHorario = [];
  const conflictosSala = [];
  const conflictosPonente = [];
  const conflictosDisponibilidad = [];

  if (!actividad || !actividad.fecha || !actividad.horaInicio || !actividad.horaFin) {
    return {
      hayConflicto: false,
      conflictosHorario,
      conflictosSala,
      conflictosPonente,
      conflictosDisponibilidad,
      motivos,
    };
  }

  const idExcluir = actividadIdExcluir ?? actividad.id ?? null;
  const esSimultanea = Boolean(actividad.permiteSimultaneidad);

  // Filtrar actividades a comparar (excluyendo la misma si se está modificando - Criterio 5)
  const actividadesAComparar = actividadesExistentes.filter((otra) => {
    if (idExcluir !== null && idExcluir !== undefined) {
      if (String(otra.id) === String(idExcluir)) return false;
    }
    // Solo interesan actividades del mismo día
    return otra.fecha === actividad.fecha;
  });

  const salaSeleccionada = salas.find(
    (s) => String(s.id ?? s.salaId) === String(actividad.salaId)
  );

  const ponenteSeleccionado = ponentes.find((p) => {
    const pId = p.personaId ?? p.id;
    return String(pId) === String(actividad.ponenteId);
  });

  const nombreSala = salaSeleccionada?.nombre || `Sala #${actividad.salaId}`;
  const nombrePonente = ponenteSeleccionado
    ? `${ponenteSeleccionado.nombres || ''} ${ponenteSeleccionado.apellidos || ''}`.trim() || ponenteSeleccionado.nombre
    : null;

  // 1. Evaluar traslapes con otras actividades programadas en la misma fecha
  for (const otra of actividadesAComparar) {
    const solapadas = seSolapanHorarios(
      actividad.horaInicio,
      actividad.horaFin,
      otra.horaInicio,
      otra.horaFin
    );

    if (!solapadas) continue;

    const otraEsSimultanea = Boolean(otra.permiteSimultaneidad);
    const mismoHorarioRango = `${formatearHora(otra.horaInicio)} a ${formatearHora(otra.horaFin)}`;

    // Conflicto de SALA (Criterio 2 y 3)
    // Dos actividades NUNCA pueden ocupar la misma sala en horario solapado,
    // incluso si se marcaron como simultáneas (salvo configuración especial inexistente).
    const mismaSala = String(otra.salaId) === String(actividad.salaId);
    if (mismaSala) {
      const detalle = {
        actividadConflictiva: otra,
        tipo: 'sala',
        mensaje: `La sala «${nombreSala}» ya está ocupada por la actividad «${otra.nombre}» (${mismoHorarioRango}).`,
      };
      conflictosSala.push(detalle);
      motivos.push(detalle.mensaje);
    }

    // Conflicto de PONENTE (Criterio 2 y 3)
    // Un mismo ponente no puede estar en dos actividades simultáneas o solapadas
    if (actividad.ponenteId && String(otra.ponenteId) === String(actividad.ponenteId)) {
      const detalle = {
        actividadConflictiva: otra,
        tipo: 'ponente',
        mensaje: `El ponente «${nombrePonente || 'Asignado'}» ya está programado en la actividad «${otra.nombre}» (${mismoHorarioRango}).`,
      };
      conflictosPonente.push(detalle);
      motivos.push(detalle.mensaje);
    }

    // Conflicto de HORARIO (Criterios 2 y 3)
    // Criterio 3: Si AMBAS están explícitamente marcadas como simultáneas (ej. talleres paralelos),
    // NO se genera alerta de conflicto de horario general.
    // Pero si al menos una de ellas no es simultánea, se reporta el cruce de horario!
    if (!(esSimultanea && otraEsSimultanea)) {
      const detalle = {
        actividadConflictiva: otra,
        tipo: 'horario',
        mensaje: `Cruce de horario con la actividad «${otra.nombre}» (${mismoHorarioRango}). ${
          esSimultanea && !otraEsSimultanea
            ? `«${otra.nombre}» no está marcada como simultánea.`
            : !esSimultanea && otraEsSimultanea
            ? 'Esta actividad no está marcada como simultánea.'
            : 'Ninguna de las actividades fue marcada para desarrollarse en paralelo.'
        }`,
      };
      conflictosHorario.push(detalle);
      motivos.push(detalle.mensaje);
    }
  }

  // 2. Evaluar disponibilidad horaria registrada de la Sala (HU-20 / HU-21)
  if (salaSeleccionada?.disponibilidad && salaSeleccionada.disponibilidad.length > 0) {
    const salaCubierta = estaCubiertoPorDisponibilidad(actividad, salaSeleccionada.disponibilidad);
    if (!salaCubierta) {
      const detalle = {
        tipo: 'disponibilidad_sala',
        mensaje: `La sala «${nombreSala}» no tiene franja de disponibilidad registrada para el horario ${formatearHora(
          actividad.horaInicio
        )} a ${formatearHora(actividad.horaFin)} en la fecha ${actividad.fecha}.`,
      };
      conflictosDisponibilidad.push(detalle);
      motivos.push(detalle.mensaje);
    }
  }

  // 3. Evaluar disponibilidad horaria registrada del Ponente (HU-20 / HU-21)
  if (ponenteSeleccionado?.disponibilidad && ponenteSeleccionado.disponibilidad.length > 0) {
    const ponenteCubierto = estaCubiertoPorDisponibilidad(actividad, ponenteSeleccionado.disponibilidad);
    if (!ponenteCubierto) {
      const detalle = {
        tipo: 'disponibilidad_ponente',
        mensaje: `El ponente «${nombrePonente}» no tiene franja de disponibilidad registrada para el horario ${formatearHora(
          actividad.horaInicio
        )} a ${formatearHora(actividad.horaFin)} en la fecha ${actividad.fecha}.`,
      };
      conflictosDisponibilidad.push(detalle);
      motivos.push(detalle.mensaje);
    }
  }

  const hayConflicto =
    conflictosHorario.length > 0 ||
    conflictosSala.length > 0 ||
    conflictosPonente.length > 0 ||
    conflictosDisponibilidad.length > 0;

  return {
    hayConflicto,
    conflictosHorario,
    conflictosSala,
    conflictosPonente,
    conflictosDisponibilidad,
    motivos,
  };
}

/**
 * Criterio 1: Ordena una lista de actividades estrictamente de manera cronológica:
 * 1. Fecha ascendente.
 * 2. Hora de inicio ascendente.
 * 3. Hora de fin ascendente.
 * 4. Nombre ascendente.
 *
 * @param {Array<Object>} actividades
 * @returns {Array<Object>} Nueva lista ordenada cronológicamente
 */
export function ordenarCronologicamente(actividades = []) {
  if (!Array.isArray(actividades)) return [];

  return [...actividades].sort((a, b) => {
    // 1. Fecha
    if (a.fecha !== b.fecha) {
      return (a.fecha || '').localeCompare(b.fecha || '');
    }
    // 2. Hora inicio
    const minInicioA = horaAMinutos(a.horaInicio);
    const minInicioB = horaAMinutos(b.horaInicio);
    if (minInicioA !== minInicioB) {
      return minInicioA - minInicioB;
    }
    // 3. Hora fin
    const minFinA = horaAMinutos(a.horaFin);
    const minFinB = horaAMinutos(b.horaFin);
    if (minFinA !== minFinB) {
      return minFinA - minFinB;
    }
    // 4. Nombre
    return (a.nombre || '').localeCompare(b.nombre || '');
  });
}

/**
 * Agrupa actividades cronológicamente por día de evento para presentación en timeline.
 * @param {Array<Object>} actividades
 * @returns {Array<{ fecha: string, fechaTexto: string, actividades: Array<Object> }>}
 */
export function agruparPorFecha(actividades = []) {
  const ordenadas = ordenarCronologicamente(actividades);
  const mapa = new Map();

  for (const act of ordenadas) {
    const f = act.fecha || 'Sin fecha';
    if (!mapa.has(f)) {
      mapa.set(f, []);
    }
    mapa.get(f).push(act);
  }

  return Array.from(mapa.entries()).map(([fecha, lista]) => ({
    fecha,
    fechaTexto: formatearFechaLarga(fecha),
    actividades: lista,
  }));
}
