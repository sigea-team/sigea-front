import SalasModal from './SalasModal';
import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';
import { crearSalasApiMock } from '../mocks/salasMock';

export default {
  title: 'Features/Salas/SalasModal',
  component: SalasModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const evento = (id) => EVENTOS_MOCK.find((e) => e.id === id);

/**
 * Evento habilitado con salas físicas y virtuales, disponibilidad de ponentes y actividades programadas (HU-20).
 */
export const EventoConSalasYDisponibilidad = {
  args: {
    isOpen: true,
    evento: evento(3) || { id: 3, nombre: 'Congreso Internacional de TIC 2026' },
    api: crearSalasApiMock(),
    onClose: () => {},
  },
};

/**
 * Evento en configuración sin salas registradas (estado vacío con llamada a registrar primera sala).
 */
export const SinSalas = {
  args: {
    isOpen: true,
    evento: evento(4) || { id: 4, nombre: 'Simposio Regional de Software' },
    api: crearSalasApiMock({ salasIniciales: [], actividadesIniciales: [] }),
    onClose: () => {},
  },
};

