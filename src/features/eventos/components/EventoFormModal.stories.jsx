import EventoFormModal from './EventoFormModal';
import { EVENTOS_MOCK } from '../mocks/eventosMock';
import { TIPOS_EVENTO_MOCK } from '../mocks/tiposEventoMock';

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
    tiposEvento: TIPOS_EVENTO_MOCK,
    onAdministrarTipos: () => alert('Abre la ventana «Tipos de evento»'),
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
    tiposEvento: TIPOS_EVENTO_MOCK,
    onAdministrarTipos: () => alert('Abre la ventana «Tipos de evento»'),
    evento: EVENTOS_MOCK.find((e) => e.estado === 'en_configuracion'),
    onClose: () => {},
    onSubmit: async () => esperar(),
  },
};

export const ErrorDelServidor = {
  args: {
    isOpen: true,
    tiposEvento: TIPOS_EVENTO_MOCK,
    onAdministrarTipos: () => alert('Abre la ventana «Tipos de evento»'),
    evento: null,
    onClose: () => {},
    onSubmit: async () => {
      await esperar();
      const err = new Error('Bad Request');
      err.response = {
        status: 400,
        data: {
          message: 'Error de validación en los campos de entrada.',
          erroresValidacion: { tipoEventoId: 'Selecciona el tipo de evento.', rangoFechasValido: 'La fecha de fin no puede ser anterior a la fecha de inicio.' },
        },
      };
      throw err;
    },
  },
};

export const CargandoTipos = {
  args: { isOpen: true, evento: null, tiposEvento: null, onClose: () => {}, onSubmit: async () => esperar() },
};

export const SinTiposDeEvento = {
  args: {
    isOpen: true,
    evento: null,
    tiposEvento: [],
    onAdministrarTipos: () => alert('Abre la ventana «Tipos de evento»'),
    onClose: () => {},
    onSubmit: async () => esperar(),
  },
};
