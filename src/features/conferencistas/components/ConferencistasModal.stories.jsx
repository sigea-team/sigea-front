import ConferencistasModal from './ConferencistasModal';
import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';
import { crearConferencistasApiMock, conferencistasApiMockConError } from '../mocks/conferencistasMock';

export default {
  title: 'Features/Conferencistas/ConferencistasModal',
  component: ConferencistasModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const evento = (id) => EVENTOS_MOCK.find((e) => e.id === id);

/**
 * Evento habilitado con conferencistas e invitaciones pendientes (una vigente y una vencida).
 * «Agregar conferencista» muestra la lista de registrados para vincular; para uno nuevo se invita con
 * nombre y correo. Prueba invitar carlos.rojas@uis.edu.co (ya registrado → ofrece vincularlo).
 */
export const EventoHabilitado = {
  args: { isOpen: true, evento: evento(3), api: crearConferencistasApiMock(), onClose: () => {} },
};

/** Evento en configuración sin conferencistas: estado vacío con invitación a registrar. */
export const SinConferencistas = {
  args: { isOpen: true, evento: evento(4), api: crearConferencistasApiMock(), onClose: () => {} },
};

/** Evento cerrado: no se asocian ni retiran conferencistas, pero la trayectoria sí se edita (Criterio 4). */
export const EventoCerrado = {
  args: { isOpen: true, evento: evento(2), api: crearConferencistasApiMock(), onClose: () => {} },
};

export const ErrorAlCargar = {
  args: { isOpen: true, evento: evento(3), api: conferencistasApiMockConError, onClose: () => {} },
};
