/**
 * @file clasificacionUtils.js
 * @description Reglas y textos de la clasificación de propuestas según su resultado (HU-18: RF27).
 * Las reglas replican las del backend (ClasificacionPropuestaService, ReglasClasificacion) solo para orientar
 * al usuario; la validación definitiva siempre la hace la API.
 * @module features/clasificacion/clasificacionUtils
 */

/** Clasificaciones que admite el backend (`resultados_evaluacion.clasificacion`). */
export const CLASIFICACIONES = ['aprobada', 'aprobada_con_ajustes', 'rechazada'];

/** Nombre de cada clasificación como lo usa la historia de usuario (igual que `etiqueta` del backend). */
export const ETIQUETAS_CLASIFICACION = {
  aprobada: 'Aceptada',
  aprobada_con_ajustes: 'Aceptada con modificaciones',
  rechazada: 'Rechazada',
};

/** Grupos del listado, en el orden del backend, con su título y estilo. */
export const GRUPOS = [
  {
    id: 'aprobada',
    titulo: 'Aceptadas',
    clase: 'bg-brand-600 text-surface border-transparent',
  },
  {
    id: 'aprobada_con_ajustes',
    titulo: 'Aceptadas con modificaciones',
    clase: 'bg-surface-muted text-ink-600 border border-border',
  },
  {
    id: 'rechazada',
    titulo: 'Rechazadas',
    clase: 'bg-brand-100 text-brand-700 border-transparent',
  },
  {
    id: 'sin_clasificar',
    titulo: 'Sin clasificar',
    descripcion: 'Evaluación completa; falta aplicar la clasificación.',
    clase: 'bg-surface-muted text-ink-600 border border-border',
  },
  {
    id: 'evaluacion_incompleta',
    titulo: 'Evaluación incompleta',
    descripcion: 'No se pueden clasificar hasta completar su evaluación.',
    clase: 'bg-surface-muted text-ink-600 border-border',
  },
];

/** Umbrales que usa el backend cuando la convocatoria no tiene otros. */
export const UMBRALES_POR_DEFECTO = { umbralAceptacion: 7, umbralAjustes: 5 };

/** Límites del motivo del ajuste manual (@Size de AjusteClasificacionRequest). */
export const MOTIVO_MINIMO = 10;
export const MOTIVO_MAXIMO = 1000;

/**
 * Nombre legible de una clasificación.
 * @param {string|null|undefined} clasificacion
 * @returns {string}
 */
export function etiquetaClasificacion(clasificacion) {
  return ETIQUETAS_CLASIFICACION[clasificacion] || 'Sin clasificar';
}

/**
 * Estilo del distintivo de una clasificación o grupo.
 * @param {string|null|undefined} id
 * @returns {string}
 */
export function claseGrupo(id) {
  return GRUPOS.find((g) => g.id === id)?.clase || GRUPOS[GRUPOS.length - 1].clase;
}

/**
 * La clasificación se gestiona una vez la convocatoria salió de borrador (ya recibe propuestas).
 * @param {{ estado?: string }} convocatoria
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function puedeGestionarClasificacion(convocatoria) {
  const estado = String(convocatoria?.estado || '').toUpperCase();
  if (!estado || estado === 'BORRADOR') {
    return {
      permitido: false,
      motivo: 'La convocatoria está en borrador: todavía no tiene propuestas para clasificar.',
    };
  }
  return { permitido: true };
}

/**
 * Grupo de una fila del listado (mismo criterio que `ClasificacionPropuestaService.grupo`).
 * @param {{ evaluacionCompleta?: boolean, aplicada?: boolean, clasificacion?: string|null }} fila
 * @returns {string}
 */
export function grupoDe(fila) {
  if (!fila?.evaluacionCompleta) return 'evaluacion_incompleta';
  if (!fila.aplicada || !fila.clasificacion) return 'sin_clasificar';
  return fila.clasificacion;
}

/**
 * Agrupa las filas del listado en el orden de {@link GRUPOS}; dentro de cada grupo se respeta el orden
 * recibido (el backend ordena por puntuación descendente). Se omiten los grupos vacíos.
 * @param {Array<Object>} propuestas
 * @returns {Array<{ id: string, titulo: string, descripcion?: string, clase: string, propuestas: Array<Object> }>}
 */
export function agruparPropuestas(propuestas) {
  const porGrupo = new Map(GRUPOS.map((g) => [g.id, []]));
  (propuestas || []).forEach((p) => porGrupo.get(grupoDe(p))?.push(p));
  return GRUPOS.map((g) => ({ ...g, propuestas: porGrupo.get(g.id) })).filter((g) => g.propuestas.length > 0);
}

/**
 * Criterio 3: una propuesta solo se clasifica con la evaluación completa. Si ya está aplicada, solo se vuelve a
 * clasificar cuando los umbrales actuales le dan otra clasificación (y no tiene un ajuste manual, que se respeta).
 * @param {Object} fila
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function puedeClasificar(fila) {
  if (!fila?.evaluacionCompleta) return { permitido: false, motivo: motivoIncompleta(fila) };
  if (fila.aplicada && !requiereReclasificar(fila)) {
    return { permitido: false, motivo: 'La clasificación ya está aplicada.' };
  }
  return { permitido: true };
}

/**
 * Una propuesta ya clasificada automáticamente cambiaría con los umbrales actuales.
 * @param {Object} fila
 * @returns {boolean}
 */
export function requiereReclasificar(fila) {
  return Boolean(fila?.aplicada && !fila.ajusteManual && difiereDeUmbrales(fila));
}

/**
 * Propuestas a las que «Clasificar todas» les cambiaría algo: con evaluación completa y sin aplicar, o que
 * cambiarían con los umbrales actuales.
 * @param {Array<Object>} propuestas
 * @returns {number}
 */
export function contarPorClasificar(propuestas) {
  return (propuestas || []).filter((p) => puedeClasificar(p).permitido).length;
}

/**
 * Criterio 3: el ajuste manual también exige la evaluación completa.
 * @param {Object} fila
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function puedeAjustar(fila) {
  if (!fila?.evaluacionCompleta) return { permitido: false, motivo: motivoIncompleta(fila) };
  return { permitido: true };
}

/**
 * Por qué una propuesta no se puede clasificar (los mismos casos que revisa el backend).
 * @param {{ asignacionesPendientes?: number, puntuacionPonderada?: number|null }} fila
 * @returns {string}
 */
export function motivoIncompleta(fila) {
  const pendientes = Number(fila?.asignacionesPendientes) || 0;
  if (pendientes > 0) {
    return `Tiene ${pendientes} ${pendientes === 1 ? 'evaluación pendiente' : 'evaluaciones pendientes'}.`;
  }
  if (fila?.puntuacionPonderada == null) {
    return 'No tiene evaluadores asignados o aún no tiene puntuación calculada.';
  }
  return 'Su evaluación no está completa.';
}

/**
 * Indica si la clasificación vigente difiere de la que corresponde con los umbrales actuales
 * (por un ajuste manual o porque cambiaron los umbrales después de aplicarla).
 * @param {{ clasificacion?: string|null, clasificacionPorUmbrales?: string|null }} fila
 * @returns {boolean}
 */
export function difiereDeUmbrales(fila) {
  return Boolean(fila?.clasificacion && fila?.clasificacionPorUmbrales && fila.clasificacion !== fila.clasificacionPorUmbrales);
}

/**
 * Convierte el texto de un campo numérico en número (acepta coma decimal). Vacío o inválido → null.
 * @param {string|number|null|undefined} valor
 * @returns {number|null}
 */
export function leerNumero(valor) {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim().replace(',', '.');
  if (texto === '') return null;
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Criterio 1: valida los umbrales como lo hace el backend (0 - 10, hasta 2 decimales, ajustes ≤ aceptación).
 * @param {{ umbralAceptacion: string|number, umbralAjustes: string|number }} valores
 * @returns {{ valido: boolean, errores: { umbralAceptacion?: string, umbralAjustes?: string },
 *   umbrales: { umbralAceptacion: number, umbralAjustes: number }|null }}
 */
export function validarUmbrales({ umbralAceptacion, umbralAjustes }) {
  const errores = {};
  const aceptacion = leerNumero(umbralAceptacion);
  const ajustes = leerNumero(umbralAjustes);

  const revisar = (valor, campo, nombre) => {
    if (valor === null) errores[campo] = `Escribe el umbral de ${nombre}.`;
    else if (valor < 0 || valor > 10) errores[campo] = 'Debe estar entre 0 y 10.';
    else if (!tieneMaximoDosDecimales(valor)) errores[campo] = 'Usa máximo 2 decimales.';
  };
  revisar(aceptacion, 'umbralAceptacion', 'aceptación');
  revisar(ajustes, 'umbralAjustes', 'aceptación con modificaciones');

  if (!errores.umbralAceptacion && !errores.umbralAjustes && ajustes > aceptacion) {
    errores.umbralAjustes = 'No puede ser mayor que el umbral de aceptación.';
  }

  const valido = Object.keys(errores).length === 0;
  return { valido, errores, umbrales: valido ? { umbralAceptacion: aceptacion, umbralAjustes: ajustes } : null };
}

function tieneMaximoDosDecimales(valor) {
  const [, decimales = ''] = String(valor).split('.');
  return decimales.length <= 2;
}

/**
 * Clasificación que corresponde a una puntuación con los umbrales dados (límites inclusivos, como el backend).
 * @param {number|null|undefined} puntuacion
 * @param {{ umbralAceptacion?: number, umbralAjustes?: number }} [umbrales]
 * @returns {'aprobada'|'aprobada_con_ajustes'|'rechazada'|null}
 */
export function clasificarPuntuacion(puntuacion, umbrales = UMBRALES_POR_DEFECTO) {
  const valor = leerNumero(puntuacion);
  if (valor === null) return null;
  const aceptacion = leerNumero(umbrales?.umbralAceptacion) ?? UMBRALES_POR_DEFECTO.umbralAceptacion;
  const ajustes = leerNumero(umbrales?.umbralAjustes) ?? UMBRALES_POR_DEFECTO.umbralAjustes;
  if (valor >= aceptacion) return 'aprobada';
  if (valor >= ajustes) return 'aprobada_con_ajustes';
  return 'rechazada';
}

/**
 * Criterio 2: el motivo del ajuste manual es obligatorio (10 - 1000 caracteres sin contar espacios a los lados).
 * @param {string} motivo
 * @returns {string|null} Mensaje de error, o null si es válido.
 */
export function validarMotivo(motivo) {
  const limpio = (motivo || '').trim();
  if (!limpio) return 'Escribe el motivo del ajuste; queda registrado en el historial.';
  if (limpio.length < MOTIVO_MINIMO) return `El motivo debe tener al menos ${MOTIVO_MINIMO} caracteres.`;
  if (limpio.length > MOTIVO_MAXIMO) return `El motivo no puede superar ${MOTIVO_MAXIMO} caracteres.`;
  return null;
}

/**
 * Opciones del ajuste manual: todas menos la clasificación que ya está aplicada.
 * @param {{ clasificacion?: string|null, aplicada?: boolean }} fila
 * @returns {Array<{ value: string, label: string }>}
 */
export function opcionesAjuste(fila) {
  return CLASIFICACIONES.filter((c) => !(fila?.aplicada && fila?.clasificacion === c)).map((c) => ({
    value: c,
    label: ETIQUETAS_CLASIFICACION[c],
  }));
}

/**
 * Formatea una puntuación de 0 - 10 con dos decimales (es-CO). Sin valor → «—».
 * @param {number|string|null|undefined} valor
 * @returns {string}
 */
export function formatearPuntuacion(valor) {
  const numero = leerNumero(valor);
  if (numero === null) return '—';
  return numero.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Fecha y hora corta (es-CO). Sin valor → cadena vacía.
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function formatearFechaHora(iso) {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * "1 propuesta" / "3 propuestas".
 * @param {number} cantidad
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
export function plural(cantidad, singular, plural = `${singular}s`) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

/**
 * Resumen de una aplicación masiva para mostrar al usuario.
 * @param {{ clasificadas?: Array<Object>, omitidas?: Array<Object> }} resultado
 * @returns {string}
 */
export function resumenAplicacion(resultado) {
  const clasificadas = resultado?.clasificadas?.length || 0;
  const omitidas = resultado?.omitidas?.length || 0;
  if (clasificadas === 0 && omitidas === 0) return 'La convocatoria no tiene propuestas para clasificar.';
  const partes = [];
  // El backend devuelve en `clasificadas` todas las evaluadas, también las que ya estaban al día.
  if (clasificadas > 0) {
    partes.push(
      `${plural(clasificadas, 'propuesta evaluada', 'propuestas evaluadas')} ${
        clasificadas === 1 ? 'tiene' : 'tienen'
      } su clasificación aplicada`
    );
  }
  if (omitidas > 0) {
    partes.push(
      `${plural(omitidas, 'propuesta')} no se ${omitidas === 1 ? 'clasificó' : 'clasificaron'} porque su evaluación no está completa`
    );
  }
  return `${partes.join('; ')}.`;
}

/** Mensajes de respaldo cuando el backend responde sin un "message" utilizable. */
const MENSAJE_POR_ESTADO = {
  400: 'Los datos enviados no son válidos. Revisa el formulario.',
  403: 'Tu usuario no tiene permiso para clasificar propuestas. Pide al administrador el permiso PROPUESTAS_CLASIFICAR.',
  404: 'La convocatoria o la propuesta ya no existe. Recarga la página.',
  409: 'La operación entra en conflicto con el estado actual. Recarga e intenta de nuevo.',
  500: 'El servidor tuvo un problema al procesar la solicitud. Intenta de nuevo en unos minutos.',
};

/**
 * Traduce un error de Axios al formato que usa la interfaz.
 * Sigue el ErrorResponse del backend: { message, codigo, erroresValidacion }.
 * @param {any} err
 * @returns {{ mensaje: string, campos: Record<string, string>, codigo: string|undefined,
 *   status: number|undefined, noEvaluada: boolean }}
 */
export function interpretarErrorClasificacion(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const campos =
    data?.erroresValidacion && typeof data.erroresValidacion === 'object' ? { ...data.erroresValidacion } : {};
  const mensajeBackend = typeof data?.message === 'string' && data.message.trim() ? data.message : null;

  let mensaje;
  if (status === 401) mensaje = 'Tu sesión expiró. Inicia sesión de nuevo.';
  else if (status === 403) mensaje = MENSAJE_POR_ESTADO[403];
  else if (mensajeBackend) mensaje = mensajeBackend;
  else if (err?.request && !err?.response) {
    mensaje = 'No fue posible conectarse con el servidor. Verifica que el backend esté activo.';
  } else {
    mensaje = MENSAJE_POR_ESTADO[status] || (status >= 500 ? MENSAJE_POR_ESTADO[500] : 'Ocurrió un error inesperado.');
  }
  return { mensaje, campos, codigo: data?.codigo, status, noEvaluada: data?.codigo === 'PROPUESTA_NO_EVALUADA' };
}

/**
 * Los umbrales de clasificación solo se modifican antes de la fecha de apertura de la convocatoria (igual que la
 * rúbrica; el backend lo rechaza después con 409). Devuelve el motivo del bloqueo, o null si todavía se pueden editar.
 * Una convocatoria sin fecha de apertura sigue siendo editable.
 * @param {{ fechaApertura?: string|null }} convocatoria
 * @param {Date} [ahora=new Date()]
 * @returns {string|null}
 */
export function motivoBloqueoUmbrales(convocatoria, ahora = new Date()) {
  if (!convocatoria?.fechaApertura) return null;
  const apertura = new Date(convocatoria.fechaApertura);
  if (Number.isNaN(apertura.getTime()) || ahora < apertura) return null;
  const fecha = apertura.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  return `La convocatoria abrió el ${fecha}, así que los umbrales quedan fijos para que todas las propuestas se clasifiquen con las mismas reglas. Para cambiar el resultado de una propuesta, usa el ajuste manual en su detalle.`;
}
