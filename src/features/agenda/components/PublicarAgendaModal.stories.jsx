import PublicarAgendaModal from './PublicarAgendaModal';
import { EVENTO_AGENDA_MOCK, actividadesAgendaMock, crearAgendaApiMock } from '../mocks/agendaGeneracionMock';
import { ESTADO_POR_PROGRAMAR } from '../agendaPublicacionUtils';

export default {
  title: 'Features/Agenda/PublicarAgendaModal',
  component: PublicarAgendaModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const completas = actividadesAgendaMock().filter((a) => a.estado !== ESTADO_POR_PROGRAMAR);

/** Criterio 4: hay actividades sin sala u horario; no se permite publicar. */
export const Incompleta = {
  args: { evento: EVENTO_AGENDA_MOCK, api: crearAgendaApiMock(), onClose: () => {} },
};

/** Criterio 3: completa y sin cruces; «Publicar agenda» la deja visible por día. */
export const ListaParaPublicar = {
  args: { evento: EVENTO_AGENDA_MOCK, api: crearAgendaApiMock({ actividades: completas }), onClose: () => {} },
};

/** Ya publicada: se puede volver a publicar y abrir la vista pública. */
export const Publicada = {
  args: { evento: EVENTO_AGENDA_MOCK, api: crearAgendaApiMock({ actividades: completas, publicada: true }), onClose: () => {} },
};

/** Dos actividades en la misma sala a la misma hora: el cruce impide publicar. */
export const ConCruces = {
  args: {
    evento: EVENTO_AGENDA_MOCK,
    api: crearAgendaApiMock({
      actividades: [...completas, { ...completas[0], id: 99, nombre: 'Charla duplicada', horaInicio: '08:30', horaFin: '09:30' }],
    }),
    onClose: () => {},
  },
};

export const ErrorAlRevisar = {
  args: { evento: EVENTO_AGENDA_MOCK, api: crearAgendaApiMock({ fallarValidacion: true }), onClose: () => {} },
};
