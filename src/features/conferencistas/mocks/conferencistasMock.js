/**
 * @file conferencistasMock.js
 * @description Datos y API simulada del módulo de conferencistas, solo para Storybook.
 * Imita las respuestas y reglas del backend de la HU-12 sin necesidad de servidor: lista de
 * registrados e invitaciones por correo (Criterio 3), años futuros (Criterio 2), estado del evento y
 * vista pública que lee la trayectoria vigente (Criterio 4).
 * @module features/conferencistas/mocks/conferencistasMock
 */

import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';
import { ESTADOS_ASOCIACION_MODIFICABLE, ESTADOS_EVENTO_PUBLICO } from '../conferencistaUtils';

/** Personas registradas en SIGEA (algunas sin trayectoria: son participantes, no conferencistas). */
export const PERSONAS_CONF_MOCK = [
  { id: 12, tipoDocumento: 'CC', numeroDocumento: '1090123456', nombres: 'Ana María', apellidos: 'Pérez Gómez', correo: 'ana.perez@unal.edu.co', telefono: '3001234567', tieneCuenta: false },
  { id: 15, tipoDocumento: 'CC', numeroDocumento: '88234567', nombres: 'Carlos Andrés', apellidos: 'Rojas Duarte', correo: 'carlos.rojas@uis.edu.co', telefono: null, tieneCuenta: false },
  { id: 21, tipoDocumento: 'CE', numeroDocumento: 'E4456789', nombres: 'Lucía', apellidos: 'Fernández Ortiz', correo: 'lfernandez@upm.es', telefono: '+34 600 123 456', tieneCuenta: false },
  { id: 27, tipoDocumento: 'CC', numeroDocumento: '60345678', nombres: 'Jorge Enrique', apellidos: 'Villamizar Ortega', correo: 'jorge.villamizar@ufps.edu.co', telefono: null, tieneCuenta: true },
];

/** Trayectorias (una por persona). Jorge (27) es participante: no tiene trayectoria. */
export const PERFILES_MOCK = [
  {
    personaId: 12,
    biografia:
      'Ingeniera de sistemas y doctora en Ingeniería. Lleva 15 años investigando arquitecturas de software para la educación y dirige el grupo de investigación en tecnologías educativas de la Universidad Nacional.',
    cargoActual: 'Profesora titular',
    institucion: 'Universidad Nacional de Colombia',
    enlacePerfil: 'https://orcid.org/0000-0002-1825-0097',
    estudios: [
      { id: 1, nivel: 'doctorado', titulo: 'Doctora en Ingeniería', institucion: 'Universidad Nacional de Colombia', anio: 2018 },
      { id: 2, nivel: 'maestria', titulo: 'Magíster en Ingeniería de Software', institucion: 'Universidad de los Andes', anio: 2012 },
    ],
    publicaciones: [
      { id: 1, tipo: 'articulo', titulo: 'Microservicios para plataformas académicas', medio: 'Revista Colombiana de Computación', anio: 2024, enlace: 'https://doi.org/10.29375/25392115.5056' },
      { id: 2, tipo: 'libro', titulo: 'Diseño de sistemas educativos escalables', medio: 'Editorial UN', anio: 2021, enlace: null },
    ],
    fechaRegistro: '2025-08-01T09:00:00',
    fechaActualizacion: '2026-09-15T10:30:00',
  },
  {
    personaId: 15,
    biografia: 'Investigador en ciberseguridad y redes. Coordina el laboratorio de seguridad informática de la UIS.',
    cargoActual: 'Coordinador de laboratorio',
    institucion: 'Universidad Industrial de Santander',
    enlacePerfil: null,
    estudios: [{ id: 3, nivel: 'maestria', titulo: 'Magíster en Telemática', institucion: 'UIS', anio: 2016 }],
    publicaciones: [],
    fechaRegistro: '2025-07-20T10:00:00',
    fechaActualizacion: '2025-07-20T10:00:00',
  },
  {
    personaId: 21,
    biografia: 'Catedrática de Ingeniería del Software en la Universidad Politécnica de Madrid. Especialista en calidad de software y métodos ágiles.',
    cargoActual: 'Catedrática',
    institucion: 'Universidad Politécnica de Madrid',
    enlacePerfil: 'https://scholar.google.com',
    estudios: [{ id: 4, nivel: 'doctorado', titulo: 'Doctora en Informática', institucion: 'UPM', anio: 2009 }],
    publicaciones: [{ id: 3, tipo: 'articulo', titulo: 'Agile quality at scale', medio: 'IEEE Software', anio: 2023, enlace: null }],
    fechaRegistro: '2026-08-10T15:00:00',
    fechaActualizacion: '2026-08-10T15:00:00',
  },
];

/** Asociaciones con los eventos de EVENTOS_MOCK (3 = habilitado, 2 = cerrado, 4 = en configuración). */
export const PARTICIPACIONES_MOCK = [
  { id: 1, eventoId: 3, personaId: 12, tipoParticipacion: 'conferencista', tema: 'Inteligencia artificial aplicada a la educación', fechaRegistro: '2026-08-20T09:00:00' },
  { id: 2, eventoId: 3, personaId: 21, tipoParticipacion: 'conferencista', tema: 'Calidad de software en equipos ágiles', fechaRegistro: '2026-08-21T11:00:00' },
  { id: 3, eventoId: 2, personaId: 12, tipoParticipacion: 'ponente', tema: 'Arquitecturas de microservicios', fechaRegistro: '2025-07-25T10:00:00' },
  { id: 4, eventoId: 2, personaId: 15, tipoParticipacion: 'conferencista', tema: 'Ciberseguridad en universidades', fechaRegistro: '2025-07-26T10:00:00' },
];

/** Invitaciones del evento 3: una vigente y una vencida. Tokens fijos para las stories. */
export const INVITACIONES_MOCK = [
  {
    id: 1,
    eventoId: 3,
    nombre: 'Diego Alejandro Torres Rincón',
    correo: 'diego.torres@softcucuta.co',
    token: 'token-vigente',
    estado: 'pendiente',
    fechaEnvio: '2026-10-18T09:00:00',
    fechaExpiracion: '2099-10-21T09:00:00',
  },
  {
    id: 2,
    eventoId: 3,
    nombre: 'María Fernanda Ruiz',
    correo: 'mfruiz@unipamplona.edu.co',
    token: 'token-vencido',
    estado: 'pendiente',
    fechaEnvio: '2026-10-01T10:00:00',
    fechaExpiracion: '2026-10-04T10:00:00',
  },
  {
    id: 3,
    eventoId: 3,
    nombre: 'Carlos Rojas',
    correo: 'carlos.rojas@uis.edu.co',
    token: 'token-usado',
    estado: 'completada',
    fechaEnvio: '2026-08-01T10:00:00',
    fechaExpiracion: '2026-08-04T10:00:00',
  },
];

/** Invitación vigente para un participante con cuenta pero sin trayectoria (precarga sus datos). */
export const INVITACION_PARTICIPANTE_MOCK = {
  id: 4,
  eventoId: 3,
  nombre: 'Jorge Villamizar',
  correo: 'jorge.villamizar@ufps.edu.co',
  token: 'token-participante',
  estado: 'pendiente',
  fechaEnvio: '2026-10-18T09:00:00',
  fechaExpiracion: '2099-10-21T09:00:00',
};

const esperar = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function errorApi(status, message, extra = {}) {
  const err = new Error(message);
  err.response = { status, data: { status, message, ...extra } };
  return err;
}

const nombreCompleto = (p) => `${p.nombres} ${p.apellidos}`.trim();
const copiar = (v) => JSON.parse(JSON.stringify(v));
/** Igual que DatosRegistradosResponse.enmascararCorreo del backend: «an•••@unal.edu.co». */
const enmascararCorreo = (correo) => {
  const limpio = String(correo ?? '').trim();
  const arroba = limpio.indexOf('@');
  if (arroba <= 0) return limpio || null;
  return limpio.slice(0, Math.min(2, arroba - 1)) + '•••' + limpio.slice(arroba);
};
/** Igual que DatosRegistradosResponse.enmascarar del backend: solo los 3 últimos caracteres visibles. */
const enmascarar = (valor) => {
  const limpio = String(valor ?? '').trim();
  if (!limpio) return null;
  if (limpio.length <= 3) return '•'.repeat(limpio.length);
  return '•'.repeat(Math.min(limpio.length - 3, 6)) + limpio.slice(-3);
};

/**
 * Crea una API simulada con estado en memoria y las mismas reglas del backend.
 * @param {Object} [opciones]
 * @param {Array<Object>} [opciones.eventos=EVENTOS_MOCK]
 * @param {Array<Object>} [opciones.personas=PERSONAS_CONF_MOCK]
 * @param {Array<Object>} [opciones.perfiles=PERFILES_MOCK]
 * @param {Array<Object>} [opciones.participaciones=PARTICIPACIONES_MOCK]
 * @param {Array<Object>} [opciones.invitaciones=INVITACIONES_MOCK]
 * @param {string} [opciones.correoSesion='ana.perez@unal.edu.co'] - Usuario de la sesión para «Mi perfil de conferencista».
 */
export function crearConferencistasApiMock({
  eventos = EVENTOS_MOCK,
  personas = PERSONAS_CONF_MOCK,
  perfiles = PERFILES_MOCK,
  participaciones = PARTICIPACIONES_MOCK,
  invitaciones = [...INVITACIONES_MOCK, INVITACION_PARTICIPANTE_MOCK],
  correoSesion = 'ana.perez@unal.edu.co',
} = {}) {
  const db = {
    personas: copiar(personas),
    perfiles: copiar(perfiles),
    participaciones: copiar(participaciones),
    invitaciones: copiar(invitaciones),
  };
  let sigInvitacion = Math.max(0, ...db.invitaciones.map((i) => i.id)) + 1;
  let sigPersona = Math.max(0, ...db.personas.map((p) => p.id)) + 1;
  let sigParticipacion = Math.max(0, ...db.participaciones.map((p) => p.id)) + 1;
  let sigItem = 100;

  const buscarEvento = (id) =>
    eventos.find((e) => e.id === Number(id)) || { id: Number(id), nombre: `Evento ${id}`, estado: 'en_configuracion' };
  const perfilDe = (personaId) => db.perfiles.find((p) => p.personaId === personaId) || null;
  const personaDe = (id) => db.personas.find((p) => p.id === Number(id));

  const validarModificable = (evento) => {
    if (!ESTADOS_ASOCIACION_MODIFICABLE.includes(evento.estado)) {
      throw errorApi(409, `Los conferencistas del evento '${evento.nombre}' ya no se pueden asociar ni retirar (estado actual: ${evento.estado}).`, {
        codigo: 'OPERACION_NO_PERMITIDA',
      });
    }
  };

  const validarAnios = (t) => {
    const anio = new Date().getFullYear();
    const errores = {};
    (t?.estudios || []).forEach((e, i) => {
      if (e.anio && e.anio > anio) errores[`trayectoria.estudios[${i}].anio`] = `El año del estudio no puede ser posterior a ${anio}`;
    });
    (t?.publicaciones || []).forEach((p, i) => {
      if (p.anio && p.anio > anio) errores[`trayectoria.publicaciones[${i}].anio`] = `El año de la publicación no puede ser posterior a ${anio}`;
    });
    if (Object.keys(errores).length) {
      throw errorApi(400, 'Los datos enviados no cumplen con los requisitos o políticas exigidas.', {
        codigo: 'VALIDACION_FALLIDA',
        erroresValidacion: errores,
      });
    }
  };

  const aplicarTrayectoria = (personaId, t) => {
    const ahora = new Date().toISOString().slice(0, 19);
    const nuevo = {
      personaId,
      biografia: t.biografia,
      cargoActual: t.cargoActual,
      institucion: t.institucion,
      enlacePerfil: t.enlacePerfil,
      estudios: (t.estudios || []).map((e) => ({ ...e, id: sigItem++ })),
      publicaciones: (t.publicaciones || []).map((p) => ({ ...p, id: sigItem++ })),
      fechaActualizacion: ahora,
    };
    const existente = perfilDe(personaId);
    if (existente) Object.assign(existente, nuevo);
    else db.perfiles.push({ ...nuevo, fechaRegistro: ahora });
  };

  const coincidencia = (numeroDocumento, correo, eventoId) => {
    const porDoc = numeroDocumento ? db.personas.find((p) => p.numeroDocumento === numeroDocumento) : null;
    const porCorreo = correo ? db.personas.find((p) => p.correo.toLowerCase() === correo.toLowerCase()) : null;
    const persona = porDoc || porCorreo;
    if (!persona) return null;
    let coincidePor = porDoc ? 'documento' : 'correo';
    if (porDoc && porCorreo && porDoc.id === porCorreo.id) coincidePor = 'documento_y_correo';
    return {
      personaId: persona.id,
      nombreCompleto: nombreCompleto(persona),
      tipoDocumento: persona.tipoDocumento,
      numeroDocumento: persona.numeroDocumento,
      correo: persona.correo,
      coincidePor,
      tienePerfil: Boolean(perfilDe(persona.id)),
      yaAsociadoAlEvento: eventoId ? db.participaciones.some((p) => p.eventoId === Number(eventoId) && p.personaId === persona.id) : null,
      eventosPrevios: db.participaciones.filter((p) => p.personaId === persona.id).length,
    };
  };

  const filaEvento = (part) => {
    const persona = personaDe(part.personaId);
    const perfil = perfilDe(part.personaId);
    return {
      participacionId: part.id,
      eventoId: part.eventoId,
      personaId: persona.id,
      nombreCompleto: nombreCompleto(persona),
      tipoDocumento: persona.tipoDocumento,
      numeroDocumento: persona.numeroDocumento,
      correo: persona.correo,
      telefono: persona.telefono,
      tipoParticipacion: part.tipoParticipacion,
      tema: part.tema,
      fechaRegistro: part.fechaRegistro,
      tienePerfil: Boolean(perfil),
      cargoActual: perfil?.cargoActual ?? null,
      institucion: perfil?.institucion ?? null,
      fechaActualizacionTrayectoria: perfil?.fechaActualizacion ?? null,
    };
  };

  const perfilCompleto = (persona) => {
    const perfil = perfilDe(persona.id);
    return {
      personaId: persona.id,
      tipoDocumento: persona.tipoDocumento,
      numeroDocumento: persona.numeroDocumento,
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      nombreCompleto: nombreCompleto(persona),
      correo: persona.correo,
      telefono: persona.telefono,
      tieneCuentaUsuario: Boolean(persona.tieneCuenta),
      trayectoria: perfil ? copiar(perfil) : null,
      participaciones: db.participaciones
        .filter((p) => p.personaId === persona.id)
        .map((p) => {
          const ev = buscarEvento(p.eventoId);
          return {
            participacionId: p.id,
            eventoId: ev.id,
            eventoNombre: ev.nombre,
            semestre: ev.semestre,
            fechaInicio: ev.fechaInicio,
            fechaFin: ev.fechaFin,
            estadoEvento: ev.estado,
            tipoParticipacion: p.tipoParticipacion,
            tema: p.tema,
            visiblePublicamente: ESTADOS_EVENTO_PUBLICO.includes(ev.estado),
          };
        })
        .sort((a, b) => String(b.fechaInicio).localeCompare(String(a.fechaInicio))),
    };
  };

  const VIGENCIA_MS = 72 * 3600 * 1000;
  const aIso = (fecha) => new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
  const renovar = (inv) => {
    const ahora = new Date();
    inv.token = `token-${inv.id}-${ahora.getTime()}`;
    inv.fechaEnvio = aIso(ahora);
    inv.fechaExpiracion = aIso(new Date(ahora.getTime() + VIGENCIA_MS));
  };
  const respuestaInvitacion = (inv) => ({
    id: inv.id,
    eventoId: inv.eventoId,
    nombre: inv.nombre,
    correo: inv.correo,
    estado: new Date(inv.fechaExpiracion) > new Date() ? 'pendiente' : 'vencida',
    fechaEnvio: inv.fechaEnvio,
    fechaExpiracion: inv.fechaExpiracion,
    enlace: `${typeof window !== 'undefined' ? window.location.origin : ''}/#/conferencista/invitacion?token=${inv.token}`,
  });
  const invitacionUtilizable = (token) => {
    const inv = db.invitaciones.find((i) => i.token === token);
    if (!inv) throw errorApi(404, 'El enlace de invitación no es válido.', { codigo: 'RECURSO_NO_ENCONTRADO' });
    if (inv.estado === 'completada') throw errorApi(410, 'Esta invitación ya fue utilizada.', { codigo: 'INVITACION_COMPLETADA' });
    if (inv.estado === 'cancelada') throw errorApi(410, 'El organizador canceló esta invitación.', { codigo: 'INVITACION_CANCELADA' });
    if (new Date(inv.fechaExpiracion) <= new Date()) throw errorApi(410, 'Este enlace venció.', { codigo: 'INVITACION_VENCIDA' });
    if (!ESTADOS_ASOCIACION_MODIFICABLE.includes(buscarEvento(inv.eventoId).estado)) {
      throw errorApi(410, 'El evento ya no recibe conferencistas.', { codigo: 'INVITACION_EVENTO_CERRADO' });
    }
    return inv;
  };

  const api = {
    async listarConferencistas(eventoId) {
      await esperar();
      return db.participaciones.filter((p) => p.eventoId === Number(eventoId)).map(filaEvento);
    },

    async buscarConferencista({ numeroDocumento, correo, eventoId }) {
      await esperar(150);
      return coincidencia(numeroDocumento, correo, eventoId);
    },

    async listarRegistrados(busqueda, eventoId) {
      await esperar(200);
      const texto = (busqueda || '').trim().toLowerCase();
      return db.personas
        .filter((p) => perfilDe(p.id))
        .filter((p) => !texto || [nombreCompleto(p), p.numeroDocumento, p.correo].some((v) => v.toLowerCase().includes(texto)))
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)))
        .map((p) => {
          const perfil = perfilDe(p.id);
          const suyas = db.participaciones.filter((x) => x.personaId === p.id);
          return {
            personaId: p.id,
            nombreCompleto: nombreCompleto(p),
            tipoDocumento: p.tipoDocumento,
            numeroDocumento: p.numeroDocumento,
            correo: p.correo,
            cargoActual: perfil.cargoActual ?? null,
            institucion: perfil.institucion ?? null,
            eventosPrevios: suyas.length,
            yaAsociadoAlEvento: eventoId ? suyas.some((x) => x.eventoId === Number(eventoId)) : null,
            fechaActualizacion: perfil.fechaActualizacion,
          };
        });
    },

    async listarInvitaciones(eventoId) {
      await esperar(200);
      return db.invitaciones
        .filter((i) => i.eventoId === Number(eventoId) && i.estado === 'pendiente')
        .sort((a, b) => String(b.fechaEnvio).localeCompare(String(a.fechaEnvio)))
        .map(respuestaInvitacion);
    },

    async invitarConferencista(eventoId, { nombre, correo }) {
      await esperar();
      const evento = buscarEvento(eventoId);
      validarModificable(evento);
      const c = coincidencia(null, correo, eventoId);
      if (c?.yaAsociadoAlEvento) {
        throw errorApi(409, `${c.nombreCompleto} ya es conferencista del evento '${evento.nombre}'.`, { codigo: 'CONFERENCISTA_YA_ASOCIADO' });
      }
      if (c?.tienePerfil) {
        throw errorApi(409, `${c.nombreCompleto} ya está registrado con ese correo. Puede asociarlo directamente a este evento sin volver a registrar sus datos.`, {
          codigo: 'CONFERENCISTA_EXISTENTE',
          coincidencia: c,
        });
      }
      const ahora = new Date();
      let inv = db.invitaciones.find((i) => i.eventoId === Number(eventoId) && i.estado === 'pendiente' && i.correo.toLowerCase() === correo.toLowerCase());
      if (inv && new Date(inv.fechaExpiracion) > ahora) {
        throw errorApi(409, `Ya se envió una invitación a ${correo} que sigue vigente. Puedes reenviarla desde la lista de invitaciones pendientes.`, {
          codigo: 'INVITACION_PENDIENTE',
        });
      }
      if (!inv) {
        inv = { id: sigInvitacion++, eventoId: Number(eventoId), correo, estado: 'pendiente' };
        db.invitaciones.push(inv);
      }
      inv.nombre = nombre;
      renovar(inv);
      return respuestaInvitacion(inv);
    },

    async reenviarInvitacion(eventoId, invitacionId) {
      await esperar();
      const inv = db.invitaciones.find((i) => i.id === Number(invitacionId) && i.estado === 'pendiente');
      if (!inv) throw errorApi(409, 'La invitación ya no está pendiente.', { codigo: 'OPERACION_NO_PERMITIDA' });
      validarModificable(buscarEvento(eventoId));
      renovar(inv);
      return respuestaInvitacion(inv);
    },

    async cancelarInvitacion(eventoId, invitacionId) {
      await esperar();
      const inv = db.invitaciones.find((i) => i.id === Number(invitacionId) && i.estado === 'pendiente');
      if (!inv) throw errorApi(409, 'La invitación ya no está pendiente.', { codigo: 'OPERACION_NO_PERMITIDA' });
      inv.estado = 'cancelada';
    },

    async consultarInvitacion(token) {
      await esperar();
      const inv = invitacionUtilizable(token);
      const evento = buscarEvento(inv.eventoId);
      const persona = db.personas.find((p) => p.correo.toLowerCase() === inv.correo.toLowerCase());
      return {
        eventoId: evento.id,
        eventoNombre: evento.nombre,
        semestre: evento.semestre,
        fechaInicio: evento.fechaInicio,
        fechaFin: evento.fechaFin,
        nombre: inv.nombre,
        // Como el backend: el enlace no exige sesión, así que el correo va enmascarado.
        correo: enmascararCorreo(inv.correo),
        requiereContrasena: !persona?.tieneCuenta,
        fechaExpiracion: inv.fechaExpiracion,
        datosRegistrados: persona
          ? {
              tipoDocumento: persona.tipoDocumento,
              documentoEnmascarado: enmascarar(persona.numeroDocumento),
              nombres: persona.nombres,
              apellidos: persona.apellidos,
              telefonoEnmascarado: enmascarar(persona.telefono),
              trayectoria: perfilDe(persona.id) ? copiar(perfilDe(persona.id)) : null,
            }
          : null,
      };
    },

    async completarInvitacion(token, datos) {
      await esperar();
      const inv = invitacionUtilizable(token);
      const evento = buscarEvento(inv.eventoId);
      validarAnios(datos.trayectoria);
      let persona = db.personas.find((p) => p.correo.toLowerCase() === inv.correo.toLowerCase());
      // Como el backend: sin cuenta, la contraseña es obligatoria y se crea la cuenta al completar.
      const cuentaCreada = !persona?.tieneCuenta;
      if (cuentaCreada && !datos.contrasena) {
        throw errorApi(400, 'Crea una contraseña para tu cuenta en SIGEA.', {
          codigo: 'VALIDACION_FALLIDA',
          erroresValidacion: { contrasena: 'Crea una contraseña para ingresar a SIGEA con el perfil «Conferencista».' },
        });
      }
      // Como el backend: documento y teléfono vacíos conservan los ya registrados.
      const numeroDocumento = datos.numeroDocumento || persona?.numeroDocumento || null;
      const telefono = datos.telefono || persona?.telefono || null;
      if (!numeroDocumento) {
        throw errorApi(400, 'El número de documento es obligatorio', {
          codigo: 'VALIDACION_FALLIDA',
          erroresValidacion: { numeroDocumento: 'El número de documento es obligatorio' },
        });
      }
      const otra = db.personas.find((p) => p.numeroDocumento === numeroDocumento && p.id !== persona?.id);
      if (otra) {
        throw errorApi(409, 'Este número de documento ya está registrado en SIGEA con otro correo. Comunícate con el organizador del evento para que te vincule.', {
          codigo: 'DATOS_PERSONA_DUPLICADOS',
          erroresValidacion: { numeroDocumento: 'Este número de documento ya está registrado en SIGEA con otro correo.' },
        });
      }
      if (!persona) {
        persona = { id: sigPersona++, correo: inv.correo, tieneCuenta: false };
        db.personas.push(persona);
      }
      Object.assign(persona, {
        tipoDocumento: datos.tipoDocumento,
        numeroDocumento,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        telefono,
      });
      aplicarTrayectoria(persona.id, datos.trayectoria);
      if (!db.participaciones.some((p) => p.eventoId === evento.id && p.personaId === persona.id)) {
        db.participaciones.push({
          id: sigParticipacion++,
          eventoId: evento.id,
          personaId: persona.id,
          tipoParticipacion: 'conferencista',
          tema: datos.tema,
          fechaRegistro: new Date().toISOString().slice(0, 19),
        });
      }
      if (cuentaCreada) persona.tieneCuenta = true;
      inv.estado = 'completada';
      return {
        eventoId: evento.id,
        eventoNombre: evento.nombre,
        nombreCompleto: nombreCompleto(persona),
        vistaPublicaDisponible: ESTADOS_EVENTO_PUBLICO.includes(evento.estado),
        cuentaCreada,
      };
    },

    async asociarConferencista(eventoId, datos) {
      await esperar();
      const evento = buscarEvento(eventoId);
      validarModificable(evento);
      const persona = personaDe(datos.personaId);
      if (!persona) throw errorApi(404, `No se encontró la persona con ID: ${datos.personaId}`);
      if (db.participaciones.some((p) => p.eventoId === Number(eventoId) && p.personaId === persona.id)) {
        throw errorApi(409, `${nombreCompleto(persona)} ya es conferencista del evento '${evento.nombre}'.`, {
          codigo: 'CONFERENCISTA_YA_ASOCIADO',
        });
      }
      if (!perfilDe(persona.id) && !datos.trayectoria) {
        throw errorApi(400, `${nombreCompleto(persona)} todavía no tiene trayectoria registrada.`, {
          codigo: 'VALIDACION_FALLIDA',
          erroresValidacion: { biografia: 'La biografía del conferencista es obligatoria' },
        });
      }
      if (datos.trayectoria) {
        validarAnios(datos.trayectoria);
        aplicarTrayectoria(persona.id, datos.trayectoria);
      }
      const part = {
        id: sigParticipacion++,
        eventoId: Number(eventoId),
        personaId: persona.id,
        tipoParticipacion: datos.tipoParticipacion,
        tema: datos.tema,
        fechaRegistro: new Date().toISOString().slice(0, 19),
      };
      db.participaciones.push(part);
      return filaEvento(part);
    },

    async retirarConferencista(eventoId, participacionId) {
      await esperar();
      validarModificable(buscarEvento(eventoId));
      db.participaciones = db.participaciones.filter((p) => p.id !== Number(participacionId));
    },

    async obtenerPerfilConferencista(personaId) {
      await esperar();
      const persona = personaDe(personaId);
      if (!persona) throw errorApi(404, `No se encontró la persona con ID: ${personaId}`);
      return perfilCompleto(persona);
    },

    async actualizarConferencista(personaId, datos) {
      await esperar();
      const persona = personaDe(personaId);
      if (!persona) throw errorApi(404, `No se encontró la persona con ID: ${personaId}`);
      const otraDoc = db.personas.find((p) => p.id !== persona.id && p.numeroDocumento === datos.numeroDocumento);
      if (otraDoc) {
        throw errorApi(409, `El documento ${datos.numeroDocumento} ya pertenece a otra persona registrada (${nombreCompleto(otraDoc)}).`, {
          codigo: 'DATOS_PERSONA_DUPLICADOS',
          erroresValidacion: { numeroDocumento: `El documento ya pertenece a ${nombreCompleto(otraDoc)}.` },
        });
      }
      if (persona.tieneCuenta && datos.correo.toLowerCase() !== persona.correo.toLowerCase()) {
        throw errorApi(400, 'El correo es su usuario de inicio de sesión.', {
          codigo: 'VALIDACION_FALLIDA',
          erroresValidacion: { correo: 'Este correo está vinculado a una cuenta de usuario y no se puede cambiar aquí' },
        });
      }
      validarAnios(datos.trayectoria);
      Object.assign(persona, {
        tipoDocumento: datos.tipoDocumento,
        numeroDocumento: datos.numeroDocumento,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        correo: datos.correo,
        telefono: datos.telefono,
      });
      aplicarTrayectoria(persona.id, datos.trayectoria);
      return perfilCompleto(persona);
    },

    async listarConferencistasPublicos(eventoId) {
      await esperar();
      const evento = buscarEvento(eventoId);
      if (!ESTADOS_EVENTO_PUBLICO.includes(evento.estado)) {
        throw errorApi(404, `No se encontró un evento publicado con ID: ${eventoId}`, { codigo: 'RECURSO_NO_ENCONTRADO' });
      }
      return {
        eventoId: evento.id,
        eventoNombre: evento.nombre,
        semestre: evento.semestre,
        fechaInicio: evento.fechaInicio,
        fechaFin: evento.fechaFin,
        conferencistas: db.participaciones
          .filter((p) => p.eventoId === evento.id)
          .map((p) => {
            const persona = personaDe(p.personaId);
            const perfil = perfilDe(p.personaId) || {};
            return {
              personaId: persona.id,
              nombreCompleto: nombreCompleto(persona),
              tipoParticipacion: p.tipoParticipacion,
              tema: p.tema,
              cargoActual: perfil.cargoActual ?? null,
              institucion: perfil.institucion ?? null,
              biografia: perfil.biografia ?? null,
              enlacePerfil: perfil.enlacePerfil ?? null,
              estudios: perfil.estudios || [],
              publicaciones: perfil.publicaciones || [],
              fechaActualizacion: perfil.fechaActualizacion ?? null,
            };
          }),
      };
    },
  };

  /** Perfil de ingreso «Conferencista»: la persona de la sesión (debe tener trayectoria). */
  const personaSesion = () => {
    const persona = db.personas.find((p) => p.correo.toLowerCase() === correoSesion.toLowerCase());
    if (!persona || !perfilDe(persona.id)) {
      throw errorApi(404, `Aún no estás registrado como conferencista. El organizador del evento debe registrarte con tu correo ${correoSesion} para que puedas ver y actualizar tu trayectoria.`, {
        codigo: 'RECURSO_NO_ENCONTRADO',
      });
    }
    return persona;
  };

  api.obtenerMiPerfilConferencista = async () => {
    await esperar();
    return { ...perfilCompleto(personaSesion()), tieneCuentaUsuario: true };
  };

  api.actualizarMiPerfilConferencista = async (datos) => {
    const persona = personaSesion();
    if (datos.correo.toLowerCase() !== persona.correo.toLowerCase()) {
      await esperar();
      throw errorApi(400, 'El correo es tu usuario de inicio de sesión.', {
        codigo: 'VALIDACION_FALLIDA',
        erroresValidacion: { correo: 'Este correo está vinculado a una cuenta de usuario y no se puede cambiar aquí' },
      });
    }
    const actualizado = await api.actualizarConferencista(persona.id, datos);
    return { ...actualizado, tieneCuentaUsuario: true };
  };

  return api;
}

/** API que siempre falla al cargar (estado de error con reintento). */
export const conferencistasApiMockConError = {
  ...crearConferencistasApiMock(),
  async listarConferencistas() {
    await esperar();
    throw new Error('Network Error');
  },
  async listarConferencistasPublicos() {
    await esperar();
    const err = new Error('Network Error');
    err.request = {};
    throw err;
  },
};
