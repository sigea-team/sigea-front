/**
 * @file presupuestoUtils.js
 * @description Utilidades del presupuesto preliminar (HU-07): lectura y formato de valores en
 * pesos, validaciones del rubro (Criterio 3), lectura de errores de la API y textos del historial.
 * @module features/presupuesto/presupuestoUtils
 */

import { ESTADOS_EVENTO, extraerError } from '../eventos/eventoUtils';

/**
 * Límites; coinciden con las validaciones de RubroRequest en el backend
 * (@Size y @Digits, que corresponden a NUMERIC(10,2) y NUMERIC(14,2)).
 */
export const LIMITES_RUBRO = {
  nombre: 100,
  motivo: 255,
  enterosCantidad: 8,
  enterosValor: 12,
  decimales: 2,
};

/** Etiquetas del tipo de operación del historial (CHECK de historial_rubros). */
export const OPERACIONES_RUBRO = {
  creacion: 'Creación',
  edicion: 'Edición',
  eliminacion: 'Eliminación',
};

// ---------------------------------------------------------------------------
// Números y moneda
// ---------------------------------------------------------------------------

const formatoPesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatoPesosConCentavos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatoCantidad = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

/**
 * 1500000 → "$ 1.500.000"; 7500.5 → "$ 7.500,50". Valores no numéricos → "—".
 * @param {number|string|null|undefined} valor
 */
export function formatearPesos(valor) {
  const numero = Number(valor);
  if (valor === null || valor === undefined || valor === '' || Number.isNaN(numero)) return '—';
  return Number.isInteger(numero) ? formatoPesos.format(numero) : formatoPesosConCentavos.format(numero);
}

/** 2.5 → "2,5"; 2 → "2". */
export function formatearCantidad(valor) {
  const numero = Number(valor);
  if (valor === null || valor === undefined || Number.isNaN(numero)) return '—';
  return formatoCantidad.format(numero);
}

/**
 * Convierte lo que escribe el usuario en un número, con las convenciones de Colombia.
 * - "350000", "350.000", "1.500.000" → punto como separador de miles.
 * - "350000,50", "1.500.000,5" → coma como separador decimal.
 * - "2.5" (un solo punto con 1 o 2 decimales) → se toma como decimal.
 * - Se ignoran espacios y el signo "$".
 * @param {string|number} texto
 * @returns {number|null} null si está vacío; NaN si no es un número válido.
 */
export function leerNumero(texto) {
  if (typeof texto === 'number') return texto;
  let limpio = String(texto ?? '').replace(/[\s$]/g, '');
  if (!limpio) return null;

  if (limpio.includes(',')) {
    limpio = limpio.replace(/\./g, '').replace(',', '.');
  } else if (!/^-?\d+\.\d{1,2}$/.test(limpio)) {
    limpio = limpio.replace(/\./g, '');
  }
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) return Number.NaN;
  return Number(limpio);
}

/** Número de decimales que trae un número ya leído. */
function contarDecimales(numero) {
  const [, decimales = ''] = String(numero).split('.');
  return decimales.length;
}

/**
 * Valor de un rubro: cantidad × valor unitario, redondeado a 2 decimales (igual que el backend).
 * @returns {number|null} null si falta algún dato o no es válido.
 */
export function calcularSubtotal(cantidad, valorUnitario) {
  if (cantidad === null || valorUnitario === null || Number.isNaN(cantidad) || Number.isNaN(valorUnitario)) {
    return null;
  }
  return Math.round(cantidad * valorUnitario * 100) / 100;
}

// ---------------------------------------------------------------------------
// Validación del formulario (Criterio 3)
// ---------------------------------------------------------------------------

/** Formulario vacío de un rubro. La cantidad empieza en 1 porque es el caso más común. */
export const FORM_RUBRO_VACIO = { nombre: '', cantidad: '1', valorUnitario: '', motivo: '' };

/** Quita espacios al inicio y al final y reduce los espacios repetidos (igual que el backend). */
export function normalizarNombre(nombre) {
  return (nombre || '').trim().replace(/\s+/g, ' ');
}

/**
 * Valida un campo numérico. Los mensajes coinciden con los de RubroRequest en el backend.
 * @param {number|null} numero - Resultado de leerNumero.
 * @param {{ obligatorio: boolean, enteros: number, mensajes: {obligatorio?: string, formato: string, negativo: string, decimales: string, enteros: string} }} reglas
 * @returns {string|null}
 */
function validarNumero(numero, { obligatorio, enteros, mensajes }) {
  if (numero === null) return obligatorio ? mensajes.obligatorio : null;
  if (Number.isNaN(numero)) return mensajes.formato;
  if (numero < 0) return mensajes.negativo;
  if (contarDecimales(numero) > LIMITES_RUBRO.decimales) return mensajes.decimales;
  if (Math.trunc(numero).toString().length > enteros) return mensajes.enteros;
  return null;
}

/** Mensajes de error; los mismos textos que devuelve el backend (Criterio 3). */
export const MENSAJES_RUBRO = {
  nombreObligatorio: 'El nombre del rubro es obligatorio.',
  cantidad: {
    formato: 'La cantidad debe ser un número, por ejemplo 2 o 2,5.',
    negativo: 'La cantidad no puede ser negativa.',
    decimales: 'La cantidad admite máximo 8 dígitos enteros y 2 decimales.',
    enteros: 'La cantidad admite máximo 8 dígitos enteros y 2 decimales.',
  },
  valor: {
    obligatorio: 'El valor estimado del rubro es obligatorio.',
    formato: 'El valor estimado debe ser un número, por ejemplo 350000 o 350.000.',
    negativo: 'El valor estimado del rubro no puede ser negativo.',
    decimales: 'El valor estimado admite máximo 12 dígitos enteros y 2 decimales.',
    enteros: 'El valor estimado admite máximo 12 dígitos enteros y 2 decimales.',
  },
};

/**
 * Valida en el cliente las mismas reglas que valida el backend (Criterio 3):
 * nombre obligatorio, valor obligatorio, sin valores negativos. El valor 0 se acepta.
 * También avisa del nombre repetido entre los rubros vigentes antes de enviar.
 *
 * @param {{ nombre: string, cantidad: string, valorUnitario: string, motivo?: string }} form
 * @param {Array<{id: number, nombre: string, activo: boolean}>} [rubros=[]] - Rubros del presupuesto.
 * @param {number} [idEditando] - Rubro que se está editando (se excluye del control de duplicados).
 * @returns {Object} errores por campo (vacío si todo está bien)
 */
export function validarRubro(form, rubros = [], idEditando) {
  const errores = {};
  const nombre = normalizarNombre(form.nombre);

  if (!nombre) errores.nombre = MENSAJES_RUBRO.nombreObligatorio;
  else if (nombre.length > LIMITES_RUBRO.nombre) {
    errores.nombre = `El nombre del rubro no puede superar los ${LIMITES_RUBRO.nombre} caracteres.`;
  } else if (
    rubros.some((r) => r.activo && r.id !== idEditando && normalizarNombre(r.nombre).toLowerCase() === nombre.toLowerCase())
  ) {
    errores.nombre = `Ya existe un rubro llamado «${nombre}» en este presupuesto.`;
  }

  const errorCantidad = validarNumero(leerNumero(form.cantidad), {
    obligatorio: false,
    enteros: LIMITES_RUBRO.enterosCantidad,
    mensajes: MENSAJES_RUBRO.cantidad,
  });
  if (errorCantidad) errores.cantidad = errorCantidad;

  const errorValor = validarNumero(leerNumero(form.valorUnitario), {
    obligatorio: true,
    enteros: LIMITES_RUBRO.enterosValor,
    mensajes: MENSAJES_RUBRO.valor,
  });
  if (errorValor) errores.valorUnitario = errorValor;

  if ((form.motivo || '').trim().length > LIMITES_RUBRO.motivo) {
    errores.motivo = `El motivo no puede superar los ${LIMITES_RUBRO.motivo} caracteres.`;
  }
  return errores;
}

/**
 * Convierte el formulario en el cuerpo que espera el backend (RubroRequest).
 * Sin cantidad, el backend asume 1.
 * @param {{ nombre: string, cantidad: string, valorUnitario: string, motivo?: string }} form
 */
export function aPeticionRubro(form) {
  const cantidad = leerNumero(form.cantidad);
  const motivo = (form.motivo || '').trim();
  return {
    nombre: normalizarNombre(form.nombre),
    ...(cantidad === null ? {} : { cantidad }),
    valorUnitarioProyectado: leerNumero(form.valorUnitario),
    ...(motivo ? { motivo } : {}),
  };
}

/** Rubro de la API → valores del formulario de edición. */
export function aFormularioRubro(rubro) {
  return {
    nombre: rubro.nombre,
    cantidad: formatearCantidad(rubro.cantidad),
    valorUnitario: formatearCantidad(rubro.valorUnitarioProyectado),
    motivo: '',
  };
}

// ---------------------------------------------------------------------------
// Errores de la API
// ---------------------------------------------------------------------------

/** Campos del backend que se muestran en otro campo del formulario. */
const CAMPO_EQUIVALENTE = { valorUnitarioProyectado: 'valorUnitario' };

/**
 * Traduce un error al guardar o eliminar un rubro:
 * - 400 con erroresValidacion → cada mensaje en su campo (Criterio 3).
 * - 409 RUBRO_DUPLICADO → en el campo nombre.
 * - 403 → mensaje del permiso de presupuesto.
 * - Lo demás (estado del evento, presupuesto aprobado, servidor) → mensaje general.
 * @param {any} err
 * @returns {{ campos: Object, mensaje: string|null, codigo: string|undefined, status: number|undefined }}
 */
export function interpretarErrorRubro(err) {
  const { mensaje, campos, status, codigo } = extraerError(err);
  if (status === 403) {
    return {
      campos: {},
      mensaje: 'Tu usuario no tiene permiso para gestionar el presupuesto. Pide al administrador el permiso PRESUPUESTO_GESTIONAR.',
      codigo,
      status,
    };
  }
  const porCampo = {};
  Object.entries(campos).forEach(([campo, texto]) => {
    porCampo[CAMPO_EQUIVALENTE[campo] || campo] = texto;
  });
  if (codigo === 'RUBRO_DUPLICADO') {
    return { campos: { ...porCampo, nombre: mensaje }, mensaje: null, codigo, status };
  }
  if (Object.keys(porCampo).length > 0) {
    return { campos: porCampo, mensaje: null, codigo, status };
  }
  return { campos: {}, mensaje, codigo, status };
}

// ---------------------------------------------------------------------------
// Estado del presupuesto
// ---------------------------------------------------------------------------

/**
 * Explica por qué el presupuesto no se puede modificar.
 * @param {{ presupuestoAprobado: boolean, estadoEvento: string }} presupuesto
 */
export function motivoPresupuestoBloqueado(presupuesto) {
  if (presupuesto?.presupuestoAprobado) {
    return 'El evento ya tiene un presupuesto aprobado. El presupuesto preliminar queda como referencia y no se puede modificar.';
  }
  const estado = ESTADOS_EVENTO[presupuesto?.estadoEvento] || presupuesto?.estadoEvento || 'desconocido';
  return `El evento está «${estado}». El presupuesto preliminar solo se puede modificar mientras el evento está en configuración o habilitado.`;
}

// ---------------------------------------------------------------------------
// Historial (Criterio 2)
// ---------------------------------------------------------------------------

const formatoFechaHora = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** "2026-10-08T16:05:00" → "8 oct 2026, 4:05 p. m." */
export function formatearFechaHora(fechaHora) {
  if (!fechaHora) return '—';
  const fecha = new Date(fechaHora);
  return Number.isNaN(fecha.getTime()) ? '—' : formatoFechaHora.format(fecha).replace('.', '');
}

/**
 * Nombre del rubro que muestra un registro del historial: el nuevo, o el anterior si se eliminó.
 * @param {Object} registro
 */
export function nombreRubroHistorial(registro) {
  return registro.nombreNuevo ?? registro.nombreAnterior ?? `Rubro ${registro.rubroId}`;
}

/**
 * Cambios de una edición, campo por campo, para mostrarlos como "antes → después".
 * Solo devuelve los campos que cambiaron.
 * @param {Object} registro - HistorialRubroResponse
 * @returns {Array<{campo: string, antes: string, despues: string}>}
 */
export function cambiosDeEdicion(registro) {
  const cambios = [];
  if (registro.nombreAnterior !== registro.nombreNuevo) {
    cambios.push({ campo: 'Nombre', antes: registro.nombreAnterior, despues: registro.nombreNuevo });
  }
  if (Number(registro.cantidadAnterior) !== Number(registro.cantidadNueva)) {
    cambios.push({
      campo: 'Cantidad',
      antes: formatearCantidad(registro.cantidadAnterior),
      despues: formatearCantidad(registro.cantidadNueva),
    });
  }
  if (Number(registro.valorUnitarioAnterior) !== Number(registro.valorUnitarioNuevo)) {
    cambios.push({
      campo: 'Valor unitario',
      antes: formatearPesos(registro.valorUnitarioAnterior),
      despues: formatearPesos(registro.valorUnitarioNuevo),
    });
  }
  return cambios;
}

/**
 * Diferencia del total que produjo un cambio: "+ $ 300.000", "− $ 600.000" o "Sin cambio".
 * @param {Object} registro
 */
export function variacionTotal(registro) {
  const diferencia = Number(registro.totalPresupuestoNuevo) - Number(registro.totalPresupuestoAnterior);
  if (!diferencia) return 'Sin cambio en el total';
  return `${diferencia > 0 ? '+' : '−'} ${formatearPesos(Math.abs(diferencia))}`;
}
