/**
 * @file eventosMock.js
 * @description Datos y API simulada del módulo de eventos, solo para Storybook.
 * Imita las respuestas y reglas del backend de la HU-04 sin necesidad de servidor.
 * @module features/eventos/mocks/eventosMock
 */

export const EVENTOS_MOCK = [
  {
    id: 4,
    nombre: 'Seminario de Ingeniería de Software',
    objetivo: 'Socializar avances de los semilleros de investigación del programa.',
    descripcion: 'Jornada de ponencias cortas y paneles con egresados.',
    tipo: 'Seminario',
    modalidad: 'hibrida',
    fechaInicio: '2026-11-12',
    fechaFin: '2026-11-12',
    semestre: '2026-2',
    estado: 'en_configuracion',
    eventoBaseId: null,
    esEdicion: false,
  },
  {
    id: 3,
    nombre: 'Congreso de Ingeniería de Sistemas 2026',
    objetivo: 'Integrar a la comunidad académica alrededor de la investigación en computación.',
    descripcion: 'Conferencias, talleres y ponencias evaluadas por el comité técnico.',
    tipo: 'Congreso',
    modalidad: 'presencial',
    fechaInicio: '2026-10-20',
    fechaFin: '2026-10-22',
    semestre: '2026-2',
    estado: 'habilitado',
    eventoBaseId: 1,
    esEdicion: true,
  },
  {
    id: 2,
    nombre: 'Congreso de Ingeniería de Sistemas 2025',
    objetivo: 'Integrar a la comunidad académica alrededor de la investigación en computación.',
    descripcion: 'Conferencias, talleres y ponencias evaluadas por el comité técnico.',
    tipo: 'Congreso',
    modalidad: 'presencial',
    fechaInicio: '2025-10-21',
    fechaFin: '2025-10-23',
    semestre: '2025-2',
    estado: 'cerrado',
    eventoBaseId: 1,
    esEdicion: true,
  },
  {
    id: 1,
    nombre: 'Congreso de Ingeniería de Sistemas 2024',
    objetivo: 'Integrar a la comunidad académica alrededor de la investigación en computación.',
    descripcion: 'Primera edición del congreso organizada por el programa.',
    tipo: 'Congreso',
    modalidad: 'presencial',
    fechaInicio: '2024-10-15',
    fechaFin: '2024-10-16',
    semestre: '2024-2',
    estado: 'cerrado',
    eventoBaseId: null,
    esEdicion: false,
  },
];

const esperar = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/** Construye un error con la forma de un error de Axios con respuesta del backend. */
function errorApi(status, message, extra = {}) {
  const err = new Error(message);
  err.response = { status, data: { status, message, ...extra } };
  return err;
}

function semestreDe(fecha) {
  const [anio, mes] = fecha.split('-').map(Number);
  return `${anio}-${mes <= 6 ? 1 : 2}`;
}

function raizDe(eventos, evento) {
  return evento.eventoBaseId ? eventos.find((e) => e.id === evento.eventoBaseId) : evento;
}

/**
 * Crea una API simulada con estado en memoria y las mismas reglas del backend.
 * @param {Array<Object>} [datosIniciales=EVENTOS_MOCK]
 */
export function crearApiMock(datosIniciales = EVENTOS_MOCK) {
  let eventos = datosIniciales.map((e) => ({ ...e }));
  let siguienteId = Math.max(0, ...eventos.map((e) => e.id)) + 1;

  const buscar = (id) => {
    const evento = eventos.find((e) => e.id === Number(id));
    if (!evento) throw errorApi(404, `No se encontró el evento con ID: ${id}`, { codigo: 'RECURSO_NO_ENCONTRADO' });
    return evento;
  };

  const familia = (raizId) => eventos.filter((e) => e.id === raizId || e.eventoBaseId === raizId);

  return {
    async listarEventos() {
      await esperar();
      return [...eventos].sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio) || b.id - a.id);
    },

    async obtenerEvento(id) {
      await esperar(200);
      return { ...buscar(id) };
    },

    async crearEvento(datos) {
      await esperar();
      const nuevo = {
        ...datos,
        id: siguienteId++,
        semestre: datos.semestre || semestreDe(datos.fechaInicio),
        estado: 'en_configuracion',
        eventoBaseId: null,
        esEdicion: false,
      };
      eventos.push(nuevo);
      return nuevo;
    },

    async actualizarEvento(id, datos) {
      await esperar();
      const evento = buscar(id);
      if (evento.estado !== 'en_configuracion') {
        throw errorApi(409, `El evento '${evento.nombre}' ya no está en configuración.`, { codigo: 'OPERACION_NO_PERMITIDA' });
      }
      Object.assign(evento, datos, { semestre: datos.semestre || semestreDe(datos.fechaInicio) });
      return { ...evento };
    },

    async crearEdicion(origenId, datos) {
      await esperar();
      const origen = buscar(origenId);
      const raiz = raizDe(eventos, origen);
      const semestre = datos.semestre || semestreDe(datos.fechaInicio);
      if (familia(raiz.id).some((e) => e.semestre === semestre)) {
        throw errorApi(409, `Ya existe una edición de este evento para el semestre ${semestre}.`, {
          codigo: 'OPERACION_NO_PERMITIDA',
        });
      }
      const nueva = {
        id: siguienteId++,
        nombre: datos.nombre || origen.nombre,
        objetivo: origen.objetivo,
        descripcion: origen.descripcion,
        tipo: origen.tipo,
        modalidad: origen.modalidad,
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
        semestre,
        estado: 'en_configuracion',
        eventoBaseId: raiz.id,
        esEdicion: true,
      };
      eventos.push(nueva);
      return nueva;
    },

    async listarEdiciones(id) {
      await esperar();
      const raiz = raizDe(eventos, buscar(id));
      const ediciones = familia(raiz.id).sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio) || a.id - b.id);
      return {
        eventoBaseId: raiz.id,
        nombreEventoBase: raiz.nombre,
        totalEdiciones: ediciones.length,
        ediciones,
      };
    },

    async eliminarEvento(id) {
      await esperar();
      const evento = buscar(id);
      if (evento.estado !== 'en_configuracion') {
        throw errorApi(409, `No es posible eliminar '${evento.nombre}' porque ya no está en configuración.`);
      }
      if (eventos.some((e) => e.eventoBaseId === evento.id)) {
        throw errorApi(409, `No es posible eliminar '${evento.nombre}' porque es el evento base de otras ediciones.`);
      }
      eventos = eventos.filter((e) => e.id !== evento.id);
      return { mensaje: 'Evento eliminado exitosamente.', eventoId: String(id) };
    },
  };
}

/** API simulada que siempre falla, para mostrar el estado de error en Storybook. */
export const apiMockConError = {
  listarEventos: async () => {
    await esperar();
    const err = new Error('Network Error');
    err.request = {};
    throw err;
  },
};
