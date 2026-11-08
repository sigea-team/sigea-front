/**
 * @file salasMock.js
 * @description Datos y API simulada para el módulo de salas, espacios y ponentes (HU-20).
 * Soporta creación y gestión de salas independientes de eventos (catálogo institucional),
 * así como asignación a eventos, disponibilidad horaria y verificación de conflictos.
 * @module features/salas/mocks/salasMock
 */

import {
  validarSala,
  verificarConflictoProgramacionActividad,
} from '../salaUtils';

export const SALAS_INICIALES_MOCK = [
  {
    id: 1,
    eventoId: null, // Independiente, disponible en el catálogo
    nombre: 'Auditorio Mayor Eustorgio Gómez',
    ubicacion: 'Edificio Cread, 1er piso',
    tipo: 'fisica',
    aforoMaximo: 250,
    disponibilidad: [
      { id: 101, fecha: '2026-10-21', horaInicio: '08:00', horaFin: '13:00' },
      { id: 102, fecha: '2026-10-21', horaInicio: '14:00', horaFin: '18:00' },
      { id: 103, fecha: '2026-10-22', horaInicio: '08:00', horaFin: '17:00' },
    ],
  },
  {
    id: 2,
    eventoId: null, // Independiente, disponible en el catálogo
    nombre: 'Sala Virtual Plenaria Zoom 1',
    ubicacion: 'https://renata.zoom.us/j/sigea-sala-1',
    tipo: 'virtual',
    aforoMaximo: 500,
    disponibilidad: [
      { id: 104, fecha: '2026-10-21', horaInicio: '08:00', horaFin: '20:00' },
      { id: 105, fecha: '2026-10-22', horaInicio: '08:00', horaFin: '20:00' },
    ],
  },
  {
    id: 3,
    eventoId: null, // Independiente, disponible en el catálogo
    nombre: 'Aula Magistral 204',
    ubicacion: 'Edificio de Aulas, Torre B',
    tipo: 'fisica',
    aforoMaximo: 60,
    disponibilidad: [
      { id: 106, fecha: '2026-10-21', horaInicio: '09:00', horaFin: '12:00' },
      { id: 107, fecha: '2026-10-22', horaInicio: '14:00', horaFin: '18:00' },
    ],
  },
  {
    id: 4,
    eventoId: null,
    nombre: 'Laboratorio de Innovación 102',
    ubicacion: 'Edificio de Laboratorios, 1er piso',
    tipo: 'fisica',
    aforoMaximo: 35,
    disponibilidad: [
      { id: 108, fecha: '2026-10-21', horaInicio: '08:00', horaFin: '18:00' },
    ],
  },
];

export const PONENTES_EVENTO_MOCK = [
  {
    personaId: 12,
    nombres: 'Dra. Ana María',
    apellidos: 'Pérez Gómez',
    correo: 'ana.perez@unal.edu.co',
    institucion: 'Universidad Nacional de Colombia',
    especialidad: 'Arquitecturas de Software y Cloud',
    disponibilidad: [
      { id: 201, fecha: '2026-10-21', horaInicio: '08:00', horaFin: '12:00' },
      { id: 202, fecha: '2026-10-22', horaInicio: '14:00', horaFin: '18:00' },
    ],
  },
  {
    personaId: 15,
    nombres: 'Carlos Andrés',
    apellidos: 'Rojas Duarte',
    correo: 'carlos.rojas@uis.edu.co',
    institucion: 'Universidad Industrial de Santander',
    especialidad: 'Ciberseguridad y Redes',
    disponibilidad: [
      { id: 203, fecha: '2026-10-21', horaInicio: '14:00', horaFin: '18:00' },
    ],
  },
  {
    personaId: 21,
    nombres: 'Dra. Lucía',
    apellidos: 'Fernández Ortiz',
    correo: 'lfernandez@upm.es',
    institucion: 'Universidad Politécnica de Madrid',
    especialidad: 'Calidad de Software y Métodos Ágiles',
    disponibilidad: [
      { id: 204, fecha: '2026-10-22', horaInicio: '09:00', horaFin: '13:00' },
    ],
  },
];

export const ACTIVIDADES_MOCK = [
  {
    id: 1,
    eventoId: 3,
    salaId: 1,
    ponenteId: 12,
    nombre: 'Conferencia Inaugural: Retos del Software en 2027',
    fecha: '2026-10-21',
    horaInicio: '09:00',
    horaFin: '11:00',
    modalidad: 'presencial',
    inscripcionesActivas: 180,
  },
  {
    id: 2,
    eventoId: 3,
    salaId: 3,
    ponenteId: 15,
    nombre: 'Taller Práctico de Ciberdefensa',
    fecha: '2026-10-21',
    horaInicio: '15:00',
    horaFin: '17:00',
    modalidad: 'presencial',
    inscripcionesActivas: 55,
  },
  {
    id: 3,
    eventoId: 3,
    salaId: 2,
    ponenteId: 21,
    nombre: 'Keynote Virtual: Calidad Continua en Entornos Académicos',
    fecha: '2026-10-22',
    horaInicio: '10:00',
    horaFin: '12:00',
    modalidad: 'virtual',
    inscripcionesActivas: 320,
  },
];

/**
 * Crea una instancia de API simulada en memoria para salas, ponentes y actividades.
 */
export function crearSalasApiMock({
  salasIniciales = SALAS_INICIALES_MOCK,
  ponentesIniciales = PONENTES_EVENTO_MOCK,
  actividadesIniciales = ACTIVIDADES_MOCK,
} = {}) {
  let salas = structuredClone(salasIniciales);
  let ponentes = structuredClone(ponentesIniciales);
  let actividades = structuredClone(actividadesIniciales);

  return {
    /** El mock sí simula la programación de actividades (el backend real todavía no la tiene). */
    soportaActividades: true,

    /** Consulta todas las salas del catálogo institucional. */
    async listarSalasGlobales() {
      return salas.map((s) => ({
        ...structuredClone(s),
        ocupaciones: actividades
          .filter((a) => Number(a.salaId) === Number(s.id))
          .map((a) => ({
            actividadId: a.id,
            actividadNombre: a.nombre,
            eventoId: a.eventoId,
            eventoNombre: `Evento ${a.eventoId}`,
            fecha: a.fecha,
            horaInicio: a.horaInicio,
            horaFin: a.horaFin,
          })),
        eventosVinculados: s.eventosVinculados || [],
      }));
    },

    async crearSalaGlobal(datos) {
      return this.crearSala(null, datos);
    },

    async actualizarSalaGlobal(salaId, datos) {
      return this.actualizarSala(null, salaId, datos);
    },

    async eliminarSalaGlobal(salaId) {
      return this.eliminarSala(null, salaId);
    },

    async guardarDisponibilidadSalaGlobal(salaId, franjas) {
      return this.guardarDisponibilidadSala(null, salaId, franjas);
    },

    async obtenerOcupacionesSala(salaId) {
      return actividades
        .filter((a) => Number(a.salaId) === Number(salaId))
        .map((a) => ({
          actividadId: a.id,
          actividadNombre: a.nombre,
          eventoId: a.eventoId,
          eventoNombre: `Evento ${a.eventoId}`,
          fecha: a.fecha,
          horaInicio: a.horaInicio,
          horaFin: a.horaFin,
        }));
    },

    async vincularSalaEvento(eventoId, salaId) {
      const sala = salas.find((s) => Number(s.id) === Number(salaId));
      if (!sala) throw new Error('Sala no encontrada');
      if (!sala.eventosVinculados) sala.eventosVinculados = [];
      const evIdNum = Number(eventoId);
      if (!sala.eventosVinculados.some((e) => Number(e.id) === evIdNum)) {
        sala.eventosVinculados.push({ id: evIdNum, nombre: `Evento ${evIdNum}` });
      }
      return structuredClone(sala);
    },

    async desvincularSalaEvento(eventoId, salaId) {
      const sala = salas.find((s) => Number(s.id) === Number(salaId));
      if (!sala) throw new Error('Sala no encontrada');
      if (sala.eventosVinculados) {
        sala.eventosVinculados = sala.eventosVinculados.filter((e) => Number(e.id) !== Number(eventoId));
      }
    },

    /** Lista las salas de un evento (sin evento no hay salas, como en el backend). */
    async listarSalas(eventoId = null) {
      if (!eventoId) {
        return [];
      }
      return salas.filter((s) => s.eventoId === null || Number(s.eventoId) === Number(eventoId));
    },

    async obtenerSala(eventoId, salaId) {
      const encontrada = salas.find((s) => Number(s.id) === Number(salaId));
      if (!encontrada) throw new Error('Sala no encontrada');
      return structuredClone(encontrada);
    },

    /**
     * Registra una sala. eventoId puede ser null para crear salas institucionales independientes.
     */
    async crearSala(eventoId, datos) {
      const salasComparar = eventoId
        ? salas.filter((s) => s.eventoId === null || Number(s.eventoId) === Number(eventoId))
        : salas;

      const errores = validarSala(datos, salasComparar);
      if (Object.keys(errores).length > 0) {
        const error = new Error(Object.values(errores)[0]);
        error.errores = errores;
        throw error;
      }

      const nuevoId = salas.length > 0 ? Math.max(...salas.map((s) => s.id)) + 1 : 1;
      const nuevaSala = {
        id: nuevoId,
        eventoId: eventoId ? Number(eventoId) : null,
        nombre: datos.nombre.trim(),
        ubicacion: (datos.ubicacion || '').trim(),
        tipo: datos.tipo,
        aforoMaximo: Number(datos.aforoMaximo),
        disponibilidad: Array.isArray(datos.disponibilidad) ? structuredClone(datos.disponibilidad) : [],
      };

      salas.push(nuevaSala);
      return structuredClone(nuevaSala);
    },

    async actualizarSala(eventoId, salaId, datos) {
      const index = salas.findIndex((s) => Number(s.id) === Number(salaId));
      if (index === -1) throw new Error('Sala no encontrada');

      const salaActual = salas[index];
      const salasComparar = salaActual.eventoId
        ? salas.filter((s) => s.eventoId === null || Number(s.eventoId) === Number(salaActual.eventoId))
        : salas;

      const errores = validarSala(datos, salasComparar, salaId);
      if (Object.keys(errores).length > 0) {
        const error = new Error(Object.values(errores)[0]);
        error.errores = errores;
        throw error;
      }

      const salaActualizada = {
        ...salaActual,
        nombre: datos.nombre.trim(),
        ubicacion: (datos.ubicacion || '').trim(),
        tipo: datos.tipo,
        aforoMaximo: Number(datos.aforoMaximo),
      };

      if (datos.disponibilidad !== undefined) {
        salaActualizada.disponibilidad = structuredClone(datos.disponibilidad);
      }

      salas[index] = salaActualizada;
      return structuredClone(salaActualizada);
    },

    async eliminarSala(eventoId, salaId) {
      const idNum = Number(salaId);
      const vinculada = actividades.some((a) => Number(a.salaId) === idNum);
      if (vinculada) {
        throw new Error('No se puede eliminar la sala porque tiene actividades programadas.');
      }
      salas = salas.filter((s) => Number(s.id) !== idNum);
    },

    async guardarDisponibilidadSala(eventoId, salaId, franjas) {
      const sala = salas.find((s) => Number(s.id) === Number(salaId));
      if (!sala) throw new Error('Sala no encontrada');

      sala.disponibilidad = structuredClone(franjas);
      return { disponibilidad: structuredClone(sala.disponibilidad), conflictos: [], tieneConflictos: false };
    },

    async listarPonentesEvento() {
      return structuredClone(ponentes);
    },

    async guardarDisponibilidadPonente(eventoId, personaId, franjas) {
      const ponente = ponentes.find((p) => Number(p.personaId) === Number(personaId));
      if (!ponente) throw new Error('Ponente no encontrado');

      ponente.disponibilidad = structuredClone(franjas);
      return { disponibilidad: structuredClone(ponente.disponibilidad), conflictos: [], tieneConflictos: false };
    },

    async listarActividades(eventoId = null) {
      if (!eventoId) return structuredClone(actividades);
      return actividades.filter((a) => Number(a.eventoId) === Number(eventoId));
    },

    async programarActividad(eventoId, datos) {
      const sala = salas.find((s) => Number(s.id) === Number(datos.salaId));
      if (!sala) throw new Error('Sala no encontrada');

      const ponente = datos.ponenteId ? ponentes.find((p) => Number(p.personaId) === Number(datos.ponenteId)) : null;

      const conflicto = verificarConflictoProgramacionActividad(
        datos,
        sala.disponibilidad,
        ponente?.disponibilidad
      );

      const nuevoId = actividades.length > 0 ? Math.max(...actividades.map((a) => a.id)) + 1 : 1;
      const nuevaActividad = {
        id: nuevoId,
        eventoId: Number(eventoId),
        salaId: Number(datos.salaId),
        ponenteId: datos.ponenteId ? Number(datos.ponenteId) : null,
        nombre: datos.nombre,
        fecha: datos.fecha,
        horaInicio: datos.horaInicio,
        horaFin: datos.horaFin,
        modalidad: datos.modalidad || (sala.tipo === 'virtual' ? 'virtual' : 'presencial'),
        inscripcionesActivas: Number(datos.inscripcionesActivas || 0),
        tieneAdvertencia: conflicto.hayConflicto,
        motivoAdvertencia: conflicto.motivos.join(' '),
      };

      actividades.push(nuevaActividad);
      return structuredClone(nuevaActividad);
    },

    async eliminarActividad(actividadId) {
      actividades = actividades.filter((a) => Number(a.id) !== Number(actividadId));
    },
  };
}
