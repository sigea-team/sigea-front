/**
 * @file comiteEvaluadorUtils.js
 * @description Reglas del registro del comité evaluador de una convocatoria (HU-15: RF23).
 *  - Criterio 3: el evaluador se registra por correo con su área de experticia. Si el correo no
 *    pertenece a ninguna persona, se piden sus datos para crearla.
 *  - Criterio 4: un correo ya registrado en el comité se rechaza (409 EVALUADOR_DUPLICADO).
 * @module features/comiteEvaluador/comiteEvaluadorUtils
 */

import { interpretarErrorApi } from '../rubricas/rubricaUtils';

/** Límites de longitud del backend. */
export const LIMITES_EVALUADOR = {
  correo: 150,
  areaExperticia: 150,
  tipoDocumento: 20,
  numeroDocumento: 30,
  nombres: 100,
  apellidos: 100,
  telefono: 30,
};

/** Tipos de documento ofrecidos en el formulario de persona nueva. */
export const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PAS', label: 'Pasaporte' },
];

export const FORM_EVALUADOR_VACIO = {
  correo: '',
  areaExperticia: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
  nombres: '',
  apellidos: '',
  telefono: '',
};

/** Campos que solo se envían cuando la persona no está registrada. */
const CAMPOS_PERSONA = ['tipoDocumento', 'numeroDocumento', 'nombres', 'apellidos', 'telefono'];

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida el formulario de registro.
 * @param {typeof FORM_EVALUADOR_VACIO} form
 * @param {boolean} personaNueva - true si se muestran (y exigen) los datos de la persona.
 * @returns {Record<string, string>} Errores por campo; vacío si es válido.
 */
export function validarEvaluador(form, personaNueva) {
  const errores = {};
  const correo = (form.correo || '').trim();
  if (!correo) errores.correo = 'El correo del evaluador es obligatorio.';
  else if (!PATRON_CORREO.test(correo)) errores.correo = 'Escribe un correo válido.';
  else if (correo.length > LIMITES_EVALUADOR.correo) errores.correo = `Máximo ${LIMITES_EVALUADOR.correo} caracteres.`;

  const area = (form.areaExperticia || '').trim();
  if (!area) errores.areaExperticia = 'Indica el área de experticia.';
  else if (area.length > LIMITES_EVALUADOR.areaExperticia) {
    errores.areaExperticia = `Máximo ${LIMITES_EVALUADOR.areaExperticia} caracteres.`;
  }

  if (personaNueva) {
    if (!(form.tipoDocumento || '').trim()) errores.tipoDocumento = 'Selecciona el tipo de documento.';
    const documento = (form.numeroDocumento || '').trim();
    if (!documento) errores.numeroDocumento = 'El número de documento es obligatorio.';
    else if (documento.length > LIMITES_EVALUADOR.numeroDocumento) {
      errores.numeroDocumento = `Máximo ${LIMITES_EVALUADOR.numeroDocumento} caracteres.`;
    }
    if (!(form.nombres || '').trim()) errores.nombres = 'Los nombres son obligatorios.';
    if (!(form.apellidos || '').trim()) errores.apellidos = 'Los apellidos son obligatorios.';
  }
  return errores;
}

/**
 * Cuerpo para POST /convocatorias/{id}/comite-evaluador.
 * Los datos personales solo se envían si la persona es nueva.
 * @param {typeof FORM_EVALUADOR_VACIO} form
 * @param {boolean} personaNueva
 */
export function aRequestEvaluador(form, personaNueva) {
  const request = {
    correo: form.correo.trim(),
    areaExperticia: form.areaExperticia.trim(),
  };
  if (personaNueva) {
    CAMPOS_PERSONA.forEach((campo) => {
      const valor = (form[campo] || '').trim();
      if (valor) request[campo] = valor;
    });
  }
  return request;
}

/**
 * Traduce el error del registro a mensajes del formulario (Criterios 3 y 4).
 * @param {any} err
 * @returns {{ mensaje: string, campos: Record<string, string>, requiereDatosPersona: boolean }}
 */
export function interpretarErrorEvaluador(err) {
  const { mensaje, campos, codigo, status } = interpretarErrorApi(err);

  // Criterio 4: correo ya registrado en el comité de la convocatoria
  if (codigo === 'EVALUADOR_DUPLICADO') {
    return { mensaje, campos: { ...campos, correo: 'Este correo ya está en el comité.' }, requiereDatosPersona: false };
  }

  // El documento de la persona nueva ya pertenece a otra persona (el campo llega en erroresValidacion)
  if (codigo === 'DATOS_PERSONA_DUPLICADOS') {
    const conCampo = Object.keys(campos).length > 0 ? campos : { numeroDocumento: mensaje };
    return { mensaje, campos: conCampo, requiereDatosPersona: true };
  }

  // Criterio 3: el correo no pertenece a ninguna persona; hay que completar sus datos
  const requiereDatosPersona =
    status === 400 && codigo === 'SOLICITUD_INVALIDA' && /no pertenece a ninguna persona/i.test(mensaje);
  return { mensaje, campos, requiereDatosPersona };
}

/** Nombre para mostrar de un evaluador. */
export function nombreEvaluador(evaluador) {
  return `${evaluador?.nombres || ''} ${evaluador?.apellidos || ''}`.trim() || evaluador?.correo || 'Evaluador';
}
