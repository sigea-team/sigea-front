import EventoFormModal from './EventoFormModal';
import { EVENTOS_MOCK } from '../mocks/eventosMock';

export default {
  title: 'Features/Eventos/EventoFormModal',
  component: EventoFormModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const esperar = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export const CrearEvento = {
  args: {
    isOpen: true,
    evento: null,
    onClose: () => {},
    onSubmit: async (datos) => {
      await esperar();
      alert(`Payload enviado:\n${JSON.stringify(datos, null, 2)}`);
    },
  },
};

export const EditarEvento = {
  args: {
    isOpen: true,
    evento: EVENTOS_MOCK.find((e) => e.estado === 'en_configuracion'),
    onClose: () => {},
    onSubmit: async () => esperar(),
  },
};

export const ErrorDelServidor = {
  args: {
    isOpen: true,
    evento: null,
    onClose: () => {},
    onSubmit: async () => {
      await esperar();
      const err = new Error('Bad Request');
      err.response = {
        status: 400,
        data: {
          message: 'Error de validación en los campos de entrada.',
          erroresValidacion: { tipo: 'El tipo de evento es obligatorio.', rangoFechasValido: 'La fecha de fin no puede ser anterior a la fecha de inicio.' },
        },
      };
      throw err;
    },
  },
};
