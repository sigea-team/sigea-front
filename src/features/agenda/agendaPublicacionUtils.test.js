import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  agruparPorDia,
  estadoPublicacion,
  estaPorProgramar,
  etiquetaMotivo,
  formatearDuracion,
  interpretarRechazoPublicacion,
  precargaAsignacionManual,
  resumenGeneracion,
  separarActividades,
  sumarMinutos,
  textoFaltantes,
  tituloDia,
  validarPorProgramar,
} from './agendaPublicacionUtils';
import { aPorProgramarRequest, agendaService } from '../../api/agendaService';
import { normalizarActividadResponse } from '../../api/actividadService';
import { httpClient } from '../../api/httpClient';
import { crearAgendaApiMock } from './mocks/agendaGeneracionMock';

vi.mock('../../api/httpClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const rechazo = (status, data) => ({ response: { status, data } });

describe('agendaPublicacionUtils (HU-22)', () => {
  it('separa las actividades con horario de las que están por programar y omite las canceladas', () => {
    const { programadas, porProgramar } = separarActividades([
      { id: 1, estado: 'programada', fecha: '2027-03-10', horaInicio: '08:00', horaFin: '09:00' },
      { id: 2, estado: 'por_programar', fecha: null, horaInicio: null, horaFin: null },
      { id: 3, estado: 'cancelada', fecha: '2027-03-10', horaInicio: '08:00', horaFin: '09:00' },
      { id: 4, estado: 'programada', fecha: null, horaInicio: null, horaFin: null },
    ]);
    expect(programadas.map((a) => a.id)).toEqual([1]);
    expect(porProgramar.map((a) => a.id)).toEqual([2, 4]);
    expect(separarActividades(null)).toEqual({ programadas: [], porProgramar: [] });
    expect(estaPorProgramar({ estado: 'POR_PROGRAMAR' })).toBe(true);
    expect(estaPorProgramar({ estado: 'programada' })).toBe(false);
  });

  it('formatea la duración y suma minutos a una hora', () => {
    expect(formatearDuracion(45)).toBe('45 min');
    expect(formatearDuracion(60)).toBe('1 h');
    expect(formatearDuracion(90)).toBe('1 h 30 min');
    expect(formatearDuracion(null)).toBe('Sin duración');
    expect(sumarMinutos('08:00', 135)).toBe('10:15');
    expect(sumarMinutos('23:00', 600)).toBe('23:59');
  });

  it('valida el formulario con las reglas del backend', () => {
    expect(validarPorProgramar({ nombre: 'Taller', tipoActividadId: '2', duracionMinutos: '90' }).esValido).toBe(true);
    const { errores } = validarPorProgramar({ nombre: '  ', tipoActividadId: '', duracionMinutos: '' });
    expect(errores.nombre).toBe('El nombre de la actividad es obligatorio.');
    expect(errores.tipoActividadId).toBe('El tipo de actividad es obligatorio.');
    expect(errores.duracionMinutos).toBe('La duración de la actividad es obligatoria.');
    expect(validarPorProgramar({ nombre: 'x', tipoActividadId: 1, duracionMinutos: 4 }).errores.duracionMinutos)
      .toBe('La duración mínima es de 5 minutos.');
    expect(validarPorProgramar({ nombre: 'x', tipoActividadId: 1, duracionMinutos: 1441 }).errores.duracionMinutos)
      .toBe('La duración no puede superar las 24 horas.');
    expect(validarPorProgramar({ nombre: 'x', tipoActividadId: 1, duracionMinutos: '1.5' }).errores.duracionMinutos)
      .toBe('La duración debe ser un número entero de minutos.');
    expect(validarPorProgramar({ nombre: 'a'.repeat(201), tipoActividadId: 1, duracionMinutos: 60 }).errores.nombre)
      .toBe('El nombre no puede superar los 200 caracteres.');
  });

  it('agrupa por día en orden de fecha y hora', () => {
    const grupos = agruparPorDia([
      { fecha: '2027-03-11', horaInicio: '08:00' },
      { fecha: '2027-03-10', horaInicio: '10:00' },
      { fecha: '2027-03-10', horaInicio: '08:30' },
    ]);
    expect(grupos.map((g) => g.fecha)).toEqual(['2027-03-10', '2027-03-11']);
    expect(grupos[0].items.map((i) => i.horaInicio)).toEqual(['08:30', '10:00']);
    expect(grupos[0].fechaTexto.charAt(0)).toBe(grupos[0].fechaTexto.charAt(0).toUpperCase());
    expect(tituloDia('2027-03-10')).toMatch(/^[A-ZÁÉÍÓÚ].* de marzo de 2027$/);
  });

  it('nombra los motivos de las pendientes (Criterio 2) y lo que falta (Criterio 4)', () => {
    expect(etiquetaMotivo('SIN_ESPACIO_LIBRE')).toBe('Todos los horarios chocan');
    expect(etiquetaMotivo('OTRO')).toBe('Pendiente de asignación manual');
    expect(textoFaltantes(['fecha', 'horario', 'sala'])).toBe('fecha, horario y sala');
    expect(textoFaltantes(['sala'])).toBe('sala');
    expect(textoFaltantes([])).toBe('');
  });

  it('resume la generación', () => {
    expect(resumenGeneracion({ totalPorUbicar: 0, asignadas: [], pendientes: [] })).toBe('No hay actividades por programar.');
    expect(resumenGeneracion({ totalPorUbicar: 2, asignadas: [{}, {}], pendientes: [] })).toBe('2 actividades ubicadas sin cruces.');
    expect(resumenGeneracion({ totalPorUbicar: 2, asignadas: [{}], pendientes: [{}] }))
      .toBe('1 actividad ubicada; 1 queda pendiente de asignación manual.');
  });

  it('interpreta el 409 de publicar (Criterios 3 y 4)', () => {
    const r = interpretarRechazoPublicacion(rechazo(409, {
      codigo: 'AGENDA_INCOMPLETA', message: 'Hay 1 actividad(es)…',
      incompletas: [{ actividadId: 4, nombre: 'Panel', faltantes: ['sala'] }],
    }));
    expect(r.codigo).toBe('AGENDA_INCOMPLETA');
    expect(r.incompletas).toHaveLength(1);
    expect(r.conflictos).toEqual([]);
    expect(interpretarRechazoPublicacion(rechazo(500, { message: 'x' }))).toBeNull();
    expect(interpretarRechazoPublicacion(new Error('red'))).toBeNull();
  });

  it('calcula el estado de publicación', () => {
    expect(estadoPublicacion(null).tono).toBe('borrador');
    expect(estadoPublicacion({ publicada: true, dias: [{ estado: 'publicada', actividades: 2 }] }).texto).toBe('Publicada');
    expect(estadoPublicacion({
      publicada: true,
      dias: [{ estado: 'publicada', actividades: 2 }, { estado: 'no_publicada', actividades: 1 }],
    }).tono).toBe('parcial');
  });

  it('precarga la asignación manual con la duración de la actividad', () => {
    const p = precargaAsignacionManual({ id: 3, nombre: 'Taller', duracionMinutos: 90 }, { fechaInicio: '2027-03-10' });
    expect(p).toMatchObject({ id: 3, fecha: '2027-03-10', horaInicio: '08:00', horaFin: '09:30' });
  });
});

describe('agendaService (HU-22)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('convierte el formulario por programar al DTO del backend', () => {
    expect(aPorProgramarRequest({
      nombre: '  Taller  ', tipoActividadId: '2', duracionMinutos: '90', ponenteId: '', modalidad: '', simultanea: 1,
    })).toEqual({
      nombre: 'Taller', tipoActividadId: 2, duracionMinutos: 90, ponenteId: null, propuestaId: null,
      lineaTematicaId: null, modalidad: null, simultanea: true,
    });
  });

  it('usa las rutas del backend', async () => {
    httpClient.post.mockResolvedValue({ data: { id: 9, estado: 'por_programar', duracionMinutos: 90 } });
    httpClient.put.mockResolvedValue({ data: { id: 9, estado: 'por_programar' } });
    httpClient.get.mockResolvedValue({ data: { puedePublicar: true } });

    const r = await agendaService.registrarPorProgramar(1, { nombre: 'T', tipoActividadId: 2, duracionMinutos: 90 });
    expect(httpClient.post).toHaveBeenLastCalledWith('/eventos/1/actividades/por-programar', expect.objectContaining({ duracionMinutos: 90 }));
    expect(r).toMatchObject({ id: 9, fecha: null, horaInicio: null, salaId: null, duracionMinutos: 90 });

    await agendaService.actualizarPorProgramar(1, 9, { nombre: 'T', tipoActividadId: 2, duracionMinutos: 60 });
    expect(httpClient.put).toHaveBeenLastCalledWith('/eventos/1/actividades/9/por-programar', expect.any(Object));

    await agendaService.desprogramar(1, 9);
    expect(httpClient.post).toHaveBeenLastCalledWith('/eventos/1/actividades/9/desprogramar');

    await agendaService.proponer(1, { reubicarAutomaticas: true });
    expect(httpClient.post).toHaveBeenLastCalledWith('/eventos/1/agenda/generar', null, { params: { reubicarAutomaticas: true } });

    await agendaService.aplicar(1);
    expect(httpClient.post).toHaveBeenLastCalledWith('/eventos/1/agenda/generar/aplicar', null, { params: { reubicarAutomaticas: false } });

    await agendaService.validar(1);
    expect(httpClient.get).toHaveBeenLastCalledWith('/eventos/1/agenda/validacion');

    await agendaService.publicar(1);
    expect(httpClient.post).toHaveBeenLastCalledWith('/eventos/1/agenda/publicar');

    await agendaService.obtenerAgendaPublica(1);
    expect(httpClient.get).toHaveBeenLastCalledWith('/publico/eventos/1/agenda');
  });

  it('normaliza una actividad por programar sin inventar horas', () => {
    const a = normalizarActividadResponse({ id: 1, estado: 'por_programar', fecha: null, horaInicio: null, horaFin: null,
      salaId: null, duracionMinutos: 45, asignacionAutomatica: false });
    expect(a).toMatchObject({ fecha: null, horaInicio: null, horaFin: null, salaId: null, duracionMinutos: 45 });
    expect(normalizarActividadResponse({ id: 2, horaInicio: '09:00:00', horaFin: '10:00:00', asignacionAutomatica: true }))
      .toMatchObject({ horaInicio: '09:00', horaFin: '10:00', asignacionAutomatica: true });
  });
});

describe('API simulada de HU-22', () => {
  it('reproduce el flujo: generar, bloquear publicación incompleta, asignar a mano y publicar', async () => {
    const api = crearAgendaApiMock({ demora: 0 });
    const propuesta = await api.proponer(1);
    expect(propuesta.aplicada).toBe(false);
    expect(propuesta.pendientes.map((p) => p.motivo)).toEqual(['SIN_FRANJA_COMUN']);

    await api.aplicar(1);
    await expect(api.publicar(1)).rejects.toMatchObject({ response: { status: 409, data: { codigo: 'AGENDA_INCOMPLETA' } } });

    await api.eliminarActividad(1, 6);
    const pub = await api.publicar(1);
    expect(pub.diasPublicados.length).toBeGreaterThan(0);
    const publica = await api.obtenerAgendaPublica(1);
    expect(publica.dias[0].actividades[0].nombre).toBe('Inauguración');
    expect(publica.dias.flatMap((d) => d.actividades).find((a) => a.nombre === 'Webinar egresados').ubicacion).toBeNull();
  });
});
