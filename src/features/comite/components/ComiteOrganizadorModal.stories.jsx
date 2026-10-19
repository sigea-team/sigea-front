import ComiteOrganizadorModal from './ComiteOrganizadorModal';
import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';
import { crearComiteApiMock, comiteApiMockConError } from '../mocks/comiteMock';

export default {
  title: 'Features/Comite/ComiteOrganizadorModal',
  component: ComiteOrganizadorModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const evento = (id) => EVENTOS_MOCK.find((e) => e.id === id);

/**
 * Evento habilitado con comité: se puede agregar y retirar.
 * Prueba el documento 60345678 (ya es miembro → Criterio 2) o 9999 (no registrado).
 * Las personas disponibles para agregar: 88234567 (fue retirada; se puede volver a vincular).
 */
export const EventoHabilitado = {
  args: { isOpen: true, evento: evento(3), api: crearComiteApiMock(), onClose: () => {} },
};

/** Evento en configuración sin comité: estado vacío con invitación a agregar. */
export const ComiteVacio = {
  args: { isOpen: true, evento: evento(4), api: crearComiteApiMock(), onClose: () => {} },
};

/** Criterio 4: evento en ejecución, el comité es de solo lectura. */
export const EventoEnEjecucion = (() => {
  const enEjecucion = { ...evento(3), estado: 'en_ejecucion' };
  const eventos = EVENTOS_MOCK.map((e) => (e.id === 3 ? enEjecucion : e));
  return {
    args: { isOpen: true, evento: enEjecucion, api: crearComiteApiMock({ eventos }), onClose: () => {} },
  };
})();

/** Evento cerrado: solo consulta (activa «Mostrar retirados» para ver el historial). */
export const EventoCerrado = {
  args: { isOpen: true, evento: evento(2), api: crearComiteApiMock(), onClose: () => {} },
};

export const ErrorAlCargar = {
  args: { isOpen: true, evento: evento(3), api: comiteApiMockConError, onClose: () => {} },
};
