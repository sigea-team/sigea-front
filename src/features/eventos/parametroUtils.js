/**
 * @file parametroUtils.js
 * @description Utilidades de los parámetros del evento (HU-05): configuración de cada catálogo
 * (tipos de actividad y líneas temáticas), normalización de nombres, validación y textos de uso.
 * @module features/eventos/parametroUtils
 */

/**
 * Estados del evento en los que los catálogos se pueden modificar. Es la misma regla que aplica
 * el backend (ParametroEventoReglas.ESTADOS_CATALOGO_MODIFICABLE); desde "en ejecución" quedan
 * en solo lectura.
 */
export const ESTADOS_CATALOGO_MODIFICABLE = ['en_configuracion', 'habilitado'];

/** @param {{estado: string}} evento */
export function esCatalogoModificable(evento) {
  return ESTADOS_CATALOGO_MODIFICABLE.includes(evento?.estado);
}

/** Longitud máxima de la descripción (columna VARCHAR(255) en ambos catálogos). */
export const MAX_DESCRIPCION = 255;

/**
 * Textos y límites de cada catálogo. Los límites de nombre coinciden con las validaciones
 * @Size de TipoActividadRequest (80) y LineaTematicaRequest (120) en el backend.
 */
export const CATALOGOS = {
  tipos: {
    clave: 'tipos',
    titulo: 'Tipos de actividad',
    singular: 'tipo de actividad',
    maxNombre: 80,
    ayuda: 'Cada actividad de la agenda se clasifica en uno de estos tipos.',
    placeholderNombre: 'Taller',
    placeholderDescripcion: 'Sesión práctica de 2 a 4 horas con cupo limitado',
    vacioTitulo: 'Todavía no hay tipos de actividad',
    vacioTexto: 'Agrega los que se usarán al programar la agenda, por ejemplo Conferencia, Taller o Panel.',
    reasignar: 'Reasigna esas actividades a otro tipo antes de eliminarlo.',
  },
  lineas: {
    clave: 'lineas',
    titulo: 'Líneas temáticas',
    singular: 'línea temática',
    maxNombre: 120,
    ayuda: 'Los autores eligen una línea al enviar su propuesta, y las actividades de la agenda también se clasifican por línea.',
    placeholderNombre: 'Inteligencia artificial y ciencia de datos',
    placeholderDescripcion: 'Aprendizaje automático, analítica y visualización de datos',
    vacioTitulo: 'Todavía no hay líneas temáticas',
    vacioTexto: 'Agrega las áreas de conocimiento en las que se recibirán propuestas.',
    reasignar: 'Reasigna esos registros a otra línea antes de eliminarla.',
  },
};

/**
 * Misma normalización que el backend: quita espacios al inicio y al final y colapsa los
 * espacios repetidos, para que " Mesa   redonda " se guarde como "Mesa redonda".
 * @param {string} texto
 */
export function normalizarNombre(texto) {
  return (texto || '').trim().replace(/\s+/g, ' ');
}

/**
 * Indica si ya existe un elemento con el mismo nombre, sin distinguir mayúsculas ni espacios
 * (Criterio 3). Es una ayuda inmediata; la validación definitiva la hace el backend.
 * @param {Array<{id: number, nombre: string}>} items
 * @param {string} nombre
 * @param {number} [excluirId] - Al editar, el propio elemento no cuenta como duplicado.
 */
export function existeNombre(items, nombre, excluirId) {
  const buscado = normalizarNombre(nombre).toLocaleLowerCase('es');
  return items.some(
    (item) => item.id !== excluirId && normalizarNombre(item.nombre).toLocaleLowerCase('es') === buscado
  );
}

/**
 * Valida el formulario de un elemento del catálogo.
 * @param {{nombre: string, descripcion: string}} form
 * @param {typeof CATALOGOS.tipos} config
 * @param {Array<Object>} items - Elementos actuales, para detectar duplicados.
 * @param {number} [excluirId]
 * @returns {Object} errores por campo (vacío si todo está bien)
 */
export function validarParametro(form, config, items, excluirId) {
  const errores = {};
  const nombre = normalizarNombre(form.nombre);
  if (!nombre) {
    errores.nombre = 'Escribe el nombre.';
  } else if (nombre.length > config.maxNombre) {
    errores.nombre = `El nombre no puede superar los ${config.maxNombre} caracteres.`;
  } else if (existeNombre(items, nombre, excluirId)) {
    errores.nombre = `Ya existe ${config.clave === 'tipos' ? 'un tipo de actividad' : 'una línea temática'} con ese nombre en este evento.`;
  }
  if ((form.descripcion || '').trim().length > MAX_DESCRIPCION) {
    errores.descripcion = `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres.`;
  }
  return errores;
}

/**
 * Datos a enviar al backend: nombre normalizado y descripción vacía como null.
 * @param {{nombre: string, descripcion: string}} form
 */
export function aPeticion(form) {
  const descripcion = (form.descripcion || '').trim();
  return { nombre: normalizarNombre(form.nombre), descripcion: descripcion || null };
}

/**
 * Describe el uso de un elemento, por ejemplo "3 actividades de la agenda y 2 propuestas".
 * @param {{actividades: number, propuestas: number}} uso
 */
export function describirUso(uso) {
  const partes = [];
  if (uso?.actividades > 0) {
    partes.push(`${uso.actividades} ${uso.actividades === 1 ? 'actividad' : 'actividades'} de la agenda`);
  }
  if (uso?.propuestas > 0) {
    partes.push(`${uso.propuestas} ${uso.propuestas === 1 ? 'propuesta' : 'propuestas'}`);
  }
  return partes.join(' y ');
}

/** Orden alfabético en español, igual que el listado del backend. */
export function ordenarPorNombre(items) {
  return [...items].sort(
    (a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }) || a.id - b.id
  );
}
