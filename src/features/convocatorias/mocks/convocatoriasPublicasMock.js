/**
 * @file convocatoriasPublicasMock.js
 * @description Datos y API simulada de la consulta pública de convocatorias, solo para Storybook (HU-11).
 * Imita GET /api/v1/publico/convocatorias: solo devuelve convocatorias en estado 'publicada'.
 * @module features/convocatorias/mocks/convocatoriasPublicasMock
 */

/** Fecha relativa a hoy en formato del backend (YYYY-MM-DDTHH:mm:ss). */
const enDias = (dias, hora = '23:59:00') => {
  const d = new Date(Date.now() + dias * 86400000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${hora}`;
};

export const CONVOCATORIAS_PUBLICAS_MOCK = [
  {
    id: 1,
    eventoId: 3,
    eventoNombre: 'Congreso de Ingeniería de Sistemas 2026',
    titulo: 'Convocatoria de Ponencias y Artículos de Investigación 2026',
    descripcion:
      'Invitamos a docentes, investigadores y estudiantes a presentar sus avances en ingeniería de software, ciberseguridad, inteligencia artificial y sistemas distribuidos.',
    requisitos:
      '1. Formato IEEE dos columnas.\n2. Máximo 6 páginas.\n3. Resumen en español e inglés.\n4. Archivo PDF sin datos de autor para revisión a ciegas.',
    fechaApertura: enDias(-10, '08:00:00'),
    fechaCierre: enDias(20),
    estado: 'publicada',
    estaAbierta: true,
  },
  {
    id: 2,
    eventoId: 4,
    eventoNombre: 'Encuentro de Semilleros de Investigación UFPS',
    titulo: 'Convocatoria de Pósters Científicos',
    descripcion: 'Socialización de proyectos de semillero en fase preliminar o de resultados.',
    requisitos: '1. Afiliación activa a un semillero avalado.\n2. Póster de 90x120 cm.\n3. Resumen de máximo 500 palabras.',
    fechaApertura: enDias(5, '08:00:00'),
    fechaCierre: enDias(35),
    estado: 'publicada',
    estaAbierta: false,
  },
  {
    id: 3,
    eventoId: 3,
    eventoNombre: 'Congreso de Ingeniería de Sistemas 2026',
    titulo: 'Convocatoria de Talleres y Tutoriales',
    descripcion: 'Propuestas de talleres prácticos de 2 a 4 horas para la agenda del congreso.',
    requisitos: '1. Plan del taller.\n2. Requerimientos técnicos de la sala.',
    fechaApertura: enDias(-40, '08:00:00'),
    fechaCierre: enDias(-2),
    estado: 'publicada',
    estaAbierta: false,
  },
];

/**
 * API simulada con el mismo contrato que las funciones públicas de `convocatoriaService`.
 * @param {Array<Object>} [lista=CONVOCATORIAS_PUBLICAS_MOCK]
 */
export function crearConvocatoriasPublicasApiMock(lista = CONVOCATORIAS_PUBLICAS_MOCK) {
  const esperar = (valor) => new Promise((resolve) => setTimeout(() => resolve(valor), 300));
  return {
    listarConvocatoriasPublicadas: (eventoId) =>
      esperar(lista.filter((c) => !eventoId || String(c.eventoId) === String(eventoId)).map((c) => ({ ...c }))),
    obtenerConvocatoriaPublicada: (id) => {
      const encontrada = lista.find((c) => String(c.id) === String(id));
      return encontrada
        ? esperar({ ...encontrada })
        : Promise.reject({ response: { status: 404, data: { message: 'No se encontró una convocatoria publicada.' } } });
    },
  };
}

/** API simulada sin conexión con el backend. */
export const convocatoriasPublicasApiConError = {
  listarConvocatoriasPublicadas: () => Promise.reject(new Error('Sin conexión con el servidor.')),
  obtenerConvocatoriaPublicada: () => Promise.reject(new Error('Sin conexión con el servidor.')),
};
