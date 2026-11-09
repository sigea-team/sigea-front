import ActividadPorProgramarModal from './ActividadPorProgramarModal';
import { PONENTES_AGENDA_MOCK, TIPOS_ACTIVIDAD_MOCK, actividadesAgendaMock } from '../mocks/agendaGeneracionMock';

export default {
  title: 'Features/Agenda/ActividadPorProgramarModal',
  component: ActividadPorProgramarModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const base = {
  tiposActividad: TIPOS_ACTIVIDAD_MOCK,
  ponentes: PONENTES_AGENDA_MOCK,
  onSubmit: async () => {},
  onClose: () => {},
};

/** Registro: nombre, tipo y duración son obligatorios (Criterio 1). */
export const Nueva = { args: { ...base } };

/** Modificación de una actividad que sigue por programar. */
export const Modificar = { args: { ...base, actividad: actividadesAgendaMock()[2] } };

/** El backend rechaza la duración: se muestra el error en el campo. */
export const ErrorDelBackend = {
  args: {
    ...base,
    onSubmit: async () => {
      const e = new Error('400');
      e.response = {
        status: 400,
        data: { message: 'Datos inválidos.', erroresValidacion: { duracionMinutos: 'La duración mínima es de 5 minutos.' } },
      };
      throw e;
    },
  },
};
