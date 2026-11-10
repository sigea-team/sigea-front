import AgendaPublicaPage from './AgendaPublicaPage';
import { agendaPublicaApiPublicada, agendaPublicaApiSinPublicar } from '../features/agenda/mocks/agendaGeneracionMock';

export default {
  title: 'Pages/AgendaPublicaPage',
  component: AgendaPublicaPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

/** Criterio 3: agenda publicada organizada por día y hora. La sala virtual no muestra su enlace. */
export const Publicada = { args: { api: agendaPublicaApiPublicada(), eventoId: 1 } };

/** La agenda todavía no se publicó: se informa sin opción de reintentar. */
export const SinPublicar = { args: { api: agendaPublicaApiSinPublicar(), eventoId: 1 } };

export const ErrorDeConexion = {
  args: {
    api: {
      obtenerAgendaPublica: async () => {
        const e = new Error('Network Error');
        e.request = {};
        throw e;
      },
    },
    eventoId: 1,
  },
};
