import { describe, expect, it, vi, beforeEach } from 'vitest';
import { aSalaRequest, normalizarPonenteApi, normalizarSalaApi, aFranjasApi } from './salaUtils';

vi.mock('../../api/httpClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../api/conferencistaService', () => ({ listarConferencistas: vi.fn() }));

const { httpClient } = await import('../../api/httpClient');
const { listarConferencistas } = await import('../../api/conferencistaService');
const { salaService } = await import('../../api/salaService');

describe('HU-20 - traducción entre backend e interfaz', () => {
  it('convierte una SalaResponse al formato de la interfaz', () => {
    const sala = normalizarSalaApi({
      id: 3,
      eventoId: 1,
      nombre: 'Aula Magna',
      ubicacion: null,
      tipo: 'fisica',
      aforoMaximo: 200,
      disponibilidades: [{ id: 10, salaId: 3, fecha: '2026-11-15', horaInicio: '08:00:00', horaFin: '12:00:00' }],
    });
    expect(sala).toEqual({
      id: 3,
      eventoId: 1,
      nombre: 'Aula Magna',
      ubicacion: '',
      tipo: 'fisica',
      aforoMaximo: 200,
      disponibilidad: [{ id: 10, fecha: '2026-11-15', horaInicio: '08:00', horaFin: '12:00' }],
    });
  });

  it('construye el SalaRequest con el tipo en minúsculas y las franjas como disponibilidades', () => {
    expect(
      aSalaRequest({
        nombre: ' Sala 1 ',
        ubicacion: '',
        tipo: 'VIRTUAL',
        aforoMaximo: '50',
        disponibilidad: [{ id: 1, fecha: '2026-11-15', horaInicio: '09:00', horaFin: '10:00' }],
      })
    ).toEqual({
      nombre: 'Sala 1',
      ubicacion: null,
      tipo: 'virtual',
      aforoMaximo: 50,
      disponibilidades: [{ fecha: '2026-11-15', horaInicio: '09:00', horaFin: '10:00' }],
    });
    expect(aFranjasApi(undefined)).toEqual([]);
  });

  it('arma el ponente a partir del conferencista del evento y su disponibilidad', () => {
    const p = normalizarPonenteApi({ personaId: 7, nombreCompleto: 'Ana Pérez', correo: 'a@u.co' }, [
      { id: 1, fecha: '2026-11-15', horaInicio: '09:00:00', horaFin: '13:00:00' },
    ]);
    expect(p).toMatchObject({ personaId: 7, nombres: 'Ana Pérez', disponibilidad: [{ horaInicio: '09:00', horaFin: '13:00' }] });
  });
});

describe('HU-20 - salaService usa las rutas reales del backend', () => {
  beforeEach(() => vi.clearAllMocks());

  it('las operaciones de sala van bajo /eventos/{eventoId}/salas', async () => {
    httpClient.get.mockResolvedValue({ data: [] });
    httpClient.put.mockResolvedValue({ data: { id: 3, disponibilidades: [] } });
    httpClient.delete.mockResolvedValue({});

    await salaService.listarSalas(1);
    await salaService.actualizarSala(1, 3, { nombre: 'A', tipo: 'fisica', aforoMaximo: 1 });
    await salaService.eliminarSala(1, 3);

    expect(httpClient.get).toHaveBeenCalledWith('/eventos/1/salas');
    expect(httpClient.put).toHaveBeenCalledWith('/eventos/1/salas/3', expect.objectContaining({ tipo: 'fisica' }));
    expect(httpClient.delete).toHaveBeenCalledWith('/eventos/1/salas/3');
  });

  it('sin evento no consulta salas ni ponentes', async () => {
    expect(await salaService.listarSalas(null)).toEqual([]);
    expect(await salaService.listarPonentesEvento('')).toEqual([]);
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('la disponibilidad se envía como arreglo y devuelve los conflictos', async () => {
    httpClient.put.mockResolvedValue({
      data: { salaId: 3, disponibilidades: [], conflictos: [{ actividadId: 9, nombreActividad: 'Taller' }], tieneConflictos: true },
    });
    const r = await salaService.guardarDisponibilidadSala(1, 3, [{ fecha: '2026-11-15', horaInicio: '08:00', horaFin: '09:00' }]);
    expect(httpClient.put).toHaveBeenCalledWith('/eventos/1/salas/3/disponibilidad', [
      { fecha: '2026-11-15', horaInicio: '08:00', horaFin: '09:00' },
    ]);
    expect(r.conflictos).toHaveLength(1);
  });

  it('los ponentes salen de los conferencistas del evento con su disponibilidad', async () => {
    listarConferencistas.mockResolvedValue([{ personaId: 7, nombreCompleto: 'Ana Pérez' }]);
    httpClient.get.mockResolvedValue({ data: [{ id: 1, fecha: '2026-11-15', horaInicio: '09:00:00', horaFin: '10:00:00' }] });

    const ponentes = await salaService.listarPonentesEvento(1);

    expect(httpClient.get).toHaveBeenCalledWith('/eventos/1/ponentes/7/disponibilidad');
    expect(ponentes[0]).toMatchObject({ personaId: 7, nombres: 'Ana Pérez' });
    expect(ponentes[0].disponibilidad).toHaveLength(1);
  });

  it('un error del backend se propaga: ya no hay datos de prueba de respaldo', async () => {
    httpClient.get.mockRejectedValue({ response: { status: 404 } });
    await expect(salaService.listarSalas(1)).rejects.toEqual({ response: { status: 404 } });
  });

  it('la programación de actividades está habilitada y conectada a ActividadController', async () => {
    expect(salaService.soportaActividades).toBe(true);
    httpClient.post.mockResolvedValueOnce({
      data: { id: 101, nombre: 'Sesión Inaugural', fecha: '2026-11-15', horaInicio: '08:00:00', horaFin: '10:00:00', salaId: 3 },
    });
    const act = await salaService.programarActividad(1, {
      nombre: 'Sesión Inaugural',
      fecha: '2026-11-15',
      horaInicio: '08:00',
      horaFin: '10:00',
      salaId: 3,
    });
    expect(act.id).toBe(101);
  });
});
