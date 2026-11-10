import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  actividadService,
  aActividadRequest,
  normalizarActividadResponse,
} from '../../api/actividadService';
import { httpClient } from '../../api/httpClient';

vi.mock('../../api/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('HU-21: Cliente API de Actividades y Agenda (actividadService)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Transformación de datos (DTOs)', () => {
    it('transforma datos del frontend a ActividadRequest del backend', () => {
      const form = {
        nombre: '  Taller de Microservicios  ',
        tipoActividadId: '2',
        fecha: '2026-10-21',
        horaInicio: '09:00',
        horaFin: '11:00',
        salaId: '3',
        ponenteId: '7',
        permiteSimultaneidad: true,
        confirmarAdvertencias: false,
      };

      const req = aActividadRequest(form);

      expect(req).toEqual({
        nombre: 'Taller de Microservicios',
        tipoActividadId: 2,
        fecha: '2026-10-21',
        horaInicio: '09:00',
        horaFin: '11:00',
        salaId: 3,
        ponenteId: 7,
        propuestaId: null,
        lineaTematicaId: null,
        modalidad: 'presencial',
        simultanea: true,
        confirmarAdvertencias: false,
      });
    });

    it('normaliza ActividadResponse del backend al modelo de interfaz', () => {
      const backendResponse = {
        id: 10,
        eventoId: 1,
        nombre: 'Conferencia Magistral',
        tipoActividadId: 1,
        tipoActividadNombre: 'Conferencia',
        fecha: '2026-10-21',
        horaInicio: '08:30:00',
        horaFin: '10:00:00',
        salaId: 5,
        salaNombre: 'Auditorio Mayor',
        ponenteId: 12,
        ponenteNombre: 'Dra. Ana Pérez',
        modalidad: 'presencial',
        simultanea: true,
        estado: 'programada',
        advertencias: [{ tipo: 'FUERA_DISPONIBILIDAD_SALA', mensaje: 'Aviso sala' }],
      };

      const normalizada = normalizarActividadResponse(backendResponse);

      expect(normalizada.horaInicio).toBe('08:30');
      expect(normalizada.horaFin).toBe('10:00');
      expect(normalizada.permiteSimultaneidad).toBe(true);
      expect(normalizada.tieneAdvertencia).toBe(true);
      expect(normalizada.advertencias).toHaveLength(1);
    });
  });

  describe('Endpoints del Backend (ActividadController)', () => {
    it('listarActividades llama a GET /eventos/{eventoId}/actividades y devuelve lista ordenada', async () => {
      httpClient.get.mockResolvedValueOnce({
        data: [
          { id: 2, nombre: 'Clausura', fecha: '2026-10-22', horaInicio: '15:00', horaFin: '17:00' },
          { id: 1, nombre: 'Apertura', fecha: '2026-10-21', horaInicio: '08:00', horaFin: '09:00' },
        ],
      });

      const lista = await actividadService.listarActividades(5);

      expect(httpClient.get).toHaveBeenCalledWith('/eventos/5/actividades', { params: {} });
      expect(lista[0].nombre).toBe('Apertura');
      expect(lista[1].nombre).toBe('Clausura');
    });

    it('obtenerActividad llama a GET /eventos/{eventoId}/actividades/{actividadId}', async () => {
      httpClient.get.mockResolvedValueOnce({
        data: { id: 10, nombre: 'Detalle Actividad', horaInicio: '10:00:00', horaFin: '12:00:00' },
      });

      const act = await actividadService.obtenerActividad(5, 10);

      expect(httpClient.get).toHaveBeenCalledWith('/eventos/5/actividades/10');
      expect(act.id).toBe(10);
    });

    it('crearActividad llama a POST /eventos/{eventoId}/actividades', async () => {
      httpClient.post.mockResolvedValueOnce({
        data: { id: 99, nombre: 'Nueva', horaInicio: '09:00:00', horaFin: '10:30:00' },
      });

      const nueva = await actividadService.crearActividad(5, {
        nombre: 'Nueva',
        tipoActividadId: 1,
        fecha: '2026-10-21',
        horaInicio: '09:00',
        horaFin: '10:30',
        salaId: 2,
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/eventos/5/actividades',
        expect.objectContaining({
          nombre: 'Nueva',
          salaId: 2,
        })
      );
      expect(nueva.id).toBe(99);
    });

    it('actualizarActividad llama a PUT /eventos/{eventoId}/actividades/{actividadId}', async () => {
      httpClient.put.mockResolvedValueOnce({
        data: { id: 15, nombre: 'Modificada', horaInicio: '14:00', horaFin: '16:00' },
      });

      const act = await actividadService.actualizarActividad(5, 15, {
        nombre: 'Modificada',
        tipoActividadId: 2,
        fecha: '2026-10-21',
        horaInicio: '14:00',
        horaFin: '16:00',
        salaId: 3,
      });

      expect(httpClient.put).toHaveBeenCalledWith(
        '/eventos/5/actividades/15',
        expect.objectContaining({
          nombre: 'Modificada',
          salaId: 3,
        })
      );
      expect(act.id).toBe(15);
    });

    it('eliminarActividad llama a DELETE /eventos/{eventoId}/actividades/{actividadId}', async () => {
      httpClient.delete.mockResolvedValueOnce({ data: null });

      const res = await actividadService.eliminarActividad(5, 15);

      expect(httpClient.delete).toHaveBeenCalledWith('/eventos/5/actividades/15');
      expect(res.ok).toBe(true);
    });

    it('validarEnBackend llama a POST /eventos/{eventoId}/actividades/validar', async () => {
      httpClient.post.mockResolvedValueOnce({
        data: {
          puedeGuardar: true,
          requiereConfirmacion: false,
          conflictos: [],
          advertencias: [],
        },
      });

      const res = await actividadService.validarEnBackend(5, {
        nombre: 'Prueba',
        salaId: 1,
        fecha: '2026-10-21',
        horaInicio: '08:00',
        horaFin: '09:00',
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/eventos/5/actividades/validar',
        expect.any(Object),
        { params: {} }
      );
      expect(res.puedeGuardar).toBe(true);
    });

    it('HU-19: propaga el 400 del backend (propuesta sin versión definitiva) en vez de guardar en el respaldo', async () => {
      httpClient.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            codigo: 'SOLICITUD_INVALIDA',
            message: 'La propuesta «IA» aún no tiene versión definitiva aprobada; solo las propuestas aprobadas en versión definitiva se pueden programar en la agenda.',
          },
        },
      });

      await expect(
        actividadService.crearActividad(1, {
          nombre: 'Ponencia',
          fecha: '2026-10-21',
          horaInicio: '09:00',
          horaFin: '10:00',
          salaId: 3,
          propuestaId: 70,
        })
      ).rejects.toMatchObject({ codigo: 'SOLICITUD_INVALIDA', status: 400 });
    });

    it('propaga 409 con codigo y detalles cuando hay conflicto o confirmación requerida', async () => {
      httpClient.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            codigo: 'CONFLICTO_PROGRAMACION',
            message: 'Cruce detectado en sala',
            conflictos: [{ tipo: 'SALA', mensaje: 'Sala ocupada' }],
            advertencias: [],
          },
        },
      });

      await expect(
        actividadService.crearActividad(5, {
          nombre: 'Conflictiva',
          tipoActividadId: 1,
          fecha: '2026-10-21',
          horaInicio: '09:00',
          horaFin: '10:00',
          salaId: 1,
        })
      ).rejects.toMatchObject({
        codigo: 'CONFLICTO_PROGRAMACION',
        conflictos: [{ tipo: 'SALA', mensaje: 'Sala ocupada' }],
      });
    });
  });
});
