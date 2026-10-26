import { describe, expect, it } from 'vitest';
import { LIMITE_VISUAL_CONTADOR, rutaDeNotificacion, textoContador, tiempoRelativo } from './notificacionUtils';
import { crearNotificacionesApiMock } from './mocks/notificacionesMock';

describe('notificacionUtils (HU-11)', () => {
  it('limita el contador visual', () => {
    expect(textoContador(3)).toBe('3');
    expect(textoContador(LIMITE_VISUAL_CONTADOR + 1)).toBe(`${LIMITE_VISUAL_CONTADOR}+`);
  });

  it('expresa el tiempo transcurrido', () => {
    const ahora = Date.now();
    expect(tiempoRelativo(new Date(ahora - 30000), ahora)).toBe('hace un momento');
    expect(tiempoRelativo(new Date(ahora - 5 * 60000), ahora)).toBe('hace 5 min');
    expect(tiempoRelativo(new Date(ahora - 3 * 3600000), ahora)).toBe('hace 3 h');
    expect(tiempoRelativo(new Date(ahora - 86400000), ahora)).toBe('hace 1 día');
  });

  it('lleva las notificaciones de convocatorias a la página pública', () => {
    expect(rutaDeNotificacion({ entidad: 'convocatorias', entidadId: 10 })).toBe(
      '/convocatorias-publicas?convocatoria=10'
    );
    expect(rutaDeNotificacion({ entidad: 'otra', entidadId: 1 })).toBeNull();
  });

  it('HU-16: lleva las notificaciones de asignación a la bandeja de evaluaciones', () => {
    expect(rutaDeNotificacion({ entidad: 'asignaciones_evaluacion', entidadId: 12 })).toBe('/evaluaciones');
  });
});

describe('contrato de la API de notificaciones (mock usado por la campana)', () => {
  it('cuenta, marca una y marca todas como leídas', async () => {
    const api = crearNotificacionesApiMock();
    expect(await api.contarNoLeidas()).toBe(2);

    const leida = await api.marcarComoLeida(3);
    expect(leida.leida).toBe(true);
    expect(await api.contarNoLeidas()).toBe(1);

    expect(await api.marcarTodasComoLeidas()).toBe(1);
    expect(await api.contarNoLeidas()).toBe(0);
    expect(await api.listarNotificaciones({ soloNoLeidas: true })).toEqual([]);
  });
});
