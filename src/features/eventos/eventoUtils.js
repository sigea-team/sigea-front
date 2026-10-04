/**
 * @file eventoUtils.js
 * @description Utilidades del módulo de eventos (HU-04): etiquetas, formato de fechas,
 * cálculo de semestre, validaciones del formulario y lectura de errores de la API.
 * @module features/eventos/eventoUtils
 */

/** Etiquetas de los estados del evento (CHECK de la tabla eventos). */
export const ESTADOS_EVENTO = {
  en_configuracion: 'En configuración',
  habilitado: 'Habilitado',
  en_ejecucion: 'En ejecución',
  cerrado: 'Cerrado',
};

/** Opciones de modalidad (CHECK de la tabla eventos). */
export const MODALIDADES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hibrida', label: 'Híbrida' },
];

const SEMESTRE_REGEX = /^\d{4}-[12]$/;

/** Longitudes máximas; coinciden con las validaciones @Size de EventoRequest en el backend. */
export const LIMITES = { objetivo: 1000, descripcion: 4000 };

/** @param {string} modalidad */
export function etiquetaModalidad(modalidad) {
  return MODALIDADES.find((m) => m.value === modalidad)?.label || '—';
}

/**
 * Solo los eventos en configuración se pueden editar o eliminar (Criterios 2 y 5).
 * @param {{estado: string}} evento
 */
export function esEditable(evento) {
  return evento?.estado === 'en_configuracion';
}

/**
 * Convierte "AAAA-MM-DD" en fecha local sin desfase de zona horaria.
 * @param {string} iso
 */
function aFecha(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

/** @param {string} iso - "2026-10-20" → "20 oct 2026" */
export function formatearFecha(iso) {
  const fecha = aFecha(iso);
  return fecha ? formatoFecha.format(fecha).replace('.', '') : '—';
}

/** @param {string} inicio @param {string} fin */
export function formatearRango(inicio, fin) {
  if (!inicio) return '—';
  if (!fin || inicio === fin) return formatearFecha(inicio);
  return `${formatearFecha(inicio)} – ${formatearFecha(fin)}`;
}

/**
 * Misma regla que el backend: enero–junio → AAAA-1, julio–diciembre → AAAA-2.
 * @param {string} fechaInicio - "AAAA-MM-DD"
 * @returns {string|null}
 */
export function calcularSemestre(fechaInicio) {
  const fecha = aFecha(fechaInicio);
  if (!fecha) return null;
  return `${fecha.getFullYear()}-${fecha.getMonth() < 6 ? 1 : 2}`;
}

/**
 * Valida en el cliente los mismos campos que valida el backend en EventoRequest.
 * @param {Object} form
 * @returns {Object} errores por campo (vacío si todo está bien)
 */
export function validarEvento(form) {
  const errores = {};
  if (!form.nombre.trim()) errores.nombre = 'Escribe el nombre del evento.';
  else if (form.nombre.trim().length > 200) errores.nombre = 'El nombre no puede superar los 200 caracteres.';
  if (!form.tipo.trim()) errores.tipo = 'Indica el tipo de evento.';
  else if (form.tipo.trim().length > 50) errores.tipo = 'El tipo no puede superar los 50 caracteres.';
  if (!form.modalidad) errores.modalidad = 'Selecciona la modalidad.';
  if (form.objetivo.trim().length > LIMITES.objetivo) {
    errores.objetivo = `El objetivo no puede superar los ${LIMITES.objetivo} caracteres.`;
  }
  if (form.descripcion.trim().length > LIMITES.descripcion) {
    errores.descripcion = `La descripción no puede superar los ${LIMITES.descripcion} caracteres.`;
  }
  Object.assign(errores, validarFechasYSemestre(form));
  return errores;
}

/**
 * Valida los campos de una nueva edición (NuevaEdicionRequest).
 * @param {Object} form
 */
export function validarEdicion(form) {
  const errores = {};
  if (form.nombre.trim().length > 200) errores.nombre = 'El nombre no puede superar los 200 caracteres.';
  Object.assign(errores, validarFechasYSemestre(form));
  return errores;
}

function validarFechasYSemestre(form) {
  const errores = {};
  if (!form.fechaInicio) errores.fechaInicio = 'Selecciona la fecha de inicio.';
  if (!form.fechaFin) errores.fechaFin = 'Selecciona la fecha de fin.';
  if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
    errores.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio.';
  }
  if (form.semestre.trim() && !SEMESTRE_REGEX.test(form.semestre.trim())) {
    errores.semestre = 'Usa el formato AAAA-1 o AAAA-2, por ejemplo 2026-2.';
  }
  return errores;
}

/** Texto vacío → null, para no enviar cadenas vacías al backend. */
export function textoONulo(valor) {
  const limpio = (valor || '').trim();
  return limpio ? limpio : null;
}

/** Mensajes de respaldo cuando el backend responde sin un "message" utilizable. */
const MENSAJE_POR_ESTADO = {
  400: 'Los datos enviados no son válidos. Revisa el formulario.',
  404: 'El evento ya no existe. Recarga la página para ver la información actualizada.',
  409: 'La operación entra en conflicto con el estado actual del evento. Recarga la página e intenta de nuevo.',
  500: 'El servidor tuvo un problema al procesar la solicitud. Intenta de nuevo en unos minutos.',
};

/** Nombres de campo del backend que se muestran en otro campo del formulario. */
const CAMPO_EQUIVALENTE = { rangoFechasValido: 'fechaFin' };

/**
 * Traduce un error de Axios a un mensaje general y errores por campo.
 * Sigue el formato ErrorResponse del backend: { message, codigo, erroresValidacion }.
 * @param {any} err
 * @returns {{ mensaje: string, campos: Object, status: number|undefined, codigo: string|undefined }}
 */
export function extraerError(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const campos = {};

  if (data?.erroresValidacion && typeof data.erroresValidacion === 'object') {
    Object.entries(data.erroresValidacion).forEach(([campo, mensaje]) => {
      campos[CAMPO_EQUIVALENTE[campo] || campo] = mensaje;
    });
  }

  // El mensaje del backend solo se usa si es texto; un cuerpo no estándar (HTML de un proxy,
  // objeto sin "message") no se muestra tal cual.
  const mensajeBackend = typeof data?.message === 'string' && data.message.trim() ? data.message : null;

  let mensaje;
  if (status === 403) {
    mensaje = 'Tu usuario no tiene permiso para esta acción. Pide al administrador los permisos de eventos.';
  } else if (status === 401) {
    mensaje = 'Tu sesión expiró. Inicia sesión de nuevo.';
  } else if (mensajeBackend) {
    mensaje = mensajeBackend;
  } else if (err?.request && !err?.response) {
    mensaje = 'No fue posible conectarse con el servidor. Verifica que el backend esté activo.';
  } else {
    mensaje = MENSAJE_POR_ESTADO[status] || (status >= 500 ? MENSAJE_POR_ESTADO[500] : 'Ocurrió un error inesperado. Intenta de nuevo.');
  }

  return { mensaje, campos, status, codigo: data?.codigo };
}
