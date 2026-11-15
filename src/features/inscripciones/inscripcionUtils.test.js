import { describe, expect, it } from 'vitest';
import {
  agruparPorDia,
  aplanarAgendaPublica,
  buscarConflicto,
  completarSimultaneidad,
  estadoActividad,
  etiquetaCategoria,
  hayTraslape,
  inscripcionesAbiertas,
  mensajeErrorInscripcion,
  normalizarActividadInscribible,
  porcentajeOcupacion,
} from './inscripcionUtils';

const taller = normalizarActividadInscribible({
  id: 1, nombre: 'Taller IA', fecha: '2026-11-20', horaInicio: '14:00:00', horaFin: '16:00:00', salaId: 3, salaNombre: 'Aula 1', estado: 'programada',
});
const charla = normalizarActividadInscribible({
  id: 2, nombre: 'Charla', fecha: '2026-11-20', horaInicio: '15:00:00', horaFin: '17:00:00', salaId: 4, salaNombre: 'Aula 2', estado: 'programada',
});
const siguiente = normalizarActividadInscribible({
  id: 3, nombre: 'Panel', fecha: '2026-11-20', horaInicio: '16:00:00', horaFin: '17:00:00', salaId: 4, salaNombre: 'Aula 2', estado: 'programada',
});

describe('HU-23 - inscripciones abiertas (Criterio 1)', () => {
  it('solo con el evento habilitado o en ejecución y sin vencer', () => {
    expect(inscripcionesAbiertas({ estado: 'habilitado', fechaFin: '2026-12-01' }, '2026-11-15')).toBe(true);
    expect(inscripcionesAbiertas({ estado: 'en_ejecucion', fechaFin: '2026-11-15' }, '2026-11-15')).toBe(true);
    expect(inscripcionesAbiertas({ estado: 'en_configuracion', fechaFin: '2026-12-01' }, '2026-11-15')).toBe(false);
    expect(inscripcionesAbiertas({ estado: 'cerrado' }, '2026-11-15')).toBe(false);
    expect(inscripcionesAbiertas({ estado: 'habilitado', fechaFin: '2026-11-14' }, '2026-11-15')).toBe(false);
  });

  it('muestra la etiqueta de la categoría', () => {
    expect(etiquetaCategoria('docente')).toBe('Docente');
    expect(etiquetaCategoria('otro')).toBe('—');
  });
});

describe('HU-23 - actividades inscribibles', () => {
  it('normaliza horas y marca como no inscribibles las actividades sin horario o sala', () => {
    expect(taller).toMatchObject({ horaInicio: '14:00', horaFin: '16:00', sala: 'Aula 1', inscribible: true });
    expect(normalizarActividadInscribible({ id: 9, estado: 'por_programar', duracionMinutos: 60 }).inscribible).toBe(false);
    expect(normalizarActividadInscribible({ ...taller, estado: 'cancelada', salaId: 3 }).inscribible).toBe(false);
  });

  it('aplana la agenda publicada tomando la fecha del día', () => {
    const lista = aplanarAgendaPublica({
      dias: [{ fecha: '2026-11-21', actividades: [{ id: 7, nombre: 'X', horaInicio: '08:00:00', horaFin: '09:00:00', sala: 'Auditorio' }] }],
    });
    expect(lista).toEqual([expect.objectContaining({ id: 7, fecha: '2026-11-21', sala: 'Auditorio', inscribible: true })]);
    expect(aplanarAgendaPublica(null)).toEqual([]);
  });

  it('agrupa por día en orden cronológico', () => {
    const otroDia = { ...taller, id: 5, fecha: '2026-11-19' };
    const grupos = agruparPorDia([charla, taller, otroDia]);
    expect(grupos.map((g) => g.fecha)).toEqual(['2026-11-19', '2026-11-20']);
    expect(grupos[1].actividades.map((a) => a.id)).toEqual([1, 2]);
  });
});

describe('HU-23 - cruces de horario (Criterio 3)', () => {
  it('detecta el traslape en el mismo día, pero no si solo se tocan los extremos', () => {
    expect(hayTraslape(taller, charla)).toBe(true);
    expect(hayTraslape(taller, siguiente)).toBe(false);
    expect(hayTraslape(taller, { ...charla, fecha: '2026-11-21' })).toBe(false);
  });

  it('no hay conflicto si alguna de las dos permite simultaneidad', () => {
    const simultanea = normalizarActividadInscribible({ ...charla, salaId: 4, simultanea: true });
    expect(simultanea.simultanea).toBe(true);
    expect(hayTraslape(taller, simultanea)).toBe(false);
    expect(hayTraslape({ ...taller, simultanea: true }, charla)).toBe(false);
  });

  it('completa la simultaneidad de las inscritas con el catálogo', () => {
    const catalogo = [{ id: 1, simultanea: true }, { id: 2, simultanea: false }];
    expect(completarSimultaneidad([{ actividadId: 1 }, { actividadId: 2 }], catalogo).map((i) => i.simultanea)).toEqual([true, false]);
  });

  it('encuentra la inscrita en conflicto, ignorando la misma actividad', () => {
    const inscritas = [{ actividadId: 1, actividadNombre: 'Taller IA', fecha: '2026-11-20', horaInicio: '14:00:00', horaFin: '16:00:00' }];
    expect(buscarConflicto(charla, inscritas)?.actividadId).toBe(1);
    expect(buscarConflicto(taller, inscritas)).toBeNull();
  });
});

describe('HU-23 - estado de la actividad para el participante', () => {
  const inscritas = [{ actividadId: 1, fecha: '2026-11-20', horaInicio: '14:00:00', horaFin: '16:00:00' }];

  it('prioriza inscrito, luego agotado, luego conflicto', () => {
    expect(estadoActividad(taller, { cupoAgotado: true }, inscritas).estado).toBe('inscrito');
    expect(estadoActividad(charla, { cupoAgotado: true }, inscritas).estado).toBe('agotado');
    expect(estadoActividad(charla, { cupoAgotado: false }, inscritas).estado).toBe('conflicto');
    expect(estadoActividad(siguiente, { cupoAgotado: false }, inscritas).estado).toBe('disponible');
  });

  it('usa estaInscrito del cupo aunque la lista local no lo tenga', () => {
    expect(estadoActividad(siguiente, { estaInscrito: true }, []).estado).toBe('inscrito');
  });

  it('con el evento cerrado muestra «cerrada» salvo las ya inscritas', () => {
    expect(estadoActividad(taller, { cupoAgotado: false }, inscritas, false).estado).toBe('inscrito');
    expect(estadoActividad(siguiente, { cupoAgotado: false }, inscritas, false).estado).toBe('cerrada');
    expect(estadoActividad(charla, { cupoAgotado: true }, inscritas, false)).toEqual({ estado: 'cerrada', conflicto: null });
  });

  it('marca como no disponible la actividad sin programar', () => {
    expect(estadoActividad({ id: 9, inscribible: false }, undefined, []).estado).toBe('no_disponible');
  });

  it('calcula la ocupación sin pasar de 100', () => {
    expect(porcentajeOcupacion({ aforoMaximo: 50, inscritos: 45 })).toBe(90);
    expect(porcentajeOcupacion({ aforoMaximo: 10, inscritos: 12 })).toBe(100);
    expect(porcentajeOcupacion(undefined)).toBe(0);
  });
});

describe('HU-23 - motivo del rechazo (Criterio 4)', () => {
  it('usa el título según el código y el mensaje del backend', () => {
    const err = { response: { status: 409, data: { codigo: 'CUPO_AGOTADO', message: 'La actividad alcanzó su cupo.' } } };
    expect(mensajeErrorInscripcion(err)).toMatchObject({ titulo: 'Cupo agotado', mensaje: 'La actividad alcanzó su cupo.' });
  });

  it('informa la falta de conexión', () => {
    expect(mensajeErrorInscripcion({ request: {} }).mensaje).toMatch(/conectarse/);
  });
});
