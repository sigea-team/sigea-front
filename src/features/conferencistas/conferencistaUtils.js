/**
 * @file conferencistaUtils.js
 * @description Utilidades del módulo de conferencistas (HU-12: RF16 y RF17): catálogos, reglas de
 * estado, armado del formulario, validaciones (Criterio 2), conversión a las peticiones del backend
 * y lectura de errores (incluida la coincidencia del Criterio 3).
 * @module features/conferencistas/conferencistaUtils
 */

import { ESTADOS_EVENTO, extraerError } from '../eventos/eventoUtils';

/** Mismos tipos de documento que el registro de usuarios. */
export const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
  { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  { value: 'CE', label: 'Cédula de Extranjería (CE)' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'PEP', label: 'Permiso Especial de Permanencia (PEP)' },
];

/** CHECK de participaciones_conferencista.tipo_participacion. */
export const TIPOS_PARTICIPACION = [
  { value: 'conferencista', label: 'Conferencista invitado' },
  { value: 'ponente', label: 'Ponente' },
];

/** CHECK de estudios_conferencista.nivel. */
export const NIVELES_ESTUDIO = [
  { value: 'pregrado', label: 'Pregrado' },
  { value: 'especializacion', label: 'Especialización' },
  { value: 'maestria', label: 'Maestría' },
  { value: 'doctorado', label: 'Doctorado' },
  { value: 'posdoctorado', label: 'Posdoctorado' },
  { value: 'otro', label: 'Otro' },
];

/** CHECK de publicaciones_conferencista.tipo. */
export const TIPOS_PUBLICACION = [
  { value: 'articulo', label: 'Artículo' },
  { value: 'libro', label: 'Libro' },
  { value: 'capitulo', label: 'Capítulo de libro' },
  { value: 'ponencia', label: 'Ponencia' },
  { value: 'otro', label: 'Otro' },
];

/** Longitudes máximas; coinciden con las validaciones @Size de los DTO del backend. */
export const LIMITES_CONFERENCISTA = {
  tipoDocumento: 20,
  numeroDocumento: 30,
  nombres: 100,
  apellidos: 100,
  correo: 150,
  telefono: 30,
  tema: 200,
  biografia: 4000,
  cargoActual: 150,
  institucion: 150,
  enlacePerfil: 300,
  estudios: 20,
  publicaciones: 50,
  tituloEstudio: 200,
  institucionEstudio: 150,
  tituloPublicacion: 300,
  medio: 200,
  enlace: 300,
  nombreInvitacion: 200,
};

/**
 * Estados en los que se asocian o retiran conferencistas del evento.
 * Debe coincidir con ESTADOS_ASOCIACION_MODIFICABLE de ConferencistaService.
 */
export const ESTADOS_ASOCIACION_MODIFICABLE = ['en_configuracion', 'habilitado'];

/**
 * Estados en los que el evento ya está publicado y sus conferencistas se ven en la vista pública.
 * Debe coincidir con ESTADOS_EVENTO_PUBLICO de ConferencistaService.
 */
export const ESTADOS_EVENTO_PUBLICO = ['habilitado', 'en_ejecucion', 'cerrado'];

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ENLACE_REGEX = /^https?:\/\/\S+$/;
const ANIO_MINIMO = 1900;

/** @param {{estado: string}} evento */
export function puedeAsociarConferencistas(evento) {
  return ESTADOS_ASOCIACION_MODIFICABLE.includes(evento?.estado);
}

/** @param {{estado: string}} evento */
export function esEventoPublico(evento) {
  return ESTADOS_EVENTO_PUBLICO.includes(evento?.estado);
}

/** Texto que explica por qué no se pueden asociar ni retirar conferencistas. */
export function motivoAsociacionBloqueada(evento) {
  const estado = ESTADOS_EVENTO[evento?.estado] || evento?.estado || 'desconocido';
  return `El evento está «${estado}». Los conferencistas solo se asocian o retiran mientras el evento está en configuración o habilitado. Su trayectoria sí se puede actualizar.`;
}

/** @param {string} valor */
export function etiquetaParticipacion(valor) {
  return TIPOS_PARTICIPACION.find((t) => t.value === valor)?.label || valor || '—';
}

/** @param {string} valor */
export function etiquetaNivel(valor) {
  return NIVELES_ESTUDIO.find((n) => n.value === valor)?.label || valor || '—';
}

/** @param {string} valor */
export function etiquetaPublicacion(valor) {
  return TIPOS_PUBLICACION.find((t) => t.value === valor)?.label || valor || '—';
}

// ------------------------------------------------------------------
// Estado del formulario
// ------------------------------------------------------------------

let contadorClaves = 0;
/** Clave estable para las filas dinámicas de estudios y publicaciones (React `key`). */
function nuevaClave(prefijo) {
  contadorClaves += 1;
  return `${prefijo}-${contadorClaves}`;
}

export function estudioVacio() {
  return { clave: nuevaClave('est'), nivel: '', titulo: '', institucion: '', anio: '' };
}

export function publicacionVacia() {
  return { clave: nuevaClave('pub'), tipo: '', titulo: '', medio: '', anio: '', enlace: '' };
}

/** Formulario vacío para registrar un conferencista nuevo. */
export function formularioVacio() {
  return {
    tipoDocumento: 'CC',
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    tipoParticipacion: 'conferencista',
    tema: '',
    biografia: '',
    cargoActual: '',
    institucion: '',
    enlacePerfil: '',
    estudios: [],
    publicaciones: [],
  };
}

/**
 * Formulario precargado con el perfil del backend (Criterio 4: editar la trayectoria).
 * @param {Object} perfil - PerfilConferencistaResponse
 */
export function formularioDesdePerfil(perfil) {
  const t = perfil?.trayectoria || {};
  const texto = (v) => (v === null || v === undefined ? '' : String(v));
  return {
    ...formularioVacio(),
    tipoDocumento: perfil?.tipoDocumento || 'CC',
    numeroDocumento: texto(perfil?.numeroDocumento),
    nombres: texto(perfil?.nombres),
    apellidos: texto(perfil?.apellidos),
    correo: texto(perfil?.correo),
    telefono: texto(perfil?.telefono),
    biografia: texto(t.biografia),
    cargoActual: texto(t.cargoActual),
    institucion: texto(t.institucion),
    enlacePerfil: texto(t.enlacePerfil),
    estudios: (t.estudios || []).map((e) => ({
      clave: nuevaClave('est'),
      nivel: texto(e.nivel),
      titulo: texto(e.titulo),
      institucion: texto(e.institucion),
      anio: texto(e.anio),
    })),
    publicaciones: (t.publicaciones || []).map((p) => ({
      clave: nuevaClave('pub'),
      tipo: texto(p.tipo),
      titulo: texto(p.titulo),
      medio: texto(p.medio),
      anio: texto(p.anio),
      enlace: texto(p.enlace),
    })),
  };
}

/**
 * Separa un nombre completo en nombres y apellidos para precargar el formulario del invitado
 * (él puede corregirlo): 4 o más palabras → 2 nombres + resto; 3 → 1 + 2; 2 → 1 + 1.
 * @param {string} nombre
 * @returns {{ nombres: string, apellidos: string }}
 */
export function dividirNombre(nombre) {
  const partes = String(nombre ?? '').trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return { nombres: partes[0] || '', apellidos: '' };
  const cantidadNombres = partes.length >= 4 ? 2 : 1;
  return { nombres: partes.slice(0, cantidadNombres).join(' '), apellidos: partes.slice(cantidadNombres).join(' ') };
}

/**
 * Formulario del invitado precargado con la invitación: si SIGEA ya tiene sus datos (p. ej. es un
 * participante con cuenta) se usan; si no, se separa el nombre con el que fue invitado.
 * El documento y el teléfono ya registrados nunca llegan completos (el enlace no pide sesión): se
 * guardan enmascarados en `documentoRegistrado` / `telefonoRegistrado` y los campos quedan vacíos;
 * si el invitado no los escribe, el backend conserva los guardados.
 * @param {Object} invitacion - InvitacionPublicaResponse
 */
export function formularioDesdeInvitacion(invitacion) {
  const registrados = invitacion?.datosRegistrados;
  if (registrados) {
    return {
      ...formularioDesdePerfil({ ...registrados, numeroDocumento: '', telefono: '', correo: invitacion.correo }),
      tipoDocumento: registrados.tipoDocumento || 'CC',
      documentoRegistrado: registrados.documentoEnmascarado || null,
      telefonoRegistrado: registrados.telefonoEnmascarado || null,
    };
  }
  return {
    ...formularioVacio(),
    ...dividirNombre(invitacion?.nombre),
    correo: invitacion?.correo || '',
    documentoRegistrado: null,
    telefonoRegistrado: null,
  };
}

/**
 * Mensaje para un enlace de invitación que ya no se puede usar.
 * @param {string|undefined} codigo - INVITACION_VENCIDA | INVITACION_COMPLETADA | INVITACION_CANCELADA | INVITACION_EVENTO_CERRADO
 * @param {number|undefined} status
 * @returns {{ titulo: string, detalle: string }}
 */
export function mensajeInvitacionNoDisponible(codigo, status) {
  const mensajes = {
    INVITACION_VENCIDA: {
      titulo: 'Este enlace ya venció',
      detalle: 'Los enlaces de invitación duran 3 días. Pide al organizador del evento que te reenvíe la invitación.',
    },
    INVITACION_COMPLETADA: {
      titulo: 'Ya registraste tus datos',
      detalle: 'Esta invitación ya se utilizó. Si necesitas cambiar tu trayectoria, comunícate con el organizador o ingresa a SIGEA con el perfil «Conferencista».',
    },
    INVITACION_CANCELADA: {
      titulo: 'Esta invitación fue cancelada',
      detalle: 'El organizador canceló la invitación. Si crees que es un error, comunícate con él.',
    },
    INVITACION_EVENTO_CERRADO: {
      titulo: 'El evento ya no recibe conferencistas',
      detalle: 'El evento ya comenzó o fue cerrado. Comunícate con el organizador.',
    },
  };
  if (mensajes[codigo]) return mensajes[codigo];
  if (status === 404) {
    return {
      titulo: 'Enlace no válido',
      detalle: 'Revisa que hayas copiado el enlace completo del correo o pide uno nuevo al organizador del evento.',
    };
  }
  return { titulo: 'No pudimos abrir tu invitación', detalle: 'Intenta de nuevo en unos minutos.' };
}

// ------------------------------------------------------------------
// Validación (Criterio 2)
// ------------------------------------------------------------------

function validarLongitud(errores, campo, valor, maximo, etiqueta) {
  if (valor.length > maximo) errores[campo] = `${etiqueta} no puede superar los ${maximo} caracteres.`;
}

function validarAnio(valor, anioActual) {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;
  if (!/^\d{4}$/.test(texto)) return 'Usa 4 dígitos.';
  const anio = Number(texto);
  if (anio < ANIO_MINIMO) return `Mínimo ${ANIO_MINIMO}.`;
  if (anio > anioActual) return `Máximo ${anioActual}.`;
  return null;
}

/**
 * Valida la trayectoria con las mismas reglas del backend.
 * @param {Object} form
 * @param {Object} errores - se completa con los errores encontrados
 * @param {number} anioActual
 */
function validarTrayectoria(form, errores, anioActual) {
  const biografia = form.biografia.trim();
  if (!biografia) errores.biografia = 'Escribe la biografía: es lo que se publica en la agenda y el material del evento.';
  else validarLongitud(errores, 'biografia', biografia, LIMITES_CONFERENCISTA.biografia, 'La biografía');

  validarLongitud(errores, 'cargoActual', form.cargoActual.trim(), LIMITES_CONFERENCISTA.cargoActual, 'El cargo');
  validarLongitud(errores, 'institucion', form.institucion.trim(), LIMITES_CONFERENCISTA.institucion, 'La institución');

  const enlace = form.enlacePerfil.trim();
  if (enlace && !ENLACE_REGEX.test(enlace)) errores.enlacePerfil = 'El enlace debe iniciar con http:// o https://';
  else validarLongitud(errores, 'enlacePerfil', enlace, LIMITES_CONFERENCISTA.enlacePerfil, 'El enlace');

  if (form.estudios.length > LIMITES_CONFERENCISTA.estudios) {
    errores.estudios = `Se permiten máximo ${LIMITES_CONFERENCISTA.estudios} estudios.`;
  }
  form.estudios.forEach((e, i) => {
    const base = `estudios.${i}`;
    if (!e.nivel) errores[`${base}.nivel`] = 'Selecciona el nivel.';
    if (!e.titulo.trim()) errores[`${base}.titulo`] = 'Escribe el título obtenido.';
    else validarLongitud(errores, `${base}.titulo`, e.titulo.trim(), LIMITES_CONFERENCISTA.tituloEstudio, 'El título');
    if (!e.institucion.trim()) errores[`${base}.institucion`] = 'Escribe la institución.';
    else validarLongitud(errores, `${base}.institucion`, e.institucion.trim(), LIMITES_CONFERENCISTA.institucionEstudio, 'La institución');
    const errorAnio = validarAnio(e.anio, anioActual);
    if (errorAnio) errores[`${base}.anio`] = errorAnio;
  });

  if (form.publicaciones.length > LIMITES_CONFERENCISTA.publicaciones) {
    errores.publicaciones = `Se permiten máximo ${LIMITES_CONFERENCISTA.publicaciones} publicaciones.`;
  }
  form.publicaciones.forEach((p, i) => {
    const base = `publicaciones.${i}`;
    if (!p.tipo) errores[`${base}.tipo`] = 'Selecciona el tipo.';
    if (!p.titulo.trim()) errores[`${base}.titulo`] = 'Escribe el título de la publicación.';
    else validarLongitud(errores, `${base}.titulo`, p.titulo.trim(), LIMITES_CONFERENCISTA.tituloPublicacion, 'El título');
    validarLongitud(errores, `${base}.medio`, p.medio.trim(), LIMITES_CONFERENCISTA.medio, 'El medio');
    const enlacePub = p.enlace.trim();
    if (enlacePub && !ENLACE_REGEX.test(enlacePub)) errores[`${base}.enlace`] = 'El enlace debe iniciar con http:// o https://';
    const errorAnio = validarAnio(p.anio, anioActual);
    if (errorAnio) errores[`${base}.anio`] = errorAnio;
  });
}

/**
 * Criterio 2: valida en el cliente los datos obligatorios antes de enviar.
 * @param {Object} form
 * @param {Object} [opciones]
 * @param {'invitacion'|'editar'|'asociar'} [opciones.modo='invitacion']
 *   - invitacion: el conferencista registra sus datos personales, tema y trayectoria (el correo es el de la invitación).
 *   - editar: datos personales con correo + trayectoria (la participación no cambia aquí).
 *   - asociar: tipo de participación y tema (+ trayectoria si `conTrayectoria`).
 * @param {boolean} [opciones.conTrayectoria=true] - en modo asociar, si hay que pedir la trayectoria.
 * @param {number} [opciones.anioActual] - para pruebas; por defecto el año en curso.
 * @returns {Object} errores por campo (vacío si todo está bien)
 */
export function validarConferencista(form, { modo = 'invitacion', conTrayectoria = true, anioActual = new Date().getFullYear() } = {}) {
  const errores = {};

  if (modo !== 'asociar') {
    if (!form.tipoDocumento) errores.tipoDocumento = 'Selecciona el tipo de documento.';
    const documento = form.numeroDocumento.trim();
    // En la invitación, si SIGEA ya tiene su documento, vacío significa «conservar el registrado».
    const documentoGuardado = modo === 'invitacion' && Boolean(form.documentoRegistrado);
    if (!documento && !documentoGuardado) errores.numeroDocumento = 'Escribe el número de documento.';
    else if (documento) validarLongitud(errores, 'numeroDocumento', documento, LIMITES_CONFERENCISTA.numeroDocumento, 'El documento');

    const nombres = form.nombres.trim();
    if (!nombres) errores.nombres = 'Escribe los nombres.';
    else validarLongitud(errores, 'nombres', nombres, LIMITES_CONFERENCISTA.nombres, 'Los nombres');

    const apellidos = form.apellidos.trim();
    if (!apellidos) errores.apellidos = 'Escribe los apellidos.';
    else validarLongitud(errores, 'apellidos', apellidos, LIMITES_CONFERENCISTA.apellidos, 'Los apellidos');

    validarLongitud(errores, 'telefono', form.telefono.trim(), LIMITES_CONFERENCISTA.telefono, 'El teléfono');
  }

  if (modo === 'editar') {
    const errorCorreo = validarCorreo(form.correo);
    if (errorCorreo) errores.correo = errorCorreo;
  }

  if (modo === 'asociar' && !form.tipoParticipacion) {
    errores.tipoParticipacion = 'Selecciona el tipo de participación.';
  }
  if (modo !== 'editar') {
    validarLongitud(errores, 'tema', form.tema.trim(), LIMITES_CONFERENCISTA.tema, 'El tema');
  }

  if (modo !== 'asociar' || conTrayectoria) {
    validarTrayectoria(form, errores, anioActual);
  }
  return errores;
}

/** @returns {string|null} mensaje de error del correo o null si es válido. */
function validarCorreo(valor) {
  const correo = String(valor ?? '').trim();
  if (!correo) return 'Escribe el correo de contacto.';
  if (!CORREO_REGEX.test(correo)) return 'El formato del correo no es válido.';
  if (correo.length > LIMITES_CONFERENCISTA.correo) return `El correo no puede superar los ${LIMITES_CONFERENCISTA.correo} caracteres.`;
  return null;
}

/**
 * Invitación a un conferencista nuevo: el administrador solo escribe nombre y correo.
 * @param {{ nombre: string, correo: string }} datos
 * @returns {Object} errores por campo
 */
export function validarInvitacion(datos) {
  const errores = {};
  const nombre = String(datos?.nombre ?? '').trim();
  if (!nombre) errores.nombre = 'Escribe el nombre del conferencista.';
  else if (nombre.length > LIMITES_CONFERENCISTA.nombreInvitacion) {
    errores.nombre = `El nombre no puede superar los ${LIMITES_CONFERENCISTA.nombreInvitacion} caracteres.`;
  }
  const errorCorreo = validarCorreo(datos?.correo);
  if (errorCorreo) errores.correo = errorCorreo;
  return errores;
}

// ------------------------------------------------------------------
// Conversión a las peticiones del backend
// ------------------------------------------------------------------

const textoONulo = (valor) => {
  const t = String(valor ?? '').trim();
  return t ? t : null;
};

const anioONulo = (valor) => {
  const t = String(valor ?? '').trim();
  return t ? Number(t) : null;
};

/** TrayectoriaRequest a partir del formulario. */
export function aTrayectoriaRequest(form) {
  return {
    biografia: form.biografia.trim(),
    cargoActual: textoONulo(form.cargoActual),
    institucion: textoONulo(form.institucion),
    enlacePerfil: textoONulo(form.enlacePerfil),
    estudios: form.estudios.map((e) => ({
      nivel: e.nivel,
      titulo: e.titulo.trim(),
      institucion: e.institucion.trim(),
      anio: anioONulo(e.anio),
    })),
    publicaciones: form.publicaciones.map((p) => ({
      tipo: p.tipo,
      titulo: p.titulo.trim(),
      medio: textoONulo(p.medio),
      anio: anioONulo(p.anio),
      enlace: textoONulo(p.enlace),
    })),
  };
}

function datosPersonales(form) {
  return {
    tipoDocumento: form.tipoDocumento,
    numeroDocumento: form.numeroDocumento.trim(),
    nombres: form.nombres.trim(),
    apellidos: form.apellidos.trim(),
    correo: form.correo.trim().toLowerCase(),
    telefono: textoONulo(form.telefono),
  };
}

/**
 * CompletarInvitacionRequest: lo que el conferencista envía desde el enlace (Criterios 1 y 2).
 * El correo no se envía: es el de la invitación.
 */
export function aCompletarRequest(form) {
  const datos = datosPersonales(form);
  return {
    tipoDocumento: datos.tipoDocumento,
    // Vacío → null: el backend conserva el documento ya registrado.
    numeroDocumento: datos.numeroDocumento || null,
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    telefono: datos.telefono,
    tema: textoONulo(form.tema),
    trayectoria: aTrayectoriaRequest(form),
  };
}

/** ActualizarConferencistaRequest (Criterio 4). */
export function aActualizarRequest(form) {
  return { ...datosPersonales(form), trayectoria: aTrayectoriaRequest(form) };
}

/**
 * AsociarConferencistaRequest (Criterio 3).
 * @param {number} personaId
 * @param {Object} form
 * @param {boolean} conTrayectoria - true si la persona aún no tiene trayectoria y se envía la del formulario.
 */
export function aAsociarRequest(personaId, form, conTrayectoria) {
  return {
    personaId,
    tipoParticipacion: form.tipoParticipacion,
    tema: textoONulo(form.tema),
    trayectoria: conTrayectoria ? aTrayectoriaRequest(form) : null,
  };
}

// ------------------------------------------------------------------
// Errores de la API
// ------------------------------------------------------------------

/**
 * Convierte los nombres de campo del backend a los del formulario:
 * "trayectoria.estudios[0].titulo" → "estudios.0.titulo", "trayectoria.biografia" → "biografia".
 * @param {string} campo
 */
export function campoDelFormulario(campo) {
  return campo.replace(/^trayectoria\./, '').replace(/\[(\d+)\]/g, '.$1');
}

/**
 * Normaliza `erroresValidacion` del backend. El backend repite cada error anidado con el último
 * segmento ("trayectoria.institucion" → "institucion"); esas copias se descartan porque pueden
 * pisar otro campo (p. ej. la institución de un estudio frente a la institución actual).
 * @param {Object<string,string>} errores
 */
export function normalizarErroresCampo(errores) {
  if (!errores || typeof errores !== 'object') return {};
  const claves = Object.keys(errores);
  const anidadas = claves.filter((c) => c.includes('.'));
  const resultado = {};
  claves.forEach((clave) => {
    const esCopia = !clave.includes('.') && anidadas.some((a) => a.endsWith(`.${clave}`));
    if (!esCopia) resultado[campoDelFormulario(clave)] = errores[clave];
  });
  return resultado;
}

/**
 * Traduce un error del módulo de conferencistas.
 * - 409 CONFERENCISTA_EXISTENTE → `coincidencia` con la persona para ofrecer asociarla (Criterio 3).
 * - 400 / 409 DATOS_PERSONA_DUPLICADOS → errores por campo.
 * - Lo demás → mensaje general.
 * @param {any} err
 * @returns {{ campos: Object, mensaje: string|null, codigo: string|undefined, status: number|undefined, coincidencia: Object|null }}
 */
export function interpretarErrorConferencista(err) {
  const { mensaje, status, codigo } = extraerError(err);
  const data = err?.response?.data;

  if (codigo === 'CONFERENCISTA_EXISTENTE' && data?.coincidencia) {
    return { campos: {}, mensaje, codigo, status, coincidencia: data.coincidencia };
  }
  const campos = normalizarErroresCampo(data?.erroresValidacion);
  if (Object.keys(campos).length > 0) {
    return { campos, mensaje: null, codigo, status, coincidencia: null };
  }
  return { campos: {}, mensaje, codigo, status, coincidencia: null };
}

/**
 * Texto del aviso de duplicado (Criterio 3).
 * @param {Object} c - CoincidenciaConferencistaResponse
 */
export function textoCoincidencia(c) {
  if (!c) return '';
  const por = { documento: 'ese número de documento', correo: 'ese correo', documento_y_correo: 'ese documento y correo' }[c.coincidePor]
    || 'esos datos';
  if (c.yaAsociadoAlEvento) {
    return `${c.nombreCompleto} ya está registrado con ${por} y ya es conferencista de este evento.`;
  }
  const previos = c.eventosPrevios > 0
    ? ` Ha participado en ${c.eventosPrevios} ${c.eventosPrevios === 1 ? 'evento' : 'eventos'}.`
    : '';
  return `${c.nombreCompleto} ya está registrado con ${por}.${previos} Puedes asociarlo a este evento sin volver a registrar sus datos.`;
}

/**
 * Nombres de los eventos publicados donde se ve la trayectoria (Criterio 4).
 * @param {Object} perfil - PerfilConferencistaResponse
 * @returns {string[]}
 */
export function eventosConVistaPublica(perfil) {
  return (perfil?.participaciones || []).filter((p) => p.visiblePublicamente).map((p) => p.eventoNombre);
}

/**
 * "2026-10-19T09:30:00" → "19 oct 2026".
 * @param {string|null|undefined} fechaHora
 */
export function fechaCorta(fechaHora) {
  return typeof fechaHora === 'string' ? fechaHora.slice(0, 10) : null;
}
