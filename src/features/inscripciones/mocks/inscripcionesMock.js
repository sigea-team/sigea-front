/**
 * @file inscripcionesMock.js
 * @description API simulada de inscripciones (HU-23) para Storybook. Reproduce las reglas del backend:
 * categoría obligatoria, sin duplicados, aforo de la sala, cruce de horario y liberación del cupo al cancelar.
 * @module features/inscripciones/mocks/inscripcionesMock
 */
import { hayTraslape, normalizarActividadInscribible } from '../inscripcionUtils';

export const EVENTO_INSCRIPCION_MOCK = {
  id: 3,
  nombre: 'Congreso Internacional de TIC 2026',
  estado: 'habilitado',
  fechaInicio: '2026-11-20',
  fechaFin: '2026-11-21',
};

export const ACTIVIDADES_INSCRIPCION_MOCK = [
  { id: 101, nombre: 'Conferencia inaugural: IA responsable', tipoActividadNombre: 'Conferencia', fecha: '2026-11-20', horaInicio: '08:00:00', horaFin: '10:00:00', salaId: 1, salaNombre: 'Auditorio Central', ponenteNombre: 'Dra. Laura Gómez', estado: 'programada', aforo: 200, inscritos: 120 },
  { id: 102, nombre: 'Taller de aprendizaje automático', tipoActividadNombre: 'Taller', fecha: '2026-11-20', horaInicio: '10:30:00', horaFin: '12:30:00', salaId: 2, salaNombre: 'Laboratorio 3', ponenteNombre: 'Ing. Carlos Ruiz', estado: 'programada', aforo: 25, inscritos: 25 },
  { id: 103, nombre: 'Panel: ciberseguridad en la universidad', tipoActividadNombre: 'Panel', fecha: '2026-11-20', horaInicio: '11:00:00', horaFin: '12:00:00', salaId: 3, salaNombre: 'Sala B', ponenteNombre: '', estado: 'programada', aforo: 60, inscritos: 48 },
  { id: 104, nombre: 'Ponencias: computación en la nube', tipoActividadNombre: 'Ponencia', fecha: '2026-11-21', horaInicio: '09:00:00', horaFin: '11:00:00', salaId: 3, salaNombre: 'Sala B', ponenteNombre: 'Varios autores', estado: 'programada', aforo: 60, inscritos: 10 },
  { id: 105, nombre: 'Taller de robótica educativa', tipoActividadNombre: 'Taller', fecha: '2026-11-21', horaInicio: '10:00:00', horaFin: '12:00:00', salaId: 2, salaNombre: 'Laboratorio 3', ponenteNombre: 'MSc. Ana Pérez', estado: 'programada', aforo: 25, inscritos: 24 },
];

const esperar = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const rechazo = (status, codigo, message) => {
  const err = new Error(message);
  err.response = { status, data: { status, codigo, message } };
  return err;
};

/**
 * @param {{ inscrito?: boolean, categoria?: string, actividadesInscritas?: number[],
 *   actividades?: Array<Object> }} [opciones]
 * @returns {import('../../../api/inscripcionService').inscripcionService}
 */
export function crearInscripcionApiMock({
  inscrito = false,
  categoria = 'estudiante',
  actividadesInscritas = [],
  actividades = ACTIVIDADES_INSCRIPCION_MOCK,
} = {}) {
  const catalogo = actividades.map((a) => ({ ...a }));
  let inscripcion = inscrito ? { inscripcionId: 1, categoria, fechaInscripcion: '2026-11-15T10:00:00' } : null;
  let mias = new Set(inscrito ? actividadesInscritas : []);

  const buscar = (id) => catalogo.find((a) => a.id === Number(id));
  const aRespuesta = (a) => ({
    actividadId: a.id,
    actividadNombre: a.nombre,
    fecha: a.fecha,
    horaInicio: a.horaInicio,
    horaFin: a.horaFin,
    salaNombre: a.salaNombre,
    fechaInscripcion: '2026-11-15T10:30:00',
  });
  const cupo = (a) => {
    const inscritos = a.inscritos + (mias.has(a.id) ? 1 : 0);
    return {
      actividadId: a.id,
      actividadNombre: a.nombre,
      aforoMaximo: a.aforo,
      inscritos,
      cuposDisponibles: Math.max(0, a.aforo - inscritos),
      cupoAgotado: inscritos >= a.aforo,
      estaInscrito: mias.has(a.id),
    };
  };

  const api = {
    async inscribirAEvento(eventoId, cat) {
      await esperar();
      if (inscripcion) throw rechazo(409, 'INSCRIPCION_DUPLICADA', 'El participante ya se encuentra inscrito previamente en el evento.');
      inscripcion = { inscripcionId: 1, categoria: cat, fechaInscripcion: new Date().toISOString() };
      return { ...inscripcion, eventoId };
    },
    async obtenerMiInscripcion() {
      await esperar();
      if (!inscripcion) return null;
      return { ...inscripcion, actividades: [...mias].map((id) => aRespuesta(buscar(id))) };
    },
    async cancelarMiInscripcion() {
      await esperar();
      inscripcion = null;
      mias = new Set();
    },
    async inscribirAActividad(eventoId, actividadId) {
      await esperar();
      const a = buscar(actividadId);
      if (!inscripcion) throw rechazo(409, 'OPERACION_NO_PERMITIDA', 'Debe estar inscrito al evento antes de poder inscribirse a sus actividades.');
      if (mias.has(a.id)) throw rechazo(409, 'INSCRIPCION_DUPLICADA', `Ya se encuentra inscrito en la actividad «${a.nombre}».`);
      if (cupo(a).cupoAgotado) throw rechazo(409, 'CUPO_AGOTADO', `La actividad «${a.nombre}» ha alcanzado su cupo máximo de ${a.aforo} participantes.`);
      const cruce = [...mias].map(buscar).find((o) => hayTraslape(o, a));
      if (cruce) throw rechazo(409, 'CONFLICTO_HORARIO_INSCRIPCION', `Conflicto de horario: ya se encuentra inscrito en «${cruce.nombre}».`);
      mias.add(a.id);
      return aRespuesta(a);
    },
    async cancelarInscripcionActividad(eventoId, actividadId) {
      await esperar();
      mias.delete(Number(actividadId));
    },
    async consultarCupo(eventoId, actividadId) {
      return cupo(buscar(actividadId));
    },
    async consultarCupos(eventoId, ids) {
      return Object.fromEntries(ids.map((id) => [id, cupo(buscar(id))]));
    },
    async listarMisActividades() {
      return [...mias].map((id) => aRespuesta(buscar(id)));
    },
    async listarActividadesInscribibles() {
      await esperar();
      return catalogo.map(normalizarActividadInscribible);
    },
  };
  return api;
}
