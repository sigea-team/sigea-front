/**
 * @file asistenciaUtils.js
 * @description Funciones puras de HU-24: interpretación de la respuesta del registro de asistencia, combinación de
 * inscritos con asistencias y control de lecturas repetidas del escáner.
 * @module features/asistencia/asistenciaUtils
 */

/** Tiempo durante el que se ignora una segunda lectura del mismo código (la cámara lee varias veces por segundo). */
export const VENTANA_LECTURA_REPETIDA_MS = 4000;

/** Longitud máxima que acepta el backend para el código. */
export const MAX_CODIGO = 100;

/** Títulos de cada rechazo del registro (Criterio 3). */
export const TITULO_RECHAZO = {
  QR_INVALIDO: 'Código QR no reconocido',
  QR_NO_VIGENTE: 'Código QR no vigente',
  QR_OTRO_EVENTO: 'QR de otro evento',
  NO_INSCRITO_ACTIVIDAD: 'No está inscrito en esta actividad',
  ACTIVIDAD_NO_DISPONIBLE: 'Actividad no disponible',
  EVENTO_NO_DISPONIBLE: 'Evento no disponible',
  ASISTENCIA_DUPLICADA: 'Asistencia ya registrada',
};

/**
 * Limpia el texto leído (espacios, saltos de línea de los lectores USB).
 * @param {string} texto
 * @returns {string}
 */
export function normalizarCodigo(texto) {
  return String(texto ?? '').replace(/[\r\n\t]/g, '').trim();
}

/**
 * Valida el código antes de enviarlo.
 * @param {string} texto
 * @returns {string|null} Mensaje de error o null si es válido.
 */
export function validarCodigo(texto) {
  const codigo = normalizarCodigo(texto);
  if (!codigo) return 'Escanea o escribe el código QR del participante.';
  if (codigo.length > MAX_CODIGO) return `El código no puede superar ${MAX_CODIGO} caracteres.`;
  return null;
}

/**
 * Marca de tiempo actual en milisegundos. Se usa desde los manejadores de eventos del registro; vive fuera del
 * componente para que la regla `react-hooks/purity` no la confunda con una llamada durante el render.
 * @returns {number}
 */
export function instanteActual() {
  return Date.now();
}

/**
 * Indica si una lectura es la repetición inmediata de la anterior (misma cadena dentro de la ventana).
 * @param {{ codigo: string, instante: number } | null} ultima
 * @param {string} codigo
 * @param {number} instante - Milisegundos (Date.now()).
 * @param {number} [ventanaMs]
 * @returns {boolean}
 */
export function esLecturaRepetida(ultima, codigo, instante, ventanaMs = VENTANA_LECTURA_REPETIDA_MS) {
  if (!ultima) return false;
  return ultima.codigo === normalizarCodigo(codigo) && instante - ultima.instante < ventanaMs;
}

/**
 * Hora HH:MM de una fecha-hora ISO del backend (sin cambiar de zona: el backend envía hora local).
 * @param {string} fechaHora - Por ejemplo '2026-11-20T09:03:12.5'.
 * @returns {string}
 */
export function horaRegistro(fechaHora) {
  if (!fechaHora) return '';
  const m = String(fechaHora).match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
}

/**
 * Fecha DD/MM/AAAA de una fecha-hora ISO del backend.
 * @param {string} fechaHora
 * @returns {string}
 */
export function fechaRegistro(fechaHora) {
  if (!fechaHora) return '';
  const m = String(fechaHora).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/**
 * Convierte la respuesta del registro (éxito o error de axios) en el resultado que muestra el escáner.
 * @param {{ asistencia?: Object, error?: any }} entrada
 * @returns {{ tipo: 'registrada'|'duplicada'|'rechazada'|'error', titulo: string, mensaje: string,
 *   codigo?: string, asistencia?: Object }}
 */
export function interpretarRegistro({ asistencia, error } = {}) {
  if (asistencia) {
    return {
      tipo: 'registrada',
      titulo: 'Asistencia registrada',
      mensaje: `${asistencia.participanteNombre || 'Participante'} · ${horaRegistro(asistencia.fechaHoraRegistro)}`,
      asistencia,
    };
  }
  const status = error?.response?.status;
  const data = error?.response?.data;
  const codigo = data?.codigo;
  const mensajeBackend = typeof data?.message === 'string' && data.message.trim() ? data.message : null;

  if (codigo === 'ASISTENCIA_DUPLICADA') {
    const previa = data?.asistenciaExistente || null;
    return {
      tipo: 'duplicada',
      titulo: TITULO_RECHAZO.ASISTENCIA_DUPLICADA,
      mensaje: previa
        ? `${previa.participanteNombre || 'El participante'} ya registró su asistencia a las ${horaRegistro(previa.fechaHoraRegistro)}. No se registró de nuevo.`
        : mensajeBackend || 'La asistencia ya estaba registrada. No se registró de nuevo.',
      codigo,
      asistencia: previa || undefined,
    };
  }
  if (codigo && TITULO_RECHAZO[codigo]) {
    return { tipo: 'rechazada', titulo: TITULO_RECHAZO[codigo], mensaje: mensajeBackend || TITULO_RECHAZO[codigo], codigo };
  }
  if (status === 400) {
    return { tipo: 'rechazada', titulo: 'Código no válido', mensaje: mensajeBackend || 'Revisa el código e intenta de nuevo.', codigo };
  }
  if (status === 403) {
    return { tipo: 'error', titulo: 'Sin permiso', mensaje: 'Tu usuario no tiene permiso para registrar asistencia.', codigo };
  }
  if (status === 404) {
    return { tipo: 'error', titulo: 'No encontrado', mensaje: mensajeBackend || 'La actividad o la inscripción no existe en este evento.', codigo };
  }
  if (error?.request && !error?.response) {
    return { tipo: 'error', titulo: 'Sin conexión', mensaje: 'No fue posible conectarse con el servidor. Intenta de nuevo.' };
  }
  return { tipo: 'error', titulo: 'No se pudo registrar', mensaje: mensajeBackend || 'Ocurrió un error inesperado. Intenta de nuevo.', codigo };
}

/**
 * Mensaje para errores de las demás operaciones (cargar, reenviar).
 * @param {any} err
 * @param {string} porDefecto
 * @returns {string}
 */
export function mensajeError(err, porDefecto) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const mensajeBackend = data && typeof data.message === 'string' && data.message.trim() ? data.message : null;
  if (status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.';
  if (status === 403) return 'Tu usuario no tiene permiso para esta acción.';
  if (mensajeBackend) return mensajeBackend;
  if (status === 404) return 'No se encontró la información solicitada.';
  if (err?.request && !err?.response) return 'No fue posible conectarse con el servidor. Intenta de nuevo.';
  return porDefecto;
}

/**
 * Une los inscritos de la actividad con su inscripción al evento (nombre, correo, categoría) y su asistencia.
 * Pendientes primero y luego por nombre.
 * @param {Array<{ inscripcionId: number }>} inscritosActividad - GET /actividades/{id}/inscripciones.
 * @param {Array<{ inscripcionId: number, personaNombre: string, personaCorreo: string, categoria: string }>} inscripcionesEvento
 * @param {Array<{ inscripcionId: number }>} asistencias
 * @returns {Array<{ inscripcionId: number, nombre: string, correo: string, categoria: string, asistencia: Object|null }>}
 */
export function combinarInscritos(inscritosActividad = [], inscripcionesEvento = [], asistencias = []) {
  const porInscripcion = new Map(inscripcionesEvento.map((i) => [String(i.inscripcionId), i]));
  const asistenciaPor = new Map(asistencias.map((a) => [String(a.inscripcionId), a]));
  const vistos = new Set();
  const filas = [];
  for (const ia of inscritosActividad) {
    const id = String(ia.inscripcionId);
    if (vistos.has(id)) continue;
    vistos.add(id);
    const ie = porInscripcion.get(id);
    filas.push({
      inscripcionId: ia.inscripcionId,
      nombre: ie?.personaNombre || `Inscripción #${ia.inscripcionId}`,
      correo: ie?.personaCorreo || '',
      categoria: ie?.categoria || '',
      asistencia: asistenciaPor.get(id) || null,
    });
  }
  return filas.sort((a, b) => {
    if (!a.asistencia !== !b.asistencia) return a.asistencia ? 1 : -1;
    return a.nombre.localeCompare(b.nombre, 'es');
  });
}

/**
 * Filtra la lista combinada por nombre o correo (sin tildes ni mayúsculas).
 * @param {Array<{ nombre: string, correo: string }>} filas
 * @param {string} texto
 * @returns {Array<Object>}
 */
export function filtrarInscritos(filas, texto) {
  const q = sinTildes(texto).trim();
  if (!q) return filas;
  return filas.filter((f) => sinTildes(f.nombre).includes(q) || sinTildes(f.correo).includes(q));
}

function sinTildes(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Porcentaje de asistencia (0-100) redondeado.
 * @param {number} asistentes
 * @param {number} inscritos
 * @returns {number}
 */
export function porcentajeAsistencia(asistentes, inscritos) {
  if (!inscritos || inscritos <= 0) return 0;
  return Math.min(100, Math.round((asistentes / inscritos) * 100));
}

/**
 * Nombre del archivo PNG que descarga el participante.
 * @param {string} eventoNombre
 * @returns {string}
 */
export function nombreArchivoQr(eventoNombre) {
  const base = sinTildes(eventoNombre)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `qr-${base || 'evento'}.png`;
}
