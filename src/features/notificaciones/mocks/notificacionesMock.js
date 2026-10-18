/**
 * @file notificacionesMock.js
 * @description Datos y API simulada de notificaciones, solo para Storybook (HU-11).
 * Imita las respuestas de /api/v1/notificaciones sin necesidad de servidor.
 * @module features/notificaciones/mocks/notificacionesMock
 */

const haceMinutos = (min) => new Date(Date.now() - min * 60000).toISOString();

export const NOTIFICACIONES_MOCK = [
  {
    id: 3,
    tipo: 'CONVOCATORIA_FECHA_MODIFICADA',
    titulo: 'Nueva fecha límite: Convocatoria de Ponencias 2026',
    mensaje:
      "La fecha límite de recepción de propuestas de la convocatoria 'Convocatoria de Ponencias 2026' del evento 'Congreso de Ingeniería de Sistemas 2026' cambió del 15/11/2026 23:59 al 30/11/2026 23:59. Aún estás a tiempo de enviar tu propuesta.",
    entidad: 'convocatorias',
    entidadId: 1,
    leida: false,
    fechaCreacion: haceMinutos(12),
    fechaLectura: null,
  },
  {
    id: 2,
    tipo: 'CONVOCATORIA_FECHA_MODIFICADA',
    titulo: 'Nueva fecha límite: Pósters de Semilleros',
    mensaje:
      "La fecha límite de recepción de propuestas de la convocatoria 'Pósters de Semilleros' cambió del 01/11/2026 18:00 al 08/11/2026 18:00. Aún estás a tiempo de enviar tu propuesta.",
    entidad: 'convocatorias',
    entidadId: 2,
    leida: false,
    fechaCreacion: haceMinutos(60 * 5),
    fechaLectura: null,
  },
  {
    id: 1,
    tipo: 'CONVOCATORIA_FECHA_MODIFICADA',
    titulo: 'Nueva fecha límite: Convocatoria de Talleres',
    mensaje: 'La fecha límite cambió del 20/10/2026 23:59 al 25/10/2026 23:59. Aún estás a tiempo de enviar tu propuesta.',
    entidad: 'convocatorias',
    entidadId: 3,
    leida: true,
    fechaCreacion: haceMinutos(60 * 24 * 3),
    fechaLectura: haceMinutos(60 * 24 * 2),
  },
];

/**
 * Crea una API simulada con el mismo contrato que `notificacionService`.
 * @param {Array<Object>} [iniciales=NOTIFICACIONES_MOCK]
 */
export function crearNotificacionesApiMock(iniciales = NOTIFICACIONES_MOCK) {
  let lista = iniciales.map((n) => ({ ...n }));
  const esperar = (valor) => new Promise((resolve) => setTimeout(() => resolve(valor), 250));

  return {
    listarNotificaciones: ({ soloNoLeidas = false, limite = 20 } = {}) =>
      esperar(lista.filter((n) => !soloNoLeidas || !n.leida).slice(0, limite).map((n) => ({ ...n }))),
    contarNoLeidas: () => esperar(lista.filter((n) => !n.leida).length),
    marcarComoLeida: (id) => {
      lista = lista.map((n) =>
        n.id === id && !n.leida ? { ...n, leida: true, fechaLectura: new Date().toISOString() } : n
      );
      return esperar({ ...lista.find((n) => n.id === id) });
    },
    marcarTodasComoLeidas: () => {
      const pendientes = lista.filter((n) => !n.leida).length;
      const ahora = new Date().toISOString();
      lista = lista.map((n) => (n.leida ? n : { ...n, leida: true, fechaLectura: ahora }));
      return esperar(pendientes);
    },
  };
}

/** API simulada que falla en todas las llamadas (sin conexión con el backend). */
export const notificacionesApiConError = {
  listarNotificaciones: () => Promise.reject(new Error('Sin conexión con el servidor.')),
  contarNoLeidas: () => Promise.reject(new Error('Sin conexión con el servidor.')),
  marcarComoLeida: () => Promise.reject(new Error('Sin conexión con el servidor.')),
  marcarTodasComoLeidas: () => Promise.reject(new Error('Sin conexión con el servidor.')),
};
