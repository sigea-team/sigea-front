/**
 * @file agendaMock.js
 * @description Datos y API simulada en memoria de la agenda de actividades (HU-21), solo para Storybook.
 * La aplicación trabaja siempre con el backend real.
 * @module features/agenda/mocks/agendaMock
 */
import { ordenarCronologicamente } from '../agendaUtils';

export const ACTIVIDADES_INICIALES_MOCK = [
  {
    id: 1,
    eventoId: 3,
    nombre: 'Conferencia Inaugural: Retos y Futuro de la Ingeniería de Software 2027',
    tipoActividadId: 1,
    tipoActividadNombre: 'Conferencia',
    lineaTematicaId: 11,
    lineaTematicaNombre: 'Ingeniería de software',
    fecha: '2026-10-21',
    horaInicio: '08:30',
    horaFin: '10:00',
    salaId: 1,
    salaNombre: 'Auditorio Mayor Eustorgio Gómez',
    ponenteId: 12,
    ponenteNombre: 'Dra. Ana María Pérez Gómez',
    modalidad: 'presencial',
    permiteSimultaneidad: false,
    descripcion: 'Apertura oficial del evento y visión prospectiva de la industria tecnológica.',
    asistentesEsperados: 200,
    estado: 'programada',
  },
  {
    id: 2,
    eventoId: 3,
    nombre: 'Taller Práctico A: Despliegue de Microservicios con Kubernetes y Cloud Run',
    tipoActividadId: 4,
    tipoActividadNombre: 'Taller',
    lineaTematicaId: 11,
    lineaTematicaNombre: 'Ingeniería de software',
    fecha: '2026-10-21',
    horaInicio: '10:30',
    horaFin: '12:30',
    salaId: 4,
    salaNombre: 'Laboratorio de Innovación 102',
    ponenteId: 12,
    ponenteNombre: 'Dra. Ana María Pérez Gómez',
    modalidad: 'presencial',
    permiteSimultaneidad: true, // Taller simultáneo con el Taller B
    descripcion: 'Sesión práctica guiada paso a paso para estudiantes e ingenieros.',
    asistentesEsperados: 30,
    estado: 'programada',
  },
  {
    id: 3,
    eventoId: 3,
    nombre: 'Taller Práctico B: Fundamentos de Ciberseguridad Ofensiva y Ethical Hacking',
    tipoActividadId: 4,
    tipoActividadNombre: 'Taller',
    lineaTematicaId: 13,
    lineaTematicaNombre: 'Redes y seguridad informática',
    fecha: '2026-10-21',
    horaInicio: '10:30',
    horaFin: '12:30',
    salaId: 3,
    salaNombre: 'Aula Magistral 204',
    ponenteId: 15,
    ponenteNombre: 'Carlos Andrés Rojas Duarte',
    modalidad: 'presencial',
    permiteSimultaneidad: true, // Taller simultáneo con el Taller A
    descripcion: 'Demostración en vivo de mitigación de vectores de ataque web comunes.',
    asistentesEsperados: 45,
    estado: 'programada',
  },
  {
    id: 4,
    eventoId: 3,
    nombre: 'Keynote Virtual: Calidad Continua y Automatización de Pruebas',
    tipoActividadId: 1,
    tipoActividadNombre: 'Conferencia',
    lineaTematicaId: 11,
    lineaTematicaNombre: 'Ingeniería de software',
    fecha: '2026-10-22',
    horaInicio: '09:00',
    horaFin: '11:00',
    salaId: 2,
    salaNombre: 'Sala Virtual Plenaria Zoom 1',
    ponenteId: 21,
    ponenteNombre: 'Dra. Lucía Fernández Ortiz',
    modalidad: 'virtual',
    permiteSimultaneidad: false,
    descripcion: 'Estrategias modernas de CI/CD aplicadas en organizaciones académicas.',
    asistentesEsperados: 350,
    estado: 'programada',
  },
  {
    id: 5,
    eventoId: 3,
    nombre: 'Panel de Expertos: Retos de la Inteligencia Artificial en la Educación',
    tipoActividadId: 2,
    tipoActividadNombre: 'Panel',
    lineaTematicaId: 12,
    lineaTematicaNombre: 'Inteligencia artificial y ciencia de datos',
    fecha: '2026-10-22',
    horaInicio: '14:30',
    horaFin: '16:30',
    salaId: 1,
    salaNombre: 'Auditorio Mayor Eustorgio Gómez',
    ponenteId: null,
    ponenteNombre: 'Varios panelistas invitados',
    modalidad: 'hibrida',
    permiteSimultaneidad: false,
    descripcion: 'Discusión abierta con participación de la audiencia presencial y remota.',
    asistentesEsperados: 180,
    estado: 'programada',
  },
];

/**
 * Crea una API simulada en memoria con la misma forma que `actividadService`, para Storybook.
 * @returns {Object}
 */
export function crearActividadesApiMock() {
  let actividades = structuredClone(ACTIVIDADES_INICIALES_MOCK);

  return {
    async listarActividades(eventoId, fecha = null) {
      const delEvento = actividades.filter(
        (a) => String(a.eventoId) === String(eventoId) && (!fecha || a.fecha === fecha)
      );
      return ordenarCronologicamente(delEvento);
    },
    async crearActividad(eventoId, datos) {
      const id = Math.max(0, ...actividades.map((a) => Number(a.id) || 0)) + 1;
      const nueva = { ...datos, id, eventoId: Number(eventoId), estado: 'programada' };
      actividades = [...actividades, nueva];
      return nueva;
    },
    async actualizarActividad(eventoId, actividadId, datos) {
      const actual = actividades.find((a) => String(a.id) === String(actividadId));
      const actualizada = { ...actual, ...datos, id: Number(actividadId), eventoId: Number(eventoId) };
      actividades = actividades.map((a) => (a === actual ? actualizada : a));
      return actualizada;
    },
    async eliminarActividad(eventoId, actividadId) {
      actividades = actividades.filter((a) => String(a.id) !== String(actividadId));
      return { ok: true };
    },
  };
}
