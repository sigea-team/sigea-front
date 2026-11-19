import EventoDetallePage from './EventoDetallePage';
import { EVENTOS_BASE_INSTITUCIONALES } from '../features/home/homeUtils';

export default {
  title: 'Pages/EventoDetallePage',
  component: EventoDetallePage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export const Hackathon = {
  args: {
    eventoId: 1,
    api: {
      obtenerEvento: async () => ({
        ...EVENTOS_BASE_INSTITUCIONALES[0],
        convocatorias: [
          {
            id: 1,
            eventoId: 1,
            titulo: 'Call for Posters y Proyectos Hackathon 2026',
            descripcion: 'Envía tu propuesta técnica para la competencia institucional de proyectos aplicados.',
            fechaCierre: '2026-11-30T23:59:00',
          },
        ],
      }),
    },
    apiConvocatorias: {
      listarConvocatoriasPublicadas: async () => [
        {
          id: 1,
          eventoId: 1,
          titulo: 'Call for Posters y Proyectos Hackathon 2026',
          descripcion: 'Envía tu propuesta técnica para la competencia institucional de proyectos aplicados.',
          fechaCierre: '2026-11-30T23:59:00',
        },
      ],
    },
  },
};

export const SimposioVirtual = {
  args: {
    eventoId: 3,
    api: {
      obtenerEvento: async () => EVENTOS_BASE_INSTITUCIONALES[2],
    },
    apiConvocatorias: {
      listarConvocatoriasPublicadas: async () => [],
    },
  },
};

export const NoEncontrado = {
  args: {
    eventoId: 9999,
    api: {
      obtenerEvento: async () => {
        const error = new Error('Not found');
        error.response = { status: 404 };
        throw error;
      },
    },
  },
};
