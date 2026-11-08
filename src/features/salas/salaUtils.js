/**
 * @file salaUtils.js
 * @description Utilidades, validaciones y detector de conflictos para el módulo de salas
 * y disponibilidad de espacios y ponentes (HU-20: Criterios 1 al 5).
 * @module features/salas/salaUtils
 */

export const TIPOS_SALA = [
  { value: 'fisica', label: 'Física' },
  { value: 'virtual', label: 'Virtual' },
];

export const ETIQUETAS_TIPO_SALA = {
  fisica: 'Física',
  virtual: 'Virtual',
};

/**
 * Convierte "HH:mm" a minutos desde medianoche para comparaciones seguras.
 * @param {string} hora - formato "HH:mm"
 * @returns {number}
 */
export function horaAMinutos(hora) {
  if (!hora || typeof hora !== 'string') return 0;
  const [h, m] = hora.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Formatea una hora "HH:mm" a formato legible con am/pm.
 * @param {string} hora - "14:30"
 * @returns {string} - "02:30 p. m."
 */
export function formatearHora(hora) {
  if (!hora) return '—';
  const [h, m] = hora.split(':').map(Number);
  const periodo = h >= 12 ? 'p. m.' : 'a. m.';
  const horas12 = h % 12 === 0 ? 12 : h % 12;
  const minutos = String(m).padStart(2, '0');
  return `${String(horas12).padStart(2, '0')}:${minutos} ${periodo}`;
}

/**
 * Formatea una franja horaria: "2026-10-21: 08:00 a. m. – 12:00 m."
 * @param {{ fecha?: string, horaInicio: string, horaFin: string }} franja
 */
export function formatearFranja(franja) {
  if (!franja) return '—';
  const textoHoras = `${formatearHora(franja.horaInicio)} – ${formatearHora(franja.horaFin)}`;
  return franja.fecha ? `${franja.fecha} (${textoHoras})` : textoHoras;
}

/**
 * Valida los datos básicos de una sala (Criterio 1 y Criterio 3).
 * - Nombre obligatorio y único por evento.
 * - Tipo obligatorio ('fisica' | 'virtual').
 * - Aforo máximo estrictamente mayor a cero y número entero.
 *
 * @param {{ nombre?: string, ubicacion?: string, tipo?: string, aforoMaximo?: any }} form
 * @param {Array<Object>} salasExistentes - Lista de salas ya registradas en el evento
 * @param {number|string|null} [salaIdExcluir] - ID de la sala que se está editando (para no colisionar consigo misma)
 * @returns {Object} Errores por campo (objeto vacío si todo es válido)
 */
export function validarSala(form, salasExistentes = [], salaIdExcluir = null) {
  const errores = {};

  const nombreLimpio = (form.nombre || '').trim();
  if (!nombreLimpio) {
    errores.nombre = 'Escribe el nombre de la sala.';
  } else if (nombreLimpio.length > 100) {
    errores.nombre = 'El nombre no puede superar los 100 caracteres.';
  } else {
    // Criterio 3: Rechaza duplicidad de nombre en el mismo evento (case-insensitive)
    const nombreDuplicado = salasExistentes.some((s) => {
      if (salaIdExcluir && String(s.id ?? s.salaId) === String(salaIdExcluir)) {
        return false;
      }
      return (s.nombre || '').trim().toLowerCase() === nombreLimpio.toLowerCase();
    });

    if (nombreDuplicado) {
      errores.nombre = `Ya existe una sala llamada «${nombreLimpio}» en este evento.`;
    }
  }

  if (!form.tipo) {
    errores.tipo = 'Selecciona el tipo de sala (física o virtual).';
  } else if (!['fisica', 'virtual'].includes(form.tipo)) {
    errores.tipo = 'El tipo de sala debe ser física o virtual.';
  }

  // Criterio 3: Aforo negativo o en cero
  const aforoNum = Number(form.aforoMaximo);
  if (
    form.aforoMaximo === '' ||
    form.aforoMaximo === null ||
    form.aforoMaximo === undefined ||
    Number.isNaN(aforoNum) ||
    !Number.isInteger(aforoNum) ||
    aforoNum <= 0
  ) {
    errores.aforoMaximo = 'El aforo máximo debe ser un número entero mayor a cero.';
  }

  return errores;
}

/**
 * Valida una franja horaria individual de disponibilidad.
 * @param {{ fecha?: string, horaInicio?: string, horaFin?: string }} franja
 * @param {Array<Object>} [franjasExistentes]
 * @param {number|string|null} [franjaIdExcluir]
 * @returns {Object} Errores por campo
 */
export function validarFranjaDisponibilidad(franja, franjasExistentes = [], franjaIdExcluir = null) {
  const errores = {};

  if (!franja.fecha) {
    errores.fecha = 'Selecciona la fecha.';
  }

  if (!franja.horaInicio) {
    errores.horaInicio = 'Indica la hora de inicio.';
  }

  if (!franja.horaFin) {
    errores.horaFin = 'Indica la hora de fin.';
  }

  if (franja.horaInicio && franja.horaFin) {
    const inicioMin = horaAMinutos(franja.horaInicio);
    const finMin = horaAMinutos(franja.horaFin);

    if (finMin <= inicioMin) {
      errores.horaFin = 'La hora de fin debe ser posterior a la hora de inicio.';
    } else if (franja.fecha && Array.isArray(franjasExistentes)) {
      // Verificar solapamiento con franjas existentes en la misma fecha
      const solapada = franjasExistentes.some((otra) => {
        if (franjaIdExcluir && String(otra.id) === String(franjaIdExcluir)) return false;
        if (otra.fecha !== franja.fecha) return false;
        const oIni = horaAMinutos(otra.horaInicio);
        const oFin = horaAMinutos(otra.horaFin);
        return inicioMin < oFin && finMin > oIni;
      });

      if (solapada) {
        errores.general = 'Esta franja horaria se cruza con otra ya configurada para la misma fecha.';
      }
    }
  }

  return errores;
}

/**
 * Verifica si un rango de actividad (fecha, horaInicio, horaFin) está completamente cubierto
 * dentro de al menos una de las franjas de disponibilidad provistas.
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
 * Criterio 4 (Parte a):
 * Verifica si al modificar el aforo de una sala existen actividades ya programadas
 * con inscripciones activas que superan el nuevo aforo.
 *
 * @param {number|string} nuevoAforo - Nuevo aforo propuesto
 * @param {Array<Object>} actividadesSala - Actividades programadas en la sala
 * @returns {{ hayConflicto: boolean, actividadesAfectadas: Array<Object>, maxInscripciones: number }}
 */
export function verificarConflictoAforo(nuevoAforo, actividadesSala = []) {
  const aforo = Number(nuevoAforo);
  if (Number.isNaN(aforo) || aforo <= 0) {
    return { hayConflicto: false, actividadesAfectadas: [], maxInscripciones: 0 };
  }

  const actividadesAfectadas = actividadesSala.filter((act) => {
    const inscritos = Number(act.inscripcionesActivas ?? act.asistentesInscritos ?? 0);
    return inscritos > aforo;
  });

  const maxInscripciones = actividadesAfectadas.reduce((max, act) => {
    const inscritos = Number(act.inscripcionesActivas ?? act.asistentesInscritos ?? 0);
    return Math.max(max, inscritos);
  }, 0);

  return {
    hayConflicto: actividadesAfectadas.length > 0,
    actividadesAfectadas,
    maxInscripciones,
  };
}

/**
 * Criterio 4 (Parte b):
 * Verifica si una actividad que se intenta programar entra en conflicto por horario
 * con la disponibilidad horaria de la sala y/o con la disponibilidad del ponente.
 *
 * @param {{ fecha: string, horaInicio: string, horaFin: string }} actividad
 * @param {Array<Object>} franjasSala - Disponibilidad de la sala elegida
 * @param {Array<Object>|null} [franjasPonente] - Disponibilidad del ponente asignado. `null`/`undefined` = la
 *   actividad no tiene ponente; un arreglo vacío = el ponente no registró disponibilidad (se trata como conflicto).
 * @returns {{
 *   hayConflicto: boolean,
 *   conflictoSala: boolean,
 *   conflictoPonente: boolean,
 *   motivos: Array<string>
 * }}
 */
export function verificarConflictoProgramacionActividad(actividad, franjasSala = [], franjasPonente = null) {
  const motivos = [];
  let conflictoSala = false;
  let conflictoPonente = false;
  const horario = `(${formatearHora(actividad.horaInicio)} – ${formatearHora(actividad.horaFin)}) en la fecha ${
    actividad.fecha
  }`;

  // Revisar disponibilidad de la sala. Sin franjas registradas (null, undefined o vacío) también es conflicto.
  const salaSinDisponibilidad = !Array.isArray(franjasSala) || franjasSala.length === 0;
  if (salaSinDisponibilidad) {
    conflictoSala = true;
    motivos.push(`La sala no tiene disponibilidad horaria registrada, así que la actividad ${horario} está fuera de la disponibilidad.`);
  } else if (!estaCubiertoPorDisponibilidad(actividad, franjasSala)) {
    conflictoSala = true;
    motivos.push(`El horario de la actividad ${horario} está fuera de la disponibilidad horaria registrada para la sala.`);
  }

  // Revisar disponibilidad del ponente si hay uno asignado (null/undefined = actividad sin ponente).
  // Un ponente asignado sin franjas registradas es conflicto, no un caso válido (Criterios 2, 4 y 5).
  if (franjasPonente !== null && franjasPonente !== undefined) {
    const ponenteSinDisponibilidad = !Array.isArray(franjasPonente) || franjasPonente.length === 0;
    if (ponenteSinDisponibilidad) {
      conflictoPonente = true;
      motivos.push(
        `El ponente asignado no tiene disponibilidad registrada en este evento, así que la actividad ${horario} queda fuera de su disponibilidad.`
      );
    } else if (!estaCubiertoPorDisponibilidad(actividad, franjasPonente)) {
      conflictoPonente = true;
      motivos.push(`El ponente asignado no tiene disponibilidad registrada para el horario ${horario}.`);
    }
  }

  return {
    hayConflicto: conflictoSala || conflictoPonente,
    conflictoSala,
    conflictoPonente,
    motivos,
  };
}

/**
 * Criterio 5:
 * Cuando la disponibilidad de una sala o de un ponente cambia, revisa las actividades
 * ya programadas y devuelve cuáles quedan en conflicto (fuera del nuevo horario disponible).
 *
 * @param {Array<Object>} nuevasFranjas - Nuevas franjas de disponibilidad que se van a guardar
 * @param {Array<Object>} actividadesProgramadas - Actividades ya programadas en la sala o con ese ponente
 * @returns {{ hayConflicto: boolean, actividadesEnConflicto: Array<Object> }}
 */
export function verificarConflictosCambioDisponibilidad(nuevasFranjas = [], actividadesProgramadas = []) {
  if (!Array.isArray(actividadesProgramadas) || actividadesProgramadas.length === 0) {
    return { hayConflicto: false, actividadesEnConflicto: [] };
  }

  const actividadesEnConflicto = actividadesProgramadas.filter((actividad) => {
    const cubierta = estaCubiertoPorDisponibilidad(actividad, nuevasFranjas);
    return !cubierta;
  });

  return {
    hayConflicto: actividadesEnConflicto.length > 0,
    actividadesEnConflicto,
  };
}


// ──────────────────────────────────────────────────────────────────────────
// Traducción entre la API del backend (HU-20) y el formato de la interfaz
// ──────────────────────────────────────────────────────────────────────────

/**
 * Recorta una hora del backend ("08:00:00") al formato de la interfaz ("08:00").
 * @param {string|null|undefined} hora
 * @returns {string}
 */
export function normalizarHoraApi(hora) {
  return typeof hora === 'string' ? hora.slice(0, 5) : '';
}

/**
 * Convierte las franjas de la interfaz al cuerpo que espera el backend.
 * @param {Array<{ fecha: string, horaInicio: string, horaFin: string }>} franjas
 * @returns {Array<{ fecha: string, horaInicio: string, horaFin: string }>}
 */
export function aFranjasApi(franjas = []) {
  return (Array.isArray(franjas) ? franjas : []).map((f) => ({
    fecha: f.fecha,
    horaInicio: normalizarHoraApi(f.horaInicio),
    horaFin: normalizarHoraApi(f.horaFin),
  }));
}

/**
 * Convierte franjas del backend ({ id, fecha, horaInicio: "08:00:00", ... }) al formato de la interfaz.
 * @param {Array<Object>} franjas
 */
export function normalizarFranjasApi(franjas = []) {
  return (Array.isArray(franjas) ? franjas : []).map((f) => ({
    id: f.id,
    fecha: f.fecha,
    horaInicio: normalizarHoraApi(f.horaInicio),
    horaFin: normalizarHoraApi(f.horaFin),
  }));
}

/**
 * Convierte una SalaResponse del backend al formato de la interfaz (usa `disponibilidad`).
 * @param {Object} sala
 */
export function normalizarSalaApi(sala) {
  if (!sala) return sala;
  return {
    id: sala.id,
    eventoId: sala.eventoId,
    nombre: sala.nombre,
    ubicacion: sala.ubicacion || '',
    tipo: sala.tipo ? String(sala.tipo).toLowerCase() : '',
    aforoMaximo: sala.aforoMaximo,
    permiteSimultaneidad: Boolean(sala.permiteSimultaneidad),
    disponibilidad: normalizarFranjasApi(sala.disponibilidades),
  };
}

/**
 * Construye el SalaRequest del backend a partir de los datos del formulario.
 * Si `permiteSimultaneidad` no viene, no se envía y el backend conserva el valor actual de la sala.
 * @param {{ nombre: string, ubicacion?: string, tipo: string, aforoMaximo: number, permiteSimultaneidad?: boolean, disponibilidad?: Array }} datos
 */
export function aSalaRequest(datos = {}) {
  return {
    nombre: (datos.nombre || '').trim(),
    ubicacion: datos.ubicacion ? String(datos.ubicacion).trim() : null,
    tipo: datos.tipo ? String(datos.tipo).toLowerCase() : null,
    aforoMaximo: Number(datos.aforoMaximo),
    permiteSimultaneidad: datos.permiteSimultaneidad,
    disponibilidades: aFranjasApi(datos.disponibilidad),
  };
}

/**
 * Convierte un conferencista del evento y su disponibilidad al formato de ponente de la interfaz.
 * @param {{ personaId: number, nombreCompleto: string, correo?: string }} conferencista
 * @param {Array<Object>} disponibilidad - DisponibilidadPonenteResponse[]
 */
export function normalizarPonenteApi(conferencista, disponibilidad = []) {
  return {
    personaId: conferencista.personaId,
    nombres: conferencista.nombreCompleto || '',
    apellidos: '',
    correo: conferencista.correo || '',
    disponibilidad: normalizarFranjasApi(disponibilidad),
  };
}
