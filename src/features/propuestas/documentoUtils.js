/**
 * @file documentoUtils.js
 * @description Reglas y textos del envío de propuestas con documentos y de sus versiones (HU-14: RF19, RF20, RF21).
 * Las reglas replican las del backend (ValidadorDocumentosPropuesta y VersionPropuestaService) solo para
 * orientar al usuario antes de enviar; la validación definitiva siempre la hace la API.
 * @module features/propuestas/documentoUtils
 */

import { extraerError } from '../eventos/eventoUtils';

/** Formatos permitidos (app.propuestas.documentos.extensiones-permitidas del backend). */
export const EXTENSIONES_PERMITIDAS = ['pdf', 'doc', 'docx'];

/** Valor del atributo `accept` del input de archivos. */
export const ACCEPT_DOCUMENTOS = EXTENSIONES_PERMITIDAS.map((e) => `.${e}`).join(',');

/** Tamaño máximo por archivo en MB (app.propuestas.documentos.tamano-maximo-mb). */
export const TAMANO_MAXIMO_MB = 10;

/** Cantidad máxima de documentos por versión (app.propuestas.documentos.maximo-por-version). */
export const MAXIMO_DOCUMENTOS = 5;

const TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024;

/** Texto legible de los formatos permitidos: ".pdf, .doc, .docx". */
export const TEXTO_FORMATOS = EXTENSIONES_PERMITIDAS.map((e) => `.${e}`).join(', ');

/**
 * Extensión en minúsculas, sin punto. "Informe.Final.PDF" → "pdf".
 * @param {string} nombre
 * @returns {string}
 */
export function extensionDe(nombre) {
  const limpio = String(nombre || '').trim();
  const punto = limpio.lastIndexOf('.');
  return punto > 0 ? limpio.slice(punto + 1).toLowerCase() : '';
}

/**
 * 524288 → "512 KB"; 2621440 → "2.5 MB".
 * @param {number} bytes
 * @returns {string}
 */
export function formatearTamano(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '0 KB';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  const mb = n / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1).replace(/\.0$/, '')} MB`;
}

/**
 * Valida un archivo antes de adjuntarlo (Criterio 2: formato, tamaño y archivo vacío).
 * @param {{ name: string, size: number }} archivo - File del navegador (o un objeto con name y size).
 * @returns {string|null} Motivo del rechazo, o null si es válido.
 */
export function validarArchivo(archivo) {
  if (!archivo || !archivo.name) return 'El archivo no tiene nombre.';
  if (!EXTENSIONES_PERMITIDAS.includes(extensionDe(archivo.name))) {
    return `Formato no permitido. Formatos permitidos: ${TEXTO_FORMATOS}.`;
  }
  if (!archivo.size || archivo.size <= 0) return 'El archivo está vacío.';
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return `Supera el tamaño máximo permitido de ${TAMANO_MAXIMO_MB} MB.`;
  }
  return null;
}

/**
 * Separa los archivos elegidos en válidos y rechazados, respetando el máximo por versión.
 * @param {Array<{ name: string, size: number }>} nuevos - Archivos que el usuario acaba de elegir.
 * @param {number} [yaIncluidos=0] - Documentos que la versión ya tiene (adjuntos o conservados).
 * @returns {{ validos: Array<Object>, rechazados: Array<{ nombre: string, motivo: string }> }}
 */
export function clasificarArchivos(nuevos, yaIncluidos = 0) {
  const validos = [];
  const rechazados = [];
  let cupo = Math.max(0, MAXIMO_DOCUMENTOS - yaIncluidos);

  (nuevos || []).forEach((archivo) => {
    const motivo = validarArchivo(archivo);
    if (motivo) {
      rechazados.push({ nombre: archivo?.name || 'Archivo sin nombre', motivo });
    } else if (cupo <= 0) {
      rechazados.push({
        nombre: archivo.name,
        motivo: `Se permiten como máximo ${MAXIMO_DOCUMENTOS} documentos por versión.`,
      });
    } else {
      validos.push(archivo);
      cupo -= 1;
    }
  });

  return { validos, rechazados };
}

/** Etiquetas de los campos que el backend devuelve en `erroresValidacion` al enviar una propuesta. */
const CAMPOS_PROPUESTA = {
  titulo: 'Título',
  resumen: 'Resumen',
  palabrasClave: 'Palabras clave',
  convocatoriaId: 'Convocatoria',
  notaCambio: 'Nota del cambio',
  documentos: 'Documentos',
};

/**
 * Convierte `erroresValidacion` en una lista legible. "documentos[1]" → "Documento 2".
 * @param {Object|undefined} errores
 * @returns {Array<string>}
 */
function detallesDeValidacion(errores) {
  if (!errores || typeof errores !== 'object') return [];
  return Object.entries(errores).map(([campo, mensaje]) => {
    const indice = /^documentos\[(\d+)\]$/.exec(campo);
    if (indice) return `Documento ${Number(indice[1]) + 1}: ${mensaje}`;
    const etiqueta = CAMPOS_PROPUESTA[campo];
    return etiqueta ? `${etiqueta}: ${mensaje}` : String(mensaje);
  });
}

/**
 * Traduce un error de la API de propuestas a un título, un mensaje y el detalle por archivo o campo
 * (Criterio 2: "el sistema rechaza la operación e indica el motivo correspondiente").
 * @param {unknown} err
 * @returns {{ codigo: string|null, titulo: string, mensaje: string, detalles: Array<string> }}
 */
export function interpretarErrorPropuesta(err) {
  const data = err?.response?.data;
  const codigo = data?.codigo || null;
  // extraerError da un texto de permisos pensado para eventos; aquí el 403 es sobre la propuesta.
  const mensaje =
    err?.response?.status === 403
      ? 'No tienes permiso para esta operación sobre la propuesta.'
      : extraerError(err).mensaje;
  const detalles = detallesDeValidacion(data?.erroresValidacion);

  const titulos = {
    ARCHIVO_INVALIDO: 'Revisa los documentos adjuntos',
    CONVOCATORIA_CERRADA: 'La convocatoria ya cerró',
    VALIDACION_FALLIDA: 'Faltan datos obligatorios',
    PROPUESTA_BLOQUEADA: 'Propuesta en versión definitiva',
    OPERACION_NO_PERMITIDA: 'Operación no permitida',
    SOLICITUD_INVALIDA: 'No se pudo registrar el cambio',
    ACCESO_DENEGADO: 'Sin permiso',
    ERROR_ALMACENAMIENTO: 'No se pudieron guardar los archivos',
  };

  return {
    codigo,
    titulo: titulos[codigo] || 'No se pudo completar la operación',
    mensaje,
    detalles,
  };
}

/** Normaliza el estado de la propuesta del backend ("en_evaluacion"). */
function estadoDe(propuesta) {
  return String(propuesta?.estado || '').toLowerCase();
}

/**
 * Indica si el autor puede crear una nueva versión, con el motivo cuando no (Criterios 3 y 5).
 * Replica `verificarEstadoEditable` del backend; con la convocatoria se usa lo que trae `mis-propuestas`.
 * @param {{ propuesta: Object, tieneVersionDefinitiva?: boolean, edicionAutorizada?: boolean,
 *   convocatoriaEstado?: string, convocatoriaFechaCierre?: string }} mia - Elemento de `mis-propuestas`.
 * @param {Date} [ahora=new Date()]
 * @returns {{ permitido: boolean, motivo: string|null, usaAutorizacion: boolean }}
 */
export function puedeModificarPropuesta(mia, ahora = new Date()) {
  const estado = estadoDe(mia?.propuesta);

  if (estado === 'rechazada') {
    return { permitido: false, motivo: 'La propuesta fue rechazada y no admite modificaciones.', usaAutorizacion: false };
  }
  if (mia?.tieneVersionDefinitiva) {
    return mia.edicionAutorizada
      ? { permitido: true, motivo: null, usaAutorizacion: true }
      : {
          permitido: false,
          motivo: 'La propuesta ya fue aprobada en versión definitiva. Solo puede modificarse con autorización explícita del administrador.',
          usaAutorizacion: false,
        };
  }
  if (estado === 'ajustes') return { permitido: true, motivo: null, usaAutorizacion: false };
  if (estado === 'recibida') {
    const cierre = mia?.convocatoriaFechaCierre ? new Date(mia.convocatoriaFechaCierre) : null;
    const cerrada =
      String(mia?.convocatoriaEstado || '').toLowerCase() === 'cerrada' ||
      (cierre && !Number.isNaN(cierre.getTime()) && ahora > cierre);
    return cerrada
      ? { permitido: false, motivo: 'La convocatoria ya cerró; la propuesta no admite cambios.', usaAutorizacion: false }
      : { permitido: true, motivo: null, usaAutorizacion: false };
  }
  return {
    permitido: false,
    motivo: 'La propuesta está en evaluación o aprobada y no admite modificaciones.',
    usaAutorizacion: false,
  };
}

/**
 * Indica si el administrador puede conceder la autorización explícita de edición (Criterio 5).
 * @param {Array<{ esDefinitiva?: boolean }>} versiones
 * @param {string} [estado] - Estado de la propuesta.
 * @returns {boolean}
 */
export function puedeAutorizarEdicion(versiones, estado) {
  if (String(estado || '').toLowerCase() === 'rechazada') return false;
  return Array.isArray(versiones) && versiones.some((v) => v?.esDefinitiva);
}

/**
 * Valida los cambios de una nueva versión antes de enviarlos.
 * @param {{ titulo: string, notaCambio?: string }} cambios
 * @param {number} totalDocumentos - Documentos conservados + nuevos.
 * @returns {Record<string, string>} Errores por campo.
 */
export function validarNuevaVersion(cambios, totalDocumentos) {
  const errores = {};
  if (!cambios?.titulo || !cambios.titulo.trim()) {
    errores.titulo = 'El título de la propuesta es obligatorio.';
  } else if (cambios.titulo.trim().length > 200) {
    errores.titulo = 'El título no puede superar los 200 caracteres.';
  }
  if ((cambios?.notaCambio || '').length > 1000) {
    errores.notaCambio = 'La nota del cambio no puede superar los 1000 caracteres.';
  }
  if (totalDocumentos <= 0) {
    errores.documentos = 'La nueva versión debe tener al menos un documento.';
  } else if (totalDocumentos > MAXIMO_DOCUMENTOS) {
    errores.documentos = `Se permiten como máximo ${MAXIMO_DOCUMENTOS} documentos por versión.`;
  }
  return errores;
}

/**
 * Arma el cuerpo de `ActualizarPropuestaRequest` enviando solo los campos que cambiaron.
 * @param {{ titulo: string, resumen: string, palabrasClave: string, notaCambio: string }} form
 * @param {{ titulo?: string, resumen?: string, palabrasClave?: string }} original - Propuesta actual.
 * @param {Array<number>} documentosConservados - IDs de documentos de la versión anterior que se conservan.
 * @returns {Object}
 */
export function construirCambiosVersion(form, original, documentosConservados) {
  const cambio = (nuevo, anterior) => {
    const n = (nuevo || '').trim();
    return n !== (anterior || '').trim() ? n : null;
  };
  return {
    titulo: cambio(form.titulo, original?.titulo),
    resumen: cambio(form.resumen, original?.resumen),
    palabrasClave: cambio(form.palabrasClave, original?.palabrasClave),
    lineaTematicaId: null,
    notaCambio: (form.notaCambio || '').trim() || null,
    documentosConservados,
  };
}
