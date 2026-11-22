import EliminacionHistoricaModal from './EliminacionHistoricaModal';
import { crearMemoriaApiMock } from '../mocks/memoriaMock';

export default {
  title: 'Features/Memoria/EliminacionHistoricaModal',
  component: EliminacionHistoricaModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {}, onEliminado: () => {} },
};

/** Exige el nombre exacto del evento y un motivo de al menos 20 caracteres (Criterio 3). */
export const Formulario = {
  args: { evento: { id: 5, nombre: 'Encuentro de Semilleros de Investigación' }, api: crearMemoriaApiMock() },
};

/** Evento base de otras ediciones: el backend lo rechaza con 409 ELIMINACION_NO_PERMITIDA. */
export const EventoBaseConEdiciones = {
  args: { evento: { id: 3, nombre: 'Semana de Ingeniería de Sistemas 2025' }, api: crearMemoriaApiMock() },
};
