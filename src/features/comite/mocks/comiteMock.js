/**
 * @file comiteMock.js
 * @description Datos y API simulada del comité organizador, solo para Storybook.
 * Imita las respuestas y reglas del backend de la HU-06 sin necesidad de servidor.
 * @module features/comite/mocks/comiteMock
 */

import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';
import { ESTADOS_COMITE_MODIFICABLE } from '../comiteUtils';

/** Personas registradas en el sistema (se buscan por número de documento). */
export const PERSONAS_MOCK = [
  { id: 12, numeroDocumento: '1090123456', nombres: 'Ana María', apellidos: 'Pérez Gómez', correo: 'ana.perez@ufps.edu.co' },
  { id: 15, numeroDocumento: '88234567', nombres: 'Carlos Andrés', apellidos: 'Rojas Duarte', correo: 'carlos.rojas@ufps.edu.co' },
  { id: 21, numeroDocumento: '1094456789', nombres: 'Laura Sofía', apellidos: 'Mendoza Ríos', correo: 'laura.mendoza@ufps.edu.co' },
  { id: 27, numeroDocumento: '60345678', nombres: 'Jorge Enrique', apellidos: 'Villamizar Ortega', correo: 'jorge.villamizar@ufps.edu.co' },
];

/** Participaciones iniciales. El evento 3 incluye un miembro retirado (historial). */
export const COMITE_MOCK = [
  { id: 1, eventoId: 3, personaId: 12, rolComite: 'Coordinadora general', fechaAsignacion: '2026-08-04T09:00:00', fechaRetiro: null, activo: true },
  { id: 2, eventoId: 3, personaId: 15, rolComite: 'Logística', fechaAsignacion: '2026-08-04T09:10:00', fechaRetiro: '2026-09-01T16:30:00', activo: false },
  { id: 3, eventoId: 3, personaId: 21, rolComite: 'Comité académico', fechaAsignacion: '2026-08-05T11:00:00', fechaRetiro: null, activo: true },
  { id: 4, eventoId: 3, personaId: 27, rolComite: 'Logística', fechaAsignacion: '2026-09-01T16:45:00', fechaRetiro: null, activo: true },
  { id: 5, eventoId: 2, personaId: 12, rolComite: 'Coordinadora general', fechaAsignacion: '2025-07-20T10:00:00', fechaRetiro: null, activo: true },
  { id: 6, eventoId: 2, personaId: 15, rolComite: 'Logística', fechaAsignacion: '2025-07-20T10:05:00', fechaRetiro: null, activo: true },
];

const esperar = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

function errorApi(status, message, extra = {}) {
  const err = new Error(message);
  err.response = { status, data: { status, message, ...extra } };
  return err;
}

const nombreCompleto = (p) => `${p.nombres} ${p.apellidos}`.trim();

/**
 * Crea una API simulada con estado en memoria y las mismas reglas del backend.
 * @param {Object} [opciones]
 * @param {Array<Object>} [opciones.comite=COMITE_MOCK] - Participaciones iniciales.
 * @param {Array<Object>} [opciones.eventos=EVENTOS_MOCK] - Eventos (se usa su estado para el Criterio 4).
 * @param {Array<Object>} [opciones.personas=PERSONAS_MOCK]
 */
export function crearComiteApiMock({ comite = COMITE_MOCK, eventos = EVENTOS_MOCK, personas = PERSONAS_MOCK } = {}) {
  let participaciones = comite.map((c) => ({ ...c }));
  let siguienteId = Math.max(0, ...participaciones.map((c) => c.id)) + 1;

  // Los eventos creados en vivo en la story de EventosPage no están en la lista: se tratan como
  // eventos nuevos, que siempre nacen en configuración.
  const buscarEvento = (id) =>
    eventos.find((e) => e.id === Number(id)) || { id: Number(id), nombre: `Evento ${id}`, estado: 'en_configuracion' };

  const validarModificable = (evento) => {
    if (!ESTADOS_COMITE_MODIFICABLE.includes(evento.estado)) {
      throw errorApi(
        409,
        `El comité organizador del evento '${evento.nombre}' ya no puede modificarse (estado actual: ${evento.estado}). ` +
          'Solo se permiten cambios mientras el evento está en en_configuracion o habilitado.',
        { codigo: 'OPERACION_NO_PERMITIDA' }
      );
    }
  };

  const aRespuesta = (c) => {
    const persona = personas.find((p) => p.id === c.personaId);
    return {
      ...c,
      nombreCompleto: persona ? nombreCompleto(persona) : '',
      numeroDocumento: persona?.numeroDocumento ?? '',
      correo: persona?.correo ?? '',
    };
  };

  return {
    async listarComite(eventoId, incluirHistorial = false) {
      await esperar();
      buscarEvento(eventoId);
      return participaciones
        .filter((c) => c.eventoId === Number(eventoId) && (incluirHistorial || c.activo))
        .sort((a, b) => Number(b.activo) - Number(a.activo) || a.fechaAsignacion.localeCompare(b.fechaAsignacion))
        .map(aRespuesta);
    },

    async agregarMiembro(eventoId, { numeroDocumento, rolComite }) {
      await esperar();
      const evento = buscarEvento(eventoId);
      validarModificable(evento);
      const documento = (numeroDocumento || '').trim();
      const persona = personas.find((p) => p.numeroDocumento === documento);
      if (!persona) {
        throw errorApi(404, `No se encontró una persona registrada con el documento: ${documento}`, {
          codigo: 'RECURSO_NO_ENCONTRADO',
        });
      }
      if (participaciones.some((c) => c.eventoId === evento.id && c.personaId === persona.id && c.activo)) {
        throw errorApi(409, `${nombreCompleto(persona)} ya es miembro vigente del comité organizador del evento '${evento.nombre}'.`, {
          codigo: 'MIEMBRO_COMITE_DUPLICADO',
        });
      }
      const nueva = {
        id: siguienteId++,
        eventoId: evento.id,
        personaId: persona.id,
        rolComite: rolComite.trim(),
        fechaAsignacion: new Date().toISOString().slice(0, 19),
        fechaRetiro: null,
        activo: true,
      };
      participaciones.push(nueva);
      return aRespuesta(nueva);
    },

    async retirarMiembro(eventoId, miembroId) {
      await esperar();
      const evento = buscarEvento(eventoId);
      validarModificable(evento);
      const miembro = participaciones.find((c) => c.id === Number(miembroId) && c.eventoId === evento.id);
      if (!miembro) {
        throw errorApi(404, `No se encontró el miembro con ID ${miembroId} en el comité del evento ${eventoId}.`);
      }
      if (!miembro.activo) {
        throw errorApi(409, 'Este miembro ya fue retirado del comité organizador.', { codigo: 'OPERACION_NO_PERMITIDA' });
      }
      miembro.activo = false;
      miembro.fechaRetiro = new Date().toISOString().slice(0, 19);
      return aRespuesta(miembro);
    },
  };
}

/** API simulada que siempre falla al cargar, para mostrar el estado de error en Storybook. */
export const comiteApiMockConError = {
  async listarComite() {
    await esperar(200);
    const err = new Error('Network Error');
    err.request = {};
    throw err;
  },
  async agregarMiembro() {
    throw new Error('No disponible');
  },
  async retirarMiembro() {
    throw new Error('No disponible');
  },
};
