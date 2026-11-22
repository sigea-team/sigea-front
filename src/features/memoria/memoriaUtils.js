import { esAdministrador, tienePermiso } from '../../utils/permisos';

/**
 * @file memoriaUtils.js
 * @description Reglas y formatos de la memoria histórica de los eventos (HU-28: RF55, CU-32), sin dependencias de
 * React para poder probarlas por separado.
 * @module features/memoria/memoriaUtils
 */

/** Permiso para cerrar formalmente un evento (backend: changeset hu28-003). */
export const PERMISO_GESTIONAR_MEMORIA = 'MEMORIA_HISTORICA_GESTIONAR';
/** Autorización especial para eliminar un evento de la memoria histórica (Criterio 3). Ser administrador no basta. */
export const PERMISO_ELIMINAR_MEMORIA = 'MEMORIA_HISTORICA_ELIMINAR';

/** Largo máximo del resumen o acta de cierre (backend: 4000). */
export const LIMITE_RESUMEN = 4000;
/** Largo mínimo y máximo del motivo de la eliminación especial (backend: 20–1000). */
export const MOTIVO_MINIMO = 20;
export const MOTIVO_MAXIMO = 1000;

/** Indicadores que se muestran destacados, en este orden. */
export const INDICADORES_DESTACADOS = [
  'INSCRITOS',
  'ASISTENTES',
  'TASA_ASISTENCIA',
  'ACTIVIDADES_REALIZADAS',
  'PROPUESTAS_RECIBIDAS',
  'TASA_APROBACION',
  'SATISFACCION_PROMEDIO',
  'EJECUCION_PRESUPUESTAL',
];

export const ESTADOS_PROPUESTA = {
  recibida: 'Recibida',
  en_evaluacion: 'En evaluación',
  aprobada: 'Aprobada',
  ajustes: 'Aprobada con ajustes',
  rechazada: 'Rechazada',
};

export const CLASIFICACIONES = {
  aprobada: 'Aceptada',
  aprobada_con_ajustes: 'Aceptada con modificaciones',
  rechazada: 'Rechazada',
};

export const ESTADOS_ACTIVIDAD = {
  programada: 'Programada',
  cancelada: 'Cancelada',
  por_programar: 'Por programar',
};

const TITULOS_ERROR = {
  EVENTO_ARCHIVADO: 'El evento está en la memoria histórica',
  CIERRE_CON_PENDIENTES: 'El evento tiene procesos pendientes',
  EVENTO_NO_FINALIZADO: 'El evento todavía no ha finalizado',
  MEMORIA_YA_CONSOLIDADA: 'El evento ya fue cerrado formalmente',
  MEMORIA_NO_ENCONTRADA: 'El evento no tiene memoria histórica',
  CONFIRMACION_INVALIDA: 'El nombre no coincide',
  ELIMINACION_NO_PERMITIDA: 'No se puede eliminar el evento',
};

const MENSAJE_POR_ESTADO = {
  400: 'Los datos enviados no son válidos.',
  403: 'Tu usuario no tiene permiso para esta acción.',
  404: 'No se encontró el evento o su memoria histórica.',
  409: 'La operación no se pudo completar por el estado actual del evento.',
  500: 'El servidor tuvo un problema. Intenta de nuevo en unos minutos.',
};

/**
 * Indica si la sesión ve la memoria histórica (menú y página). La API también lo valida.
 * @param {Object|null|undefined} usuario
 */
export function veMemoriaHistorica(usuario) {
  return (
    esAdministrador(usuario) ||
    tienePermiso(usuario, PERMISO_GESTIONAR_MEMORIA) ||
    tienePermiso(usuario, 'REPORTES_VER')
  );
}

/**
 * Indica si la sesión tiene la autorización especial para eliminar eventos de la memoria histórica (Criterio 3).
 * @param {Object|null|undefined} usuario
 */
export function puedeEliminarConAutorizacion(usuario) {
  return tienePermiso(usuario, PERMISO_ELIMINAR_MEMORIA);
}

/**
 * Fecha local AAAA-MM-DD (no UTC: en Colombia el día cambia a las 7 p. m. en UTC).
 * @param {Date} [fecha]
 */
export function fechaLocalIso(fecha = new Date()) {
  const dos = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/**
 * Indica si se ofrece el cierre formal del evento: no está en la memoria y ya finalizó (cerrado, o publicado con su
 * último día hoy o antes). La regla definitiva la aplica el backend.
 * @param {{ estado?: string, fechaFin?: string, archivado?: boolean }} evento
 * @param {Date} [hoy]
 */
export function puedeCerrarFormalmente(evento, hoy = new Date()) {
  if (!evento || evento.archivado) return false;
  if (evento.estado === 'cerrado') return true;
  if (evento.estado !== 'habilitado' && evento.estado !== 'en_ejecucion') return false;
  return Boolean(evento.fechaFin) && String(evento.fechaFin).slice(0, 10) <= fechaLocalIso(hoy);
}

/**
 * Traduce un error de la API de la memoria histórica.
 * @param {any} err
 * @returns {{ titulo: string, mensaje: string, codigo?: string, status?: number, campos: Object,
 *   pendientes: Array<Object> }}
 */
export function interpretarErrorMemoria(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const codigo = data?.codigo;
  const campos = data?.erroresValidacion && typeof data.erroresValidacion === 'object' ? { ...data.erroresValidacion } : {};
  const mensajeBackend = typeof data?.message === 'string' && data.message.trim() ? data.message : null;

  let mensaje;
  if (status === 401) mensaje = 'Tu sesión expiró. Inicia sesión de nuevo.';
  else if (status === 403) mensaje = MENSAJE_POR_ESTADO[403];
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
    pendientes: Array.isArray(data?.pendientes) ? data.pendientes : [],
  };
}

const LISTAS_CONTENIDO = [
  'comiteOrganizador',
  'lineasTematicas',
  'tiposActividad',
  'convocatorias',
  'conferencistas',
  'participantes',
  'encuestas',
  'indicadores',
  'pendientesAlCierre',
];

/**
 * Normaliza el contenido consolidado de la memoria (puede llegar como objeto o como texto JSON). Las secciones que
 * falten quedan vacías, para que la vista no falle con memorias de versiones anteriores.
 * @param {Object|string|null|undefined} contenido
 * @returns {Object}
 */
export function parsearContenido(contenido) {
  let datos = contenido;
  if (typeof contenido === 'string') {
    try {
      datos = JSON.parse(contenido);
    } catch {
      datos = {};
    }
  }
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) datos = {};

  const resultado = { ...datos };
  LISTAS_CONTENIDO.forEach((clave) => {
    resultado[clave] = Array.isArray(datos[clave]) ? datos[clave] : [];
  });
  resultado.evento = datos.evento && typeof datos.evento === 'object' ? datos.evento : {};
  const presupuesto = datos.presupuesto && typeof datos.presupuesto === 'object' ? datos.presupuesto : {};
  resultado.presupuesto = { ...presupuesto, rubros: Array.isArray(presupuesto.rubros) ? presupuesto.rubros : [] };
  const agenda = datos.agenda && typeof datos.agenda === 'object' ? datos.agenda : {};
  resultado.agenda = {
    diasPublicados: Array.isArray(agenda.diasPublicados) ? agenda.diasPublicados : [],
    actividades: Array.isArray(agenda.actividades) ? agenda.actividades : [],
  };
  const asistencia = datos.asistencia && typeof datos.asistencia === 'object' ? datos.asistencia : {};
  resultado.asistencia = {
    registros: Number(asistencia.registros) || 0,
    personasConAsistencia: Number(asistencia.personasConAsistencia) || 0,
    porQr: Number(asistencia.porQr) || 0,
    manuales: Number(asistencia.manuales) || 0,
  };
  // Primera versión del backend: certificados era solo un objeto con el conteo por tipo.
  const certificados = datos.certificados && typeof datos.certificados === 'object' ? datos.certificados : {};
  const tieneEstructura = 'porTipo' in certificados || 'detalle' in certificados;
  resultado.certificados = {
    porTipo: tieneEstructura ? certificados.porTipo || {} : certificados,
    detalle: Array.isArray(certificados.detalle) ? certificados.detalle : [],
  };
  return resultado;
}

/**
 * Valor de un indicador para mostrar: porcentajes con «%», presupuesto en pesos y el resto como número.
 * @param {{ valor: number|string, unidad?: string }} indicador
 */
export function formatearValorIndicador(indicador) {
  const numero = Number(indicador?.valor);
  if (indicador?.valor === null || indicador?.valor === undefined || Number.isNaN(numero)) return '—';
  if (indicador.unidad === '%') {
    return `${numero.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;
  }
  if (indicador.unidad === 'COP') return formatearPesos(numero);
  return numero.toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

/** Pesos colombianos sin decimales. */
export function formatearPesos(valor) {
  const numero = Number(valor);
  if (valor === null || valor === undefined || Number.isNaN(numero)) return '—';
  return `$ ${Math.round(numero).toLocaleString('es-CO')}`;
}

/**
 * Indicadores destacados en el orden de {@link INDICADORES_DESTACADOS}; los que no existen se omiten.
 * @param {Array<{ codigo: string }>} indicadores
 */
export function indicadoresDestacados(indicadores) {
  const porCodigo = new Map((indicadores || []).map((i) => [i.codigo, i]));
  return INDICADORES_DESTACADOS.map((codigo) => porCodigo.get(codigo)).filter(Boolean);
}

/**
 * Valor numérico de un indicador por su código, o `null`.
 * @param {Array<{ codigo: string, valor: number }>} indicadores
 * @param {string} codigo
 */
export function valorIndicador(indicadores, codigo) {
  const indicador = (indicadores || []).find((i) => i.codigo === codigo);
  return indicador ? Number(indicador.valor) : null;
}

/**
 * Actividades agrupadas por fecha (en orden), con las que no tienen fecha al final.
 * @param {Array<{ fecha?: string|null }>} actividades
 * @returns {Array<{ fecha: string|null, actividades: Array<Object> }>}
 */
export function agruparActividadesPorFecha(actividades) {
  const grupos = new Map();
  (actividades || []).forEach((a) => {
    const clave = a.fecha ? String(a.fecha).slice(0, 10) : null;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(a);
  });
  return [...grupos.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b)))
    .map(([fecha, lista]) => ({ fecha, actividades: lista }));
}

/** Hora HH:mm de un valor «08:00:00». */
export function formatearHora(valor) {
  return valor ? String(valor).slice(0, 5) : '—';
}

/**
 * Propuestas de todas las convocatorias, con el título de su convocatoria.
 * @param {Array<{ titulo: string, propuestas?: Array<Object> }>} convocatorias
 */
export function propuestasDeConvocatorias(convocatorias) {
  return (convocatorias || []).flatMap((c) =>
    (c.propuestas || []).map((p) => ({ ...p, convocatoria: c.titulo }))
  );
}

/**
 * Semestres de las memorias, del más reciente al más antiguo.
 * @param {Array<{ semestre?: string }>} memorias
 */
export function semestresDisponibles(memorias) {
  return [...new Set((memorias || []).map((m) => m.semestre).filter(Boolean))].sort((a, b) => b.localeCompare(a));
}

/**
 * Cuerpo para el cierre formal.
 * @param {{ confirmarPendientes: boolean, resumen: string }} form
 */
export function aCierreRequest(form) {
  const resumen = (form?.resumen || '').trim();
  return { confirmarPendientes: Boolean(form?.confirmarPendientes), resumen: resumen || null };
}

/**
 * Errores del formulario de cierre formal.
 * @param {{ confirmarPendientes: boolean, resumen: string }} form
 * @param {Array<Object>} pendientes
 * @returns {Object<string, string>}
 */
export function validarCierre(form, pendientes) {
  const errores = {};
  if ((pendientes || []).length > 0 && !form?.confirmarPendientes) {
    errores.confirmarPendientes = 'Confirma que quieres cerrar el evento aunque tenga procesos pendientes.';
  }
  if ((form?.resumen || '').trim().length > LIMITE_RESUMEN) {
    errores.resumen = `El resumen no puede superar ${LIMITE_RESUMEN} caracteres.`;
  }
  return errores;
}

/**
 * Errores del formulario de eliminación con autorización especial.
 * @param {{ nombreEvento: string, motivo: string }} form
 * @param {string} nombreReal - Nombre del evento.
 * @returns {Object<string, string>}
 */
export function validarEliminacion(form, nombreReal) {
  const errores = {};
  const nombre = (form?.nombreEvento || '').trim();
  if (!nombre) errores.nombreEvento = 'Escribe el nombre del evento para confirmar.';
  else if (nombre !== String(nombreReal || '').trim()) errores.nombreEvento = 'El nombre no coincide con el del evento.';
  const motivo = (form?.motivo || '').trim();
  if (!motivo) errores.motivo = 'El motivo es obligatorio.';
  else if (motivo.length < MOTIVO_MINIMO) errores.motivo = `El motivo debe tener al menos ${MOTIVO_MINIMO} caracteres.`;
  else if (motivo.length > MOTIVO_MAXIMO) errores.motivo = `El motivo no puede superar ${MOTIVO_MAXIMO} caracteres.`;
  return errores;
}

/**
 * Cantidad con su sustantivo en singular o plural.
 * @param {number} n
 * @param {string} singular
 * @param {string} [pluralTexto]
 */
export function plural(n, singular, pluralTexto = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}
