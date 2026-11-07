import HistorialClasificaciones from './HistorialClasificaciones';

export default {
  title: 'Features/Clasificacion/HistorialClasificaciones',
  component: HistorialClasificaciones,
  tags: ['autodocs'],
};

/** Clasificación automática seguida de un ajuste manual con motivo (Criterio 2). */
export const ConMovimientos = {
  args: {
    movimientos: [
      {
        historialId: 3,
        tipo: 'manual',
        clasificacionAnterior: 'aprobada',
        clasificacionNueva: 'aprobada_con_ajustes',
        puntuacionPonderada: 7.1,
        umbralAceptacion: 7,
        umbralAjustes: 5,
        motivo: 'El comité pidió ajustar la metodología antes de aceptarla definitivamente.',
        realizadoPor: 'María Rodríguez',
        fechaHora: '2026-11-04T11:05:00',
      },
      {
        historialId: 2,
        tipo: 'automatica',
        clasificacionAnterior: null,
        clasificacionNueva: 'aprobada',
        puntuacionPonderada: 7.1,
        umbralAceptacion: 7,
        umbralAjustes: 5,
        motivo: null,
        realizadoPor: 'María Rodríguez',
        fechaHora: '2026-11-04T10:30:00',
      },
    ],
  },
};

export const SinMovimientos = { args: { movimientos: [] } };

export const Cargando = { args: { movimientos: null } };

export const ConError = { args: { movimientos: null, error: true, onReintentar: () => {} } };
