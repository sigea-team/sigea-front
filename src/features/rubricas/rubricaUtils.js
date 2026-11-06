/**
 * @file rubricaUtils.js
 * @description Reglas del formulario de rúbrica de evaluación (HU-15: RF22).
 * Repiten en la interfaz las validaciones del backend para avisar antes de enviar:
 *  - Criterio 1: criterios con nombre, peso y escala; los pesos deben sumar exactamente 100 %.
 *  - Criterio 2: si los pesos no suman 100 % se impide guardar y se señala el error.
 *  - Criterio 4: traduce el aviso RUBRICA_EN_USO (rúbrica con calificaciones) para pedir confirmación.
 * Las claves de error siguen el formato del backend (`criterios[0].pesoPorcentual`), así los errores
 * locales y los del servidor se muestran en el mismo lugar.
 * @module features/rubricas/rubricaUtils
 */

/** Rango permitido para cualquier escala (el mismo que acepta el registro de evaluaciones, HU-17). */
export const ESCALA_LIMITE_MINIMO = 0;
export const ESCALA_LIMITE_MAXIMO = 10;

/** Límites de longitud del backend. */
export const LIMITES_RUBRICA = { nombre: 100, criterio: 100, maxCriterios: 30 };

let contadorClaves = 0;
/** Clave estable para las filas de criterios en React (no se envía al backend). */
const nuevaClave = () => `criterio-${Date.now()}-${(contadorClaves += 1)}`;

/**
 * Fila de criterio vacía para el formulario.
 * @param {Partial<{ nombre: string, pesoPorcentual: string, escalaMinima: string, escalaMaxima: string }>} [valores]
 */
export function criterioVacio(valores = {}) {
  return {
    clave: nuevaClave(),
    nombre: '',
    pesoPorcentual: '',
    escalaMinima: String(ESCALA_LIMITE_MINIMO),
    escalaMaxima: String(ESCALA_LIMITE_MAXIMO),
    ...valores,
  };
}

/** Formulario inicial para una convocatoria sin rúbrica: un criterio vacío. */
export function formularioVacio() {
  return { nombre: '', criterios: [criterioVacio()] };
}

/**
 * Convierte la rúbrica del backend al estado del formulario (todo como texto, para los inputs).
 * @param {Object|null} rubrica - RubricaResponse o null.
 */
export function desdeRubrica(rubrica) {
  if (!rubrica) return formularioVacio();
  const criterios = (rubrica.criterios || []).map((c) =>
    criterioVacio({
      nombre: c.nombre || '',
      pesoPorcentual: textoNumero(c.pesoPorcentual),
      escalaMinima: textoNumero(c.escalaMinima ?? ESCALA_LIMITE_MINIMO),
      escalaMaxima: textoNumero(c.escalaMaxima ?? ESCALA_LIMITE_MAXIMO),
    })
  );
  return { nombre: rubrica.nombre || '', criterios: criterios.length > 0 ? criterios : [criterioVacio()] };
}

/** Número del backend a texto sin ceros sobrantes (40.00 → "40", 33.50 → "33.5"). */
function textoNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  const n = Number(valor);
  return Number.isNaN(n) ? '' : String(n);
}

/** Interpreta un texto numérico; acepta coma decimal. Devuelve NaN si no es número. */
export function aNumero(texto) {
  if (texto === null || texto === undefined) return NaN;
  const limpio = String(texto).trim().replace(',', '.');
  if (limpio === '') return NaN;
  return Number(limpio);
}

/** Cantidad de decimales de un texto numérico. */
function decimales(texto) {
  const limpio = String(texto).trim().replace(',', '.');
  const punto = limpio.indexOf('.');
  return punto === -1 ? 0 : limpio.length - punto - 1;
}

/**
 * Suma de los pesos válidos, calculada en centésimas para evitar errores de coma flotante
 * (33.33 + 33.33 + 33.34 = 100 exacto).
 * @param {Array<{ pesoPorcentual: string|number }>} criterios
 * @returns {number}
 */
export function sumaPesos(criterios = []) {
  const centesimas = criterios.reduce((total, c) => {
    const n = aNumero(c.pesoPorcentual);
    return Number.isNaN(n) ? total : total + Math.round(n * 100);
  }, 0);
  return centesimas / 100;
}

/** Indica si la suma de pesos es exactamente 100. */
export function pesosCompletos(criterios = []) {
  return sumaPesos(criterios) === 100;
}

/**
 * Reparte 100 % en partes iguales entre los criterios; el último absorbe el residuo para que la suma
 * sea exacta (3 criterios → 33.33, 33.33, 33.34).
 * @param {Array<Object>} criterios
 * @returns {Array<Object>} Criterios con el peso repartido.
 */
export function repartirPesos(criterios = []) {
  const n = criterios.length;
  if (n === 0) return criterios;
  const base = Math.floor(10000 / n); // en centésimas
  return criterios.map((c, i) => {
    const centesimas = i === n - 1 ? 10000 - base * (n - 1) : base;
    return { ...c, pesoPorcentual: String(centesimas / 100) };
  });
}

/** Texto para mostrar una suma o peso: 100 → "100", 99.5 → "99.5". */
export function formatearPeso(valor) {
  return String(Math.round(Number(valor) * 100) / 100);
}

/**
 * Valida el formulario con las mismas reglas del backend (Criterios 1 y 2).
 * @param {{ nombre: string, criterios: Array<Object> }} form
 * @returns {Record<string, string>} Errores por campo; vacío si es válido.
 */
export function validarRubrica(form) {
  const errores = {};
  const nombre = (form?.nombre || '').trim();
  if (!nombre) {
    errores.nombre = 'El nombre de la rúbrica es obligatorio.';
  } else if (nombre.length > LIMITES_RUBRICA.nombre) {
    errores.nombre = `El nombre no puede superar los ${LIMITES_RUBRICA.nombre} caracteres.`;
  }

  const criterios = form?.criterios || [];
  if (criterios.length === 0) {
    errores.criterios = 'La rúbrica debe tener al menos un criterio.';
    return errores;
  }
  if (criterios.length > LIMITES_RUBRICA.maxCriterios) {
    errores.criterios = `La rúbrica no puede tener más de ${LIMITES_RUBRICA.maxCriterios} criterios.`;
  }

  const nombres = new Set();
  criterios.forEach((c, i) => {
    const pref = `criterios[${i}]`;
    const nombreCriterio = (c.nombre || '').trim();
    if (!nombreCriterio) {
      errores[`${pref}.nombre`] = 'Escribe el nombre del criterio.';
    } else if (nombreCriterio.length > LIMITES_RUBRICA.criterio) {
      errores[`${pref}.nombre`] = `Máximo ${LIMITES_RUBRICA.criterio} caracteres.`;
    } else {
      const clave = nombreCriterio.toLowerCase();
      if (nombres.has(clave)) errores[`${pref}.nombre`] = 'Este criterio está repetido en la rúbrica.';
      nombres.add(clave);
    }

    const peso = aNumero(c.pesoPorcentual);
    if (Number.isNaN(peso)) {
      errores[`${pref}.pesoPorcentual`] = 'Indica el peso.';
    } else if (peso <= 0 || peso > 100) {
      errores[`${pref}.pesoPorcentual`] = 'Debe ser mayor que 0 y máximo 100.';
    } else if (decimales(c.pesoPorcentual) > 2) {
      errores[`${pref}.pesoPorcentual`] = 'Máximo 2 decimales.';
    }

    const minima = aNumero(c.escalaMinima);
    const maxima = aNumero(c.escalaMaxima);
    const fueraDeRango = (v) => v < ESCALA_LIMITE_MINIMO || v > ESCALA_LIMITE_MAXIMO;
    if (Number.isNaN(minima) || fueraDeRango(minima)) {
      errores[`${pref}.escalaMinima`] = `Entre ${ESCALA_LIMITE_MINIMO} y ${ESCALA_LIMITE_MAXIMO}.`;
    }
    if (Number.isNaN(maxima) || fueraDeRango(maxima)) {
      errores[`${pref}.escalaMaxima`] = `Entre ${ESCALA_LIMITE_MINIMO} y ${ESCALA_LIMITE_MAXIMO}.`;
    } else if (!Number.isNaN(minima) && maxima <= minima) {
      errores[`${pref}.escalaMaxima`] = 'Debe ser mayor que la mínima.';
    }
  });

  // Criterio 2: la suma de los pesos debe ser exactamente 100 %
  const suma = sumaPesos(criterios);
  if (suma !== 100) {
    errores.pesoPorcentual = `La suma de los pesos es ${formatearPeso(suma)}% y debe ser exactamente 100%.`;
  }

  return errores;
}

/**
 * Cuerpo para PUT /convocatorias/{id}/rubrica.
 * @param {{ nombre: string, criterios: Array<Object> }} form
 */
export function aRequest(form) {
  return {
    nombre: form.nombre.trim(),
    criterios: form.criterios.map((c) => ({
      nombre: c.nombre.trim(),
      pesoPorcentual: aNumero(c.pesoPorcentual),
      escalaMinima: aNumero(c.escalaMinima),
      escalaMaxima: aNumero(c.escalaMaxima),
    })),
  };
}

/** Mensajes por estado HTTP cuando el backend no envía uno utilizable. */
const MENSAJE_POR_ESTADO = {
  400: 'Los datos enviados no son válidos. Revisa el formulario.',
  403: 'Tu usuario no tiene permiso para configurar la evaluación de esta convocatoria.',
  404: 'La convocatoria ya no existe. Recarga la página.',
  409: 'La operación entra en conflicto con el estado actual. Recarga e intenta de nuevo.',
  500: 'El servidor tuvo un problema al procesar la solicitud. Intenta de nuevo en unos minutos.',
};

/**
 * Traduce un error de Axios al formato que usa la interfaz.
 * Sigue el ErrorResponse del backend: { message, codigo, erroresValidacion }.
 * @param {any} err
 * @returns {{ mensaje: string, campos: Record<string, string>, codigo: string|undefined, status: number|undefined }}
 */
export function interpretarErrorApi(err) {
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
  return { mensaje, campos, codigo: data?.codigo, status };
}

/**
 * Criterio 4: extrae el impacto del 409 RUBRICA_EN_USO. Devuelve null si el error es otro.
 * El backend envía los conteos como texto dentro de `erroresValidacion`.
 * @param {any} err
 * @returns {{ mensaje: string, calificacionesRegistradas: number, asignacionesAfectadas: number,
 *   propuestasAfectadas: number }|null}
 */
export function impactoDeError(err) {
  const data = err?.response?.data;
  if (err?.response?.status !== 409 || data?.codigo !== 'RUBRICA_EN_USO') return null;
  const e = data.erroresValidacion || {};
  return {
    mensaje: typeof data.message === 'string' ? data.message : '',
    calificacionesRegistradas: Number(e.calificacionesRegistradas) || 0,
    asignacionesAfectadas: Number(e.asignacionesAfectadas) || 0,
    propuestasAfectadas: Number(e.propuestasAfectadas) || 0,
  };
}

/** "1 propuesta" / "3 propuestas". */
export function plural(cantidad, singular, pluralTexto = `${singular}s`) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}
