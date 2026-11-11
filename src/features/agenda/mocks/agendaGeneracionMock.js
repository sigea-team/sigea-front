import { ESTADO_POR_PROGRAMAR, sumarMinutos } from '../agendaPublicacionUtils';
import { horaAMinutos } from '../agendaUtils';

/**
 * @file agendaGeneracionMock.js
 * @description API simulada de HU-22 para Storybook y pruebas: guarda el estado en memoria y responde con los mismos
 * formatos del backend. La generación es una versión simple (ubica en orden, cada sala de 08:00 a 12:00 cada día);
 * el algoritmo real está en el backend (`GeneradorAgenda`).
 * @module features/agenda/mocks/agendaGeneracionMock
 */

export const EVENTO_AGENDA_MOCK = {
  id: 1,
  nombre: 'Semana de Ingeniería de Sistemas 2027',
  fechaInicio: '2027-03-10',
  fechaFin: '2027-03-11',
  estado: 'habilitado',
};

export const SALAS_AGENDA_MOCK = [
  { id: 10, nombre: 'Auditorio Eduardo Cote', tipo: 'fisica', aforoMaximo: 200, ubicacion: 'Edificio Fundadores' },
  { id: 11, nombre: 'Sala SA-401', tipo: 'fisica', aforoMaximo: 40, ubicacion: 'Edificio SA' },
  { id: 12, nombre: 'Sala virtual', tipo: 'virtual', aforoMaximo: 300, ubicacion: 'https://meet.example/sigea' },
];

export const PONENTES_AGENDA_MOCK = [
  { personaId: 20, nombres: 'Ana', apellidos: 'Pérez', institucion: 'UFPS' },
  { personaId: 21, nombres: 'Luis', apellidos: 'Gómez', institucion: 'UIS' },
];

export const TIPOS_ACTIVIDAD_MOCK = [
  { id: 1, nombre: 'Conferencia' },
  { id: 2, nombre: 'Taller' },
  { id: 3, nombre: 'Ponencia' },
];

const nombrePonente = (id) => {
  const p = PONENTES_AGENDA_MOCK.find((x) => x.personaId === Number(id));
  return p ? `${p.nombres} ${p.apellidos}` : null;
};

/** Actividades iniciales: dos programadas a mano y cuatro por programar (una no cabe en ninguna franja). */
export function actividadesAgendaMock() {
  return [
    {
      id: 1, eventoId: 1, nombre: 'Inauguración', tipoActividadId: 1, tipoActividadNombre: 'Conferencia',
      fecha: '2027-03-10', horaInicio: '08:00', horaFin: '09:00', salaId: 10, salaNombre: 'Auditorio Eduardo Cote',
      ponenteId: null, ponenteNombre: '', modalidad: 'presencial', estado: 'programada', duracionMinutos: 60,
      asignacionAutomatica: false, permiteSimultaneidad: false, simultanea: false, advertencias: [],
    },
    {
      id: 2, eventoId: 1, nombre: 'Conferencia central: IA en la universidad', tipoActividadId: 1,
      tipoActividadNombre: 'Conferencia', fecha: '2027-03-10', horaInicio: '09:00', horaFin: '10:00', salaId: 10,
      salaNombre: 'Auditorio Eduardo Cote', ponenteId: 21, ponenteNombre: 'Luis Gómez', modalidad: 'presencial',
      estado: 'programada', duracionMinutos: 60, asignacionAutomatica: true, permiteSimultaneidad: false,
      simultanea: false, advertencias: [],
    },
    porProgramar(3, 'Taller de microservicios', 2, 120, 20, 'presencial'),
    porProgramar(4, 'Ponencia: visión por computador', 3, 45, 21, 'presencial'),
    porProgramar(5, 'Webinar egresados', 1, 60, null, 'virtual'),
    porProgramar(6, 'Hackatón (jornada completa)', 2, 600, null, 'presencial'),
  ];
}

function porProgramar(id, nombre, tipoActividadId, duracionMinutos, ponenteId, modalidad) {
  return {
    id, eventoId: 1, nombre, tipoActividadId,
    tipoActividadNombre: TIPOS_ACTIVIDAD_MOCK.find((t) => t.id === tipoActividadId)?.nombre || '',
    fecha: null, horaInicio: null, horaFin: null, salaId: null, salaNombre: '',
    ponenteId, ponenteNombre: nombrePonente(ponenteId) || '', modalidad, estado: ESTADO_POR_PROGRAMAR,
    duracionMinutos, asignacionAutomatica: false, permiteSimultaneidad: false, simultanea: false, advertencias: [],
  };
}

const errorHttp = (status, data) => {
  const e = new Error(data?.message || `HTTP ${status}`);
  e.response = { status, data: { status, ...data } };
  return e;
};

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Crea una API simulada de HU-22 (y de las actividades de HU-21 que usa la pantalla).
 * @param {{ actividades?: Array<Object>, publicada?: boolean, evento?: Object, demora?: number,
 *   fallarValidacion?: boolean }} [opciones]
 * @returns {Object} Mismas funciones que `agendaService` más `listarActividades`, `eliminarActividad`,
 *   `actualizarActividad`, `crearActividad` y `_estado()` para inspeccionar.
 */
export function crearAgendaApiMock({
  actividades = actividadesAgendaMock(),
  publicada = false,
  evento = EVENTO_AGENDA_MOCK,
  demora = 150,
  fallarValidacion = false,
} = {}) {
  let lista = actividades.map((a) => ({ ...a }));
  let siguiente = Math.max(0, ...lista.map((a) => a.id)) + 1;
  let diasPublicados = publicada
    ? Array.from(new Set(lista.filter((a) => a.fecha).map((a) => a.fecha)))
    : [];
  let fechaPublicacion = publicada ? '2027-03-01T10:00:00' : null;

  const visibles = () => lista.filter((a) => a.estado !== 'cancelada');
  const sala = (id) => SALAS_AGENDA_MOCK.find((s) => s.id === Number(id));
  const dias = () => {
    const out = [];
    for (let d = new Date(`${evento.fechaInicio}T00:00:00`); d <= new Date(`${evento.fechaFin}T00:00:00`); d.setDate(d.getDate() + 1)) {
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  };

  function calcular(reubicar) {
    const fijas = visibles().filter((a) => a.estado !== ESTADO_POR_PROGRAMAR && !(reubicar && a.asignacionAutomatica));
    const porUbicar = visibles().filter((a) => a.estado === ESTADO_POR_PROGRAMAR || (reubicar && a.asignacionAutomatica));
    const ocupadas = fijas.map((a) => ({ ...a }));
    const asignadas = [];
    const pendientes = [];
    for (const a of porUbicar) {
      const virtual = a.modalidad === 'virtual';
      const candidatas = SALAS_AGENDA_MOCK.filter((s) => (a.modalidad ? (s.tipo === 'virtual') === virtual : true));
      let ubicada = null;
      for (const fecha of dias()) {
        for (const s of candidatas) {
          for (let ini = 8 * 60; ini + a.duracionMinutos <= 12 * 60 && !ubicada; ini += 15) {
            const fin = ini + a.duracionMinutos;
            const choca = ocupadas.some(
              (o) =>
                o.fecha === fecha &&
                ini < horaAMinutos(o.horaFin) &&
                horaAMinutos(o.horaInicio) < fin &&
                (o.salaId === s.id || !(o.permiteSimultaneidad && a.permiteSimultaneidad) ||
                  (a.ponenteId && o.ponenteId === a.ponenteId))
            );
            if (!choca) {
              const hi = sumarMinutos('00:00', ini);
              ubicada = { fecha, horaInicio: hi, horaFin: sumarMinutos(hi, a.duracionMinutos), salaId: s.id };
            }
          }
          if (ubicada) break;
        }
        if (ubicada) break;
      }
      if (ubicada) {
        ocupadas.push({ ...a, ...ubicada });
        asignadas.push({
          actividadId: a.id, nombre: a.nombre, ...ubicada, salaNombre: sala(ubicada.salaId).nombre,
          ponenteId: a.ponenteId, ponenteNombre: a.ponenteNombre || null,
        });
      } else {
        const motivo = a.duracionMinutos > 240 ? 'SIN_FRANJA_COMUN' : 'SIN_ESPACIO_LIBRE';
        pendientes.push({
          actividadId: a.id, nombre: a.nombre, duracionMinutos: a.duracionMinutos, ponenteId: a.ponenteId,
          ponenteNombre: a.ponenteNombre || null, motivo,
          mensaje: motivo === 'SIN_FRANJA_COMUN'
            ? `Ninguna franja disponible de sala alcanza los ${a.duracionMinutos} minutos que dura la actividad.`
            : 'Todos los horarios posibles chocan con otras actividades (horario, sala o ponente). Asígnala manualmente o márcala como simultánea si es paralela.',
        });
      }
    }
    return { eventoId: evento.id, totalPorUbicar: porUbicar.length, asignadas, pendientes };
  }

  function revision() {
    const programadas = visibles().filter((a) => a.estado !== ESTADO_POR_PROGRAMAR && a.fecha);
    const incompletas = visibles()
      .filter((a) => a.estado === ESTADO_POR_PROGRAMAR || !a.fecha)
      .map((a) => ({ actividadId: a.id, nombre: a.nombre, faltantes: ['fecha', 'horario', 'sala'] }));
    const conflictos = [];
    programadas.forEach((a, i) =>
      programadas.slice(i + 1).forEach((b) => {
        if (a.fecha !== b.fecha || !(horaAMinutos(a.horaInicio) < horaAMinutos(b.horaFin) && horaAMinutos(b.horaInicio) < horaAMinutos(a.horaFin))) return;
        if (a.salaId === b.salaId) {
          conflictos.push({
            actividadId: a.id, actividadNombre: a.nombre,
            conflicto: { tipo: 'SALA', actividadId: b.id, actividadNombre: b.nombre, fecha: b.fecha,
              horaInicio: b.horaInicio, horaFin: b.horaFin, salaNombre: b.salaNombre,
              mensaje: `La sala «${b.salaNombre}» ya está ocupada por «${b.nombre}» (${b.horaInicio}–${b.horaFin}).` },
          });
        }
      })
    );
    return { programadas, incompletas, conflictos };
  }

  return {
    async listarActividades() {
      await esperar(demora);
      return lista.map((a) => ({ ...a }));
    },
    async registrarPorProgramar(eventoId, datos) {
      await esperar(demora);
      const nueva = porProgramar(siguiente++, datos.nombre.trim(), Number(datos.tipoActividadId),
        Number(datos.duracionMinutos), datos.ponenteId ? Number(datos.ponenteId) : null, datos.modalidad || null);
      nueva.permiteSimultaneidad = Boolean(datos.simultanea);
      nueva.simultanea = Boolean(datos.simultanea);
      lista.push(nueva);
      return { ...nueva };
    },
    async actualizarPorProgramar(eventoId, actividadId, datos) {
      await esperar(demora);
      const i = lista.findIndex((a) => a.id === Number(actividadId));
      if (lista[i].estado !== ESTADO_POR_PROGRAMAR) {
        throw errorHttp(409, { codigo: 'OPERACION_NO_PERMITIDA', message: 'La actividad ya tiene horario y sala.' });
      }
      lista[i] = {
        ...lista[i], nombre: datos.nombre.trim(), tipoActividadId: Number(datos.tipoActividadId),
        duracionMinutos: Number(datos.duracionMinutos), ponenteId: datos.ponenteId ? Number(datos.ponenteId) : null,
        ponenteNombre: nombrePonente(datos.ponenteId) || '', modalidad: datos.modalidad || null,
        permiteSimultaneidad: Boolean(datos.simultanea), simultanea: Boolean(datos.simultanea),
      };
      return { ...lista[i] };
    },
    async desprogramar(eventoId, actividadId) {
      await esperar(demora);
      const i = lista.findIndex((a) => a.id === Number(actividadId));
      lista[i] = { ...lista[i], fecha: null, horaInicio: null, horaFin: null, salaId: null, salaNombre: '',
        estado: ESTADO_POR_PROGRAMAR, asignacionAutomatica: false };
      return { ...lista[i] };
    },
    async eliminarActividad(eventoId, actividadId) {
      await esperar(demora);
      lista = lista.filter((a) => a.id !== Number(actividadId));
      return { ok: true };
    },
    async actualizarActividad(eventoId, actividadId, datos) {
      await esperar(demora);
      const i = lista.findIndex((a) => a.id === Number(actividadId));
      const s = sala(datos.salaId);
      lista[i] = { ...lista[i], ...datos, id: Number(actividadId), salaId: Number(datos.salaId),
        salaNombre: s?.nombre || '', estado: 'programada', asignacionAutomatica: false,
        duracionMinutos: horaAMinutos(datos.horaFin) - horaAMinutos(datos.horaInicio) };
      return { ...lista[i] };
    },
    async crearActividad(eventoId, datos) {
      await esperar(demora);
      const s = sala(datos.salaId);
      const nueva = { ...datos, id: siguiente++, eventoId: Number(eventoId), salaId: Number(datos.salaId),
        salaNombre: s?.nombre || '', estado: 'programada', asignacionAutomatica: false };
      lista.push(nueva);
      return { ...nueva };
    },
    async proponer(eventoId, { reubicarAutomaticas = false } = {}) {
      await esperar(demora);
      return { ...calcular(reubicarAutomaticas), aplicada: false };
    },
    async aplicar(eventoId, { reubicarAutomaticas = false } = {}) {
      await esperar(demora);
      const r = calcular(reubicarAutomaticas);
      for (const x of r.asignadas) {
        const i = lista.findIndex((a) => a.id === x.actividadId);
        lista[i] = { ...lista[i], fecha: x.fecha, horaInicio: x.horaInicio, horaFin: x.horaFin, salaId: x.salaId,
          salaNombre: x.salaNombre, estado: 'programada', asignacionAutomatica: true };
      }
      return { ...r, aplicada: true };
    },
    async validar() {
      await esperar(demora);
      if (fallarValidacion) throw errorHttp(500, { message: 'Error interno del servidor.' });
      const { programadas, incompletas, conflictos } = revision();
      const conteo = {};
      programadas.forEach((a) => { conteo[a.fecha] = (conteo[a.fecha] || 0) + 1; });
      const todos = Array.from(new Set([...Object.keys(conteo), ...diasPublicados])).sort();
      let motivo = null;
      if (evento.estado === 'en_configuracion') motivo = 'El evento todavía no está publicado; publícalo antes de publicar su agenda.';
      else if (programadas.length === 0 && incompletas.length === 0) motivo = 'La agenda no tiene actividades programadas.';
      else if (incompletas.length) motivo = `Hay ${incompletas.length} actividad(es) sin sala u horario asignado.`;
      else if (conflictos.length) motivo = `La agenda tiene ${conflictos.length} cruce(s) entre actividades.`;
      return {
        eventoId: evento.id, puedePublicar: motivo === null, motivoNoPublicable: motivo,
        publicada: diasPublicados.length > 0, fechaPublicacion, totalActividades: programadas.length,
        dias: todos.map((f) => ({ fecha: f, actividades: conteo[f] || 0,
          estado: diasPublicados.includes(f) ? 'publicada' : 'no_publicada',
          fechaPublicacion: diasPublicados.includes(f) ? fechaPublicacion : null })),
        incompletas, conflictos,
      };
    },
    async publicar() {
      await esperar(demora);
      const { programadas, incompletas, conflictos } = revision();
      if (incompletas.length) {
        throw errorHttp(409, { codigo: 'AGENDA_INCOMPLETA', incompletas, conflictos,
          message: `Hay ${incompletas.length} actividad(es) sin sala u horario asignado. Asígnalos o elimina esas actividades antes de publicar la agenda.` });
      }
      if (conflictos.length) {
        throw errorHttp(409, { codigo: 'AGENDA_CON_CONFLICTOS', incompletas: [], conflictos,
          message: `La agenda tiene ${conflictos.length} cruce(s) entre actividades. Corrígelos antes de publicarla.` });
      }
      if (programadas.length === 0) {
        throw errorHttp(409, { codigo: 'AGENDA_VACIA', incompletas: [], conflictos: [],
          message: 'La agenda no tiene actividades programadas para publicar.' });
      }
      diasPublicados = Array.from(new Set(programadas.map((a) => a.fecha))).sort();
      fechaPublicacion = '2027-03-01T10:00:00';
      return { eventoId: evento.id, fechaPublicacion, diasPublicados, totalActividades: programadas.length };
    },
    async obtenerAgendaPublica() {
      await esperar(demora);
      if (diasPublicados.length === 0) {
        throw errorHttp(404, { message: `La agenda del evento «${evento.nombre}» todavía no está publicada.` });
      }
      const porDia = diasPublicados.map((fecha) => ({
        fecha,
        actividades: visibles()
          .filter((a) => a.fecha === fecha && a.estado !== ESTADO_POR_PROGRAMAR)
          .sort((a, b) => horaAMinutos(a.horaInicio) - horaAMinutos(b.horaInicio))
          .map((a) => {
            const s = sala(a.salaId);
            return { id: a.id, nombre: a.nombre, tipoActividad: a.tipoActividadNombre, horaInicio: a.horaInicio,
              horaFin: a.horaFin, sala: s?.nombre, ubicacion: s?.tipo === 'fisica' ? s.ubicacion : null,
              ponente: a.ponenteNombre || null, modalidad: a.modalidad, lineaTematica: null,
              simultanea: Boolean(a.permiteSimultaneidad) };
          }),
      })).filter((d) => d.actividades.length > 0);
      return { eventoId: evento.id, eventoNombre: evento.nombre, fechaPublicacion, dias: porDia };
    },
    // HU-19, Criterio 3: propuestas con versión definitiva disponibles para vincular a una actividad.
    async listarPropuestasProgramables() {
      await esperar(demora);
      return propuestasProgramablesMock();
    },
    _estado: () => ({ actividades: lista.map((a) => ({ ...a })), diasPublicados: [...diasPublicados] }),
  };
}

/** HU-19: propuestas aprobadas en versión definitiva del evento de ejemplo. */
export function propuestasProgramablesMock() {
  return [
    {
      propuestaId: 40,
      titulo: 'Analítica de aprendizaje en cursos de programación',
      convocatoriaId: 10,
      convocatoriaTitulo: 'Convocatoria de Ponencias 2026',
      lineaTematicaId: null,
      lineaTematicaNombre: null,
      numeroVersion: 2,
      fechaDefinitiva: '2026-11-08T09:00:00',
      autores: ['Ana Pérez'],
      ponenteSugeridoId: 20,
      programada: false,
      actividadIds: [],
    },
    {
      propuestaId: 41,
      titulo: 'Gamificación en la enseñanza de bases de datos',
      convocatoriaId: 10,
      convocatoriaTitulo: 'Convocatoria de Ponencias 2026',
      lineaTematicaId: null,
      lineaTematicaNombre: null,
      numeroVersion: 1,
      fechaDefinitiva: '2026-11-07T15:30:00',
      autores: ['Carlos Gómez'],
      ponenteSugeridoId: null,
      programada: true,
      actividadIds: [3],
    },
  ];
}

/** API simulada que no tiene la agenda publicada (la página pública responde 404). */
export const agendaPublicaApiSinPublicar = () => crearAgendaApiMock({ demora: 100 });

/** API simulada con la agenda ya publicada y todas las actividades programadas. */
export const agendaPublicaApiPublicada = () =>
  crearAgendaApiMock({
    publicada: true,
    demora: 100,
    actividades: actividadesAgendaMock()
      .filter((a) => a.estado !== ESTADO_POR_PROGRAMAR)
      .concat([
        {
          ...actividadesAgendaMock()[0], id: 30, nombre: 'Webinar egresados', fecha: '2027-03-10',
          horaInicio: '10:00', horaFin: '11:00', salaId: 12, salaNombre: 'Sala virtual', modalidad: 'virtual',
          ponenteId: 20, ponenteNombre: 'Ana Pérez',
        },
        {
          ...actividadesAgendaMock()[0], id: 31, nombre: 'Clausura', fecha: '2027-03-11',
          horaInicio: '16:00', horaFin: '17:00', tipoActividadNombre: 'Conferencia',
        },
      ]),
  });
