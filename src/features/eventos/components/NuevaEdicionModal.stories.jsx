import NuevaEdicionModal from './NuevaEdicionModal';
import { EVENTOS_MOCK } from '../mocks/eventosMock';

export default {
  title: 'Features/Eventos/NuevaEdicionModal',
  component: NuevaEdicionModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const esperar = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));
const congreso2026 = EVENTOS_MOCK.find((e) => e.id === 3);

export const DesdeEventoPasado = {
  args: {
    isOpen: true,
    origen: congreso2026,
    onClose: () => {},
    onSubmit: async (datos) => {
      await esperar();
      alert(`Payload enviado:\n${JSON.stringify(datos, null, 2)}`);
    },
  },
};

export const SemestreDuplicado = {
  args: {
    isOpen: true,
    origen: congreso2026,
    onClose: () => {},
    onSubmit: async () => {
      await esperar();
      const err = new Error('Conflict');
      err.response = {
        status: 409,
        data: { message: 'Ya existe una edición de este evento para el semestre 2026-2.', codigo: 'OPERACION_NO_PERMITIDA' },
      };
      throw err;
    },
  },
};
