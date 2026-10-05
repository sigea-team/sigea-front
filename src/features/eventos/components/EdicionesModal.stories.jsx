import EdicionesModal from './EdicionesModal';
import { EVENTOS_MOCK, crearApiMock } from '../mocks/eventosMock';

export default {
  title: 'Features/Eventos/EdicionesModal',
  component: EdicionesModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const api = crearApiMock();

export const DesdeEventoBase = {
  args: {
    isOpen: true,
    evento: EVENTOS_MOCK.find((e) => e.id === 1),
    api,
    onClose: () => {},
    onNuevaEdicion: (origen) => alert(`Nueva edición a partir de: ${origen.nombre}`),
  },
};

export const DesdeUnaEdicion = {
  args: {
    isOpen: true,
    evento: EVENTOS_MOCK.find((e) => e.id === 3),
    api,
    onClose: () => {},
    onNuevaEdicion: (origen) => alert(`Nueva edición a partir de: ${origen.nombre}`),
  },
};

export const EventoSinEdiciones = {
  args: {
    isOpen: true,
    evento: EVENTOS_MOCK.find((e) => e.id === 4),
    api,
    onClose: () => {},
  },
};

export const ErrorAlCargar = {
  args: {
    isOpen: true,
    evento: EVENTOS_MOCK.find((e) => e.id === 1),
    api: {
      listarEdiciones: async () => {
        const err = new Error('Not Found');
        err.response = { status: 404, data: { message: 'No se encontró el evento con ID: 1' } };
        throw err;
      },
    },
    onClose: () => {},
  },
};
