import GenerarAgendaModal from './GenerarAgendaModal';
import {
  EVENTO_AGENDA_MOCK,
  PONENTES_AGENDA_MOCK,
  TIPOS_ACTIVIDAD_MOCK,
  actividadesAgendaMock,
  crearAgendaApiMock,
} from '../mocks/agendaGeneracionMock';
import { separarActividades } from '../agendaPublicacionUtils';

export default {
  title: 'Features/Agenda/GenerarAgendaModal',
  component: GenerarAgendaModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const { porProgramar } = separarActividades(actividadesAgendaMock());
const api = crearAgendaApiMock();

/**
 * Cuatro actividades por programar. «Calcular propuesta» ubica tres sin cruces y deja la hackatón (10 h) pendiente
 * con su motivo (Criterio 2). «Guardar propuesta» la aplica.
 */
export const ConActividadesPorProgramar = {
  args: {
    evento: EVENTO_AGENDA_MOCK,
    porProgramar,
    automaticas: 1,
    tiposActividad: TIPOS_ACTIVIDAD_MOCK,
    ponentes: PONENTES_AGENDA_MOCK,
    api,
    apiActividades: api,
    onCambios: () => {},
    onAsignarManual: () => {},
    onClose: () => {},
  },
};

/** Sin actividades por programar: se invita a agregarlas. */
export const SinActividades = {
  args: { ...ConActividadesPorProgramar.args, porProgramar: [], automaticas: 0 },
};
