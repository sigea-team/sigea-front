/**
 * @file ejecucionUtils.js
 * @description Utilidades de la ejecución presupuestal (HU-09: RF11 + RF12): formato del porcentaje,
 * validación del gasto (Criterio 3), cuerpo de la petición y lectura de errores de la API.
 * Las reglas coinciden con GastoEjecutadoRequest en el backend.
 * @module features/presupuesto/ejecucionUtils
 */

import { extraerError } from '../eventos/eventoUtils';
import { leerNumero } from './presupuestoUtils';

/** Límites; coinciden con @Digits y @Size de GastoEjecutadoRequest (NUMERIC(14,2), VARCHAR(255)). */
export const LIMITES_GASTO = {
  enterosValor: 12,
  decimales: 2,
  soporte: 255,
  descripcion: 255,
};

/** Mensajes de error; los mismos textos que devuelve el backend. */
export const MENSAJES_GASTO = {
  rubroObligatorio: 'El rubro del gasto es obligatorio.',
  valorObligatorio: 'El valor del gasto es obligatorio.',
  valorFormato: 'El valor debe ser un número, por ejemplo 350000 o 350.000.',
  valorNegativo: 'El valor del gasto no puede ser negativo.',
  valorDigitos: 'El valor admite máximo 12 enteros y 2 decimales.',
  fechaObligatoria: 'La fecha del gasto es obligatoria.',
  fechaFutura: 'La fecha del gasto no puede ser futura.',
  soporteLargo: 'El soporte no puede superar los 255 caracteres.',
  descripcionLarga: 'La descripción no puede superar los 255 caracteres.',
};

/** Fecha de hoy en formato YYYY-MM-DD, según la hora local (la que espera el backend como LocalDate). */
export function hoyIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Formulario vacío de un gasto: fecha de hoy y sin rubro elegido. */
export function formGastoVacio(rubroId = '') {
  return { rubroId: rubroId ? String(rubroId) : '', valor: '', fechaGasto: hoyIso(), soporteUrl: '', descripcion: '' };
}

/** Número de decimales que trae un número ya leído. */
function contarDecimales(numero) {
  const [, decimales = ''] = String(numero).split('.');
  return decimales.length;
}

/**
 * Valida en el cliente las mismas reglas del backend (Criterio 3):
 * rubro y valor obligatorios, valor no negativo (el 0 se acepta), fecha obligatoria y no futura.
 * El soporte es opcional.
 * @param {{ rubroId: string, valor: string, fechaGasto: string, soporteUrl?: string, descripcion?: string }} form
 * @returns {Object} errores por campo (vacío si todo está bien)
 */
export function validarGasto(form) {
  const errores = {};

  if (!form.rubroId) errores.rubroId = MENSAJES_GASTO.rubroObligatorio;

  const valor = leerNumero(form.valor);
  if (valor === null) errores.valor = MENSAJES_GASTO.valorObligatorio;
  else if (Number.isNaN(valor)) errores.valor = MENSAJES_GASTO.valorFormato;
  else if (valor < 0) errores.valor = MENSAJES_GASTO.valorNegativo;
  else if (
    contarDecimales(valor) > LIMITES_GASTO.decimales ||
    Math.trunc(valor).toString().length > LIMITES_GASTO.enterosValor
  ) {
    errores.valor = MENSAJES_GASTO.valorDigitos;
  }

  if (!form.fechaGasto) errores.fechaGasto = MENSAJES_GASTO.fechaObligatoria;
  else if (form.fechaGasto > hoyIso()) errores.fechaGasto = MENSAJES_GASTO.fechaFutura;

  if ((form.soporteUrl || '').trim().length > LIMITES_GASTO.soporte) errores.soporteUrl = MENSAJES_GASTO.soporteLargo;
  if ((form.descripcion || '').trim().length > LIMITES_GASTO.descripcion) {
    errores.descripcion = MENSAJES_GASTO.descripcionLarga;
  }
  return errores;
}

/**
 * Convierte el formulario en el cuerpo que espera el backend (GastoEjecutadoRequest).
 * Soporte y descripción vacíos no se envían.
 * @param {{ rubroId: string, valor: string, fechaGasto: string, soporteUrl?: string, descripcion?: string }} form
 */
export function aPeticionGasto(form) {
  const soporteUrl = (form.soporteUrl || '').trim();
  const descripcion = (form.descripcion || '').trim();
  return {
    rubroId: Number(form.rubroId),
    valor: leerNumero(form.valor),
    fechaGasto: form.fechaGasto,
    ...(soporteUrl ? { soporteUrl } : {}),
    ...(descripcion ? { descripcion } : {}),
  };
}

/**
 * Traduce un error al registrar un gasto:
 * - 400 con erroresValidacion → cada mensaje en su campo (Criterio 3).
 * - 403 → mensaje del permiso de presupuesto.
 * - Lo demás (sin presupuesto aprobado, evento cerrado, rubro eliminado, servidor) → mensaje general.
 * @param {any} err
 * @returns {{ campos: Object, mensaje: string|null }}
 */
export function interpretarErrorGasto(err) {
  const { mensaje, campos, status } = extraerError(err);
  if (status === 403) {
    return {
      campos: {},
      mensaje: 'Tu usuario no tiene permiso para registrar gastos. Pide al administrador el permiso PRESUPUESTO_GESTIONAR.',
    };
  }
  if (Object.keys(campos).length > 0) return { campos, mensaje: null };
  return { campos: {}, mensaje };
}

const formatoPorcentaje = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** 25 → "25 %"; 33.33 → "33,33 %". */
export function formatearPorcentaje(valor) {
  const numero = Number(valor);
  if (valor === null || valor === undefined || Number.isNaN(numero)) return '—';
  return `${formatoPorcentaje.format(numero)} %`;
}

/** "2026-10-14" → "14 oct 2026" (sin desfase de zona horaria). */
export function formatearFecha(fecha) {
  if (!fecha) return '—';
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return '—';
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(anio, mes - 1, dia))
    .replace('.', '');
}

/** ¿El soporte es un enlace que se puede abrir? (el soporte también puede ser solo texto). */
export function esEnlace(texto) {
  return /^https?:\/\/\S+$/i.test((texto || '').trim());
}

/**
 * Explica por qué no se pueden registrar gastos, o null si sí se puede.
 * @param {{ tienePresupuestoAprobado: boolean }|null} ejecucion
 * @param {string} estadoEvento
 */
export function motivoSinRegistro(ejecucion, estadoEvento) {
  if (estadoEvento === 'cerrado') return 'El evento está cerrado: ya no se pueden registrar gastos.';
  if (ejecucion && !ejecucion.tienePresupuestoAprobado) {
    return 'El evento todavía no tiene un presupuesto aprobado. Regístralo primero para poder registrar gastos.';
  }
  if (ejecucion && ejecucion.rubros.length === 0) {
    return 'El evento no tiene rubros vigentes en su presupuesto. Agrega rubros al presupuesto preliminar.';
  }
  return null;
}
