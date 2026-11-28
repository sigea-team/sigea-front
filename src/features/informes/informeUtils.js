import { esAdministrador, tienePermiso } from '../../utils/permisos';

/**
 * @file informeUtils.js
 * @description Reglas puras de los informes parametrizables (HU-30: CU-26, RF52, RF53): quién los ve, armado de los
 * parámetros que se envían al backend, validación del formulario, formato de los valores para la vista previa (igual
 * que en el PDF), interpretación de errores (Criterio 4) y nombre del archivo descargado.
 * @module features/informes/informeUtils
 */

/** Permisos con los que el backend deja generar y exportar informes (además del administrador). */
export const PERMISOS_INFORMES = ['REPORTES_VER', 'EVENTOS_EDITAR'];

/** Ruta de la página de informes. */
export const RUTA_INFORMES = '/informes';

/** Tipo de informe con los indicadores del dashboard (HU-29). */
export const TIPO_INDICADORES = 'INDICADORES';

/** Formatos de exportación que acepta `POST /informes/exportar?formato=`. */
export const FORMATOS = {
  pdf: { id: 'pdf', etiqueta: 'PDF', extension: 'pdf' },
  excel: { id: 'excel', etiqueta: 'Excel', extension: 'xlsx' },
};

/** Registros por página en la vista previa. */
export const FILAS_POR_PAGINA = 50;

/** Valor de las listas desplegables para «sin filtro» (el componente Select reserva '' para su opción deshabilitada). */
export const TODOS = 'todos';

/** Formulario vacío. `columnas: null` = todas las columnas del tipo. */
export const FILTROS_INICIALES = Object.freeze({
  tipo: '',
  eventoId: '',
  semestre: '',
  tipoEventoId: '',
  fechaDesde: '',
  fechaHasta: '',
  tipoActividad: '',
  columnas: null,
});

/** Códigos de error del backend (InformeException). */
export const CODIGOS = {
  SIN_DATOS: 'INFORME_SIN_DATOS',
  DEMASIADO_GRANDE: 'INFORME_DEMASIADO_GRANDE',
  EXPORTACION_FALLIDA: 'EXPORTACION_INFORME_FALLIDA',
};

/**
 * Quién ve la opción «Informes»: el administrador o quien tiene `REPORTES_VER` o `EVENTOS_EDITAR` (mismo permiso que
 * la API). Solo decide qué se muestra; el backend vuelve a validar.
 * @param {Object|null|undefined} usuario
 */
export function veInformes(usuario) {
  return esAdministrador(usuario) || PERMISOS_INFORMES.some((p) => tienePermiso(usuario, p));
}

const lista = (valor) => (Array.isArray(valor) ? valor : []);

/** Catálogo de tipos con las listas siempre como arreglo. */
export function normalizarTipos(tipos) {
  return lista(tipos).map((t) => ({
    ...t,
    admiteTipoActividad: Boolean(t?.admiteTipoActividad),
    columnas: lista(t?.columnas),
  }));
}

/** Informe con las listas y los totales siempre presentes, aunque la respuesta llegue incompleta. */
export function normalizarInforme(informe) {
  const filas = lista(informe?.filas);
  return {
    ...informe,
    hayDatos: Boolean(informe?.hayDatos),
    filtros: lista(informe?.filtros),
    columnas: lista(informe?.columnas),
    filas,
    totalFilas: Number.isFinite(informe?.totalFilas) ? informe.totalFilas : filas.length,
    totales: informe?.totales && typeof informe.totales === 'object' ? informe.totales : {},
  };
}

/** Tipo del catálogo por su código. */
export function buscarTipo(tipos, codigo) {
  return lista(tipos).find((t) => t.codigo === codigo) || null;
}

/** Columnas elegidas en el formulario, en el orden del catálogo (null = todas). */
export function columnasElegidas(filtros, tipo) {
  const todas = lista(tipo?.columnas).map((c) => c.clave);
  if (!Array.isArray(filtros?.columnas)) return todas;
  return todas.filter((clave) => filtros.columnas.includes(clave));
}

/**
 * Cambia el tipo de información: los filtros comunes se conservan; las columnas vuelven a «todas» y el tipo de
 * actividad se borra si el nuevo tipo no lo admite.
 */
export function cambiarTipo(filtros, tipo) {
  return {
    ...filtros,
    tipo: tipo?.codigo || '',
    columnas: null,
    tipoActividad: tipo?.admiteTipoActividad ? filtros.tipoActividad : '',
  };
}

/**
 * Valida el formulario antes de llamar al backend (el backend valida lo mismo).
 * @returns {Object<string, string>} errores por campo; vacío si está bien.
 */
export function validarFiltros(filtros, tipo) {
  const errores = {};
  if (!filtros?.tipo || !tipo) {
    errores.tipo = 'Seleccione el tipo de información del informe.';
  }
  if (filtros?.fechaDesde && filtros?.fechaHasta && filtros.fechaDesde > filtros.fechaHasta) {
    errores.fechas = 'La fecha inicial no puede ser posterior a la fecha final.';
  }
  if (tipo && columnasElegidas(filtros, tipo).length === 0) {
    errores.columnas = 'Elija al menos una columna.';
  }
  return errores;
}

/**
 * Cuerpo de `POST /informes/generar` y `/informes/exportar`: solo lleva los filtros con valor. Las columnas se envían
 * solo si no son todas, y el tipo de actividad solo si el tipo lo admite.
 * @param {typeof FILTROS_INICIALES} filtros
 * @param {Object} tipo - Tipo del catálogo.
 */
export function construirParametros(filtros, tipo) {
  const parametros = { tipo: filtros.tipo };
  const numero = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  const texto = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

  const eventoId = numero(filtros.eventoId);
  if (eventoId) parametros.eventoId = eventoId;
  const semestre = texto(filtros.semestre);
  if (semestre) parametros.semestre = semestre;
  const tipoEventoId = numero(filtros.tipoEventoId);
  if (tipoEventoId) parametros.tipoEventoId = tipoEventoId;
  if (texto(filtros.fechaDesde)) parametros.fechaDesde = filtros.fechaDesde;
  if (texto(filtros.fechaHasta)) parametros.fechaHasta = filtros.fechaHasta;
  const tipoActividad = texto(filtros.tipoActividad);
  if (tipoActividad && tipo?.admiteTipoActividad) parametros.tipoActividad = tipoActividad.replace(/\s+/g, ' ');

  const elegidas = columnasElegidas(filtros, tipo);
  if (tipo && elegidas.length > 0 && elegidas.length < tipo.columnas.length) parametros.columnas = elegidas;
  return parametros;
}

/** Si dos juegos de parámetros piden el mismo informe. */
export function mismosParametros(a, b) {
  if (!a || !b) return false;
  return JSON.stringify(ordenar(a)) === JSON.stringify(ordenar(b));
}

const ordenar = (objeto) => Object.keys(objeto).sort().reduce((acc, k) => ({ ...acc, [k]: objeto[k] }), {});

/** Tipos de dato numéricos (se alinean a la derecha). */
export function esNumerico(tipo) {
  return ['ENTERO', 'DECIMAL', 'MONEDA', 'PORCENTAJE'].includes(tipo);
}

/** Número con miles con punto y decimales con coma (formato colombiano, igual que el PDF). */
export function formatearNumero(valor, minimoDecimales = 0, maximoDecimales = 2) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return String(valor ?? '');
  const factor = 10 ** maximoDecimales;
  const redondeado = Math.round(Math.abs(n) * factor) / factor;
  let [entero, decimales = ''] = redondeado.toFixed(maximoDecimales).split('.');
  decimales = decimales.replace(/0+$/, '');
  if (decimales.length < minimoDecimales) decimales = decimales.padEnd(minimoDecimales, '0');
  entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const signo = n < 0 && redondeado !== 0 ? '-' : '';
  return `${signo}${entero}${decimales ? `,${decimales}` : ''}`;
}

/** «2026-11-10» → «10/11/2026», sin pasar por la zona horaria del navegador. */
export function formatearFecha(valor) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor ?? ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(valor ?? '');
}

/** «08:05:00» → «08:05». */
export function formatearHora(valor) {
  const m = /^(\d{2}):(\d{2})/.exec(String(valor ?? ''));
  return m ? `${m[1]}:${m[2]}` : String(valor ?? '');
}

/** «2026-11-10T08:05:00» → «10/11/2026 08:05». */
export function formatearFechaHora(valor) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(valor ?? ''));
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : formatearFecha(valor);
}

/**
 * Valor tal como se muestra en la vista previa y en el PDF. Nunca recorta el texto; un valor vacío es ''.
 * @param {*} valor
 * @param {'TEXTO'|'ENTERO'|'DECIMAL'|'MONEDA'|'PORCENTAJE'|'FECHA'|'HORA'|'FECHA_HORA'} tipo
 */
export function formatearValor(valor, tipo) {
  if (valor === null || valor === undefined || valor === '') return '';
  switch (tipo) {
    case 'ENTERO':
      return formatearNumero(valor, 0, 0);
    case 'DECIMAL':
      return formatearNumero(valor, 0, 2);
    case 'MONEDA': {
      const n = Number(valor);
      const entero = Number.isFinite(n) && Math.round(n * 100) % 100 === 0;
      const texto = `$ ${formatearNumero(Math.abs(n), entero ? 0 : 2, entero ? 0 : 2)}`;
      return n < 0 ? `-${texto}` : texto;
    }
    case 'PORCENTAJE':
      return `${formatearNumero(valor, 2, 2)} %`;
    case 'FECHA':
      return formatearFecha(valor);
    case 'HORA':
      return formatearHora(valor);
    case 'FECHA_HORA':
      return formatearFechaHora(valor);
    default:
      return String(valor);
  }
}

/** Momento de generación del informe para mostrar («28/11/2026 11:14»). */
export function formatearGeneradoEn(valor) {
  return formatearFechaHora(valor);
}

/** «1 registro» / «120 registros». */
export function etiquetaRegistros(n) {
  const cantidad = Number(n) || 0;
  return `${formatearNumero(cantidad, 0, 0)} ${cantidad === 1 ? 'registro' : 'registros'}`;
}

/**
 * Página de la vista previa.
 * @returns {{ filas: Array, pagina: number, paginas: number, desde: number, hasta: number }}
 */
export function paginar(filas, pagina, tamano = FILAS_POR_PAGINA) {
  const total = lista(filas).length;
  const paginas = Math.max(1, Math.ceil(total / tamano));
  const actual = Math.min(Math.max(1, pagina || 1), paginas);
  const inicio = (actual - 1) * tamano;
  return {
    filas: lista(filas).slice(inicio, inicio + tamano),
    pagina: actual,
    paginas,
    desde: total === 0 ? 0 : inicio + 1,
    hasta: Math.min(inicio + tamano, total),
  };
}

/**
 * Nombre del archivo a partir de `Content-Disposition` (`attachment; filename="..."` o `filename*=UTF-8''...`).
 * @param {string|undefined} cabecera
 * @param {string} respaldo - Si la cabecera no llega (por ejemplo, CORS sin exponerla).
 */
export function nombreArchivoDeCabecera(cabecera, respaldo) {
  const valor = String(cabecera || '');
  const extendido = /filename\*\s*=\s*(?:UTF-8|utf-8)''([^;]+)/.exec(valor);
  if (extendido) {
    try {
      return decodeURIComponent(extendido[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // Codificación inválida: se usa el nombre simple o el de respaldo.
    }
  }
  const simple = /filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/.exec(valor);
  const nombre = simple ? (simple[1] || simple[2]).trim() : '';
  return nombre || respaldo;
}

/** Nombre de respaldo del archivo: `informe-<tipo>.<extensión>`. */
export function nombreRespaldo(tipo, formato) {
  const extension = FORMATOS[formato]?.extension || formato;
  return `informe-${String(tipo || 'datos').toLowerCase()}.${extension}`;
}

/**
 * Traduce el error de la API a un aviso para la pantalla.
 * - Criterio 2: 409 `INFORME_SIN_DATOS` al exportar.
 * - Criterio 4: `EXPORTACION_INFORME_FALLIDA`, 5xx o sin conexión → se puede reintentar.
 * @param {*} err - Error de axios (o de la API simulada).
 * @param {{ exportando?: boolean, formato?: string }} [contexto]
 * @returns {{ titulo: string, mensaje: string, codigo: string|null, status: number|undefined, reintentable: boolean }}
 */
export function interpretarErrorInforme(err, { exportando = false, formato } = {}) {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const codigo = typeof data.codigo === 'string' ? data.codigo : null;
  const mensajeBackend = typeof data.message === 'string' && data.message.trim() ? data.message.trim() : null;
  const errorCampo = data.erroresValidacion && typeof data.erroresValidacion === 'object'
    ? Object.values(data.erroresValidacion).find((v) => typeof v === 'string' && v.trim())
    : null;
  const nombreFormato = FORMATOS[formato]?.etiqueta || 'el archivo';
  const titulo = exportando ? `No se pudo exportar a ${nombreFormato}` : 'No se pudo generar el informe';

  if (!err?.response && (err?.request || err?.code === 'ECONNABORTED' || err?.message === 'Network Error')) {
    return {
      titulo,
      mensaje: err?.code === 'ECONNABORTED'
        ? 'El servidor tardó demasiado en responder. Intente de nuevo.'
        : 'No fue posible conectarse con el servidor. Verifique su conexión e intente de nuevo.',
      codigo: null,
      status,
      reintentable: true,
    };
  }
  if (status === 401) {
    return { titulo, mensaje: 'Su sesión expiró. Inicie sesión de nuevo.', codigo, status, reintentable: false };
  }
  if (status === 403) {
    return {
      titulo: 'Acceso denegado',
      mensaje: 'Su cuenta no tiene permiso para generar informes (se requiere REPORTES_VER o EVENTOS_EDITAR).',
      codigo,
      status,
      reintentable: false,
    };
  }
  if (codigo === CODIGOS.SIN_DATOS) {
    return { titulo: 'No hay datos para exportar', mensaje: mensajeBackend, codigo, status, reintentable: false };
  }
  if (codigo === CODIGOS.DEMASIADO_GRANDE) {
    return { titulo: 'El informe es demasiado grande', mensaje: mensajeBackend, codigo, status, reintentable: false };
  }
  if (codigo === CODIGOS.EXPORTACION_FALLIDA || status >= 500) {
    return {
      titulo,
      mensaje: mensajeBackend && codigo === CODIGOS.EXPORTACION_FALLIDA
        ? mensajeBackend
        : 'Ocurrió un problema técnico en el servidor. Intente de nuevo en unos momentos.',
      codigo,
      status,
      reintentable: true,
    };
  }
  return {
    titulo,
    mensaje: errorCampo || mensajeBackend || 'Revise los filtros e intente de nuevo.',
    codigo,
    status,
    reintentable: false,
  };
}

/** Ruta de la página de informes con el tipo y el evento ya elegidos (por ejemplo, desde el dashboard). */
export function rutaInformes({ tipo, eventoId } = {}) {
  const params = new URLSearchParams();
  if (tipo) params.set('tipo', tipo);
  if (eventoId !== undefined && eventoId !== null && eventoId !== '') params.set('eventoId', String(eventoId));
  const consulta = params.toString();
  return consulta ? `${RUTA_INFORMES}?${consulta}` : RUTA_INFORMES;
}

/** Etiqueta de un evento en la lista: «Nombre (2026-2)». */
export function etiquetaEvento(evento) {
  const nombre = evento?.nombre || `Evento ${evento?.id ?? ''}`.trim();
  return evento?.semestre ? `${nombre} (${evento.semestre})` : nombre;
}

/** Eventos ordenados del más reciente al más antiguo (por fecha de inicio y luego por nombre). */
export function ordenarEventos(eventos) {
  return [...lista(eventos)].sort((a, b) => {
    const fa = String(a?.fechaInicio || '');
    const fb = String(b?.fechaInicio || '');
    if (fa !== fb) return fb.localeCompare(fa);
    return String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es');
  });
}
