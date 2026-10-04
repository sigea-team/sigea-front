import EventoDeleteModal from './EventoDeleteModal';
import { EVENTOS_MOCK } from '../mocks/eventosMock';

export default {
  title: 'Features/Eventos/EventoDeleteModal',
  component: EventoDeleteModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const esperar = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));
const enConfiguracion = EVENTOS_MOCK.find((e) => e.estado === 'en_configuracion');

export const ConfirmarEliminacion = {
  args: {
    isOpen: true,
    evento: enConfiguracion,
    edicionesDerivadas: 0,
    onClose: () => {},
    onConfirm: async () => esperar(),
  },
};

export const BloqueadoPorEstado = {
  args: {
    isOpen: true,
    evento: EVENTOS_MOCK.find((e) => e.estado === 'cerrado'),
    onClose: () => {},
    onConfirm: async () => {},
  },
};

export const BloqueadoPorTenerEdiciones = {
  args: {
    isOpen: true,
    evento: { ...enConfiguracion, nombre: 'Feria de Proyectos', id: 99 },
    edicionesDerivadas: 2,
    onClose: () => {},
    onConfirm: async () => {},
  },
};

export const ErrorDelServidor = {
  args: {
    isOpen: true,
    evento: enConfiguracion,
    onClose: () => {},
    onConfirm: async () => {
      await esperar();
      const err = new Error('Forbidden');
      err.response = { status: 403, data: { message: 'Acceso denegado' } };
      throw err;
    },
  },
};
