import AgendaGeneracionPanel from './AgendaGeneracionPanel';
import {
  EVENTO_AGENDA_MOCK,
  PONENTES_AGENDA_MOCK,
  TIPOS_ACTIVIDAD_MOCK,
  actividadesAgendaMock,
  crearAgendaApiMock,
} from '../mocks/agendaGeneracionMock';
import { ESTADO_POR_PROGRAMAR } from '../agendaPublicacionUtils';

export default {
  title: 'Features/Agenda/AgendaGeneracionPanel',
  component: AgendaGeneracionPanel,
  tags: ['autodocs'],
};

const api = crearAgendaApiMock();

/** Agenda sin publicar con actividades por programar: abre «Generar agenda» y «Publicar agenda». */
export const SinPublicar = {
  args: {
    evento: EVENTO_AGENDA_MOCK,
    actividades: actividadesAgendaMock(),
    tiposActividad: TIPOS_ACTIVIDAD_MOCK,
    ponentes: PONENTES_AGENDA_MOCK,
    api,
    apiActividades: api,
    onCambios: () => {},
    onAsignarManual: () => {},
  },
};

const completas = actividadesAgendaMock().filter((a) => a.estado !== ESTADO_POR_PROGRAMAR);

/** Agenda publicada: muestra el estado y el enlace a la vista pública. */
export const Publicada = {
  args: {
    ...SinPublicar.args,
    actividades: completas,
    api: crearAgendaApiMock({ actividades: completas, publicada: true }),
  },
};
