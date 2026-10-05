import ParametrosEventoModal from './ParametrosEventoModal';
import { EVENTOS_MOCK } from '../mocks/eventosMock';
import { crearApiParametrosMock, apiParametrosConError } from '../mocks/parametrosMock';

export default {
  title: 'Features/Eventos/ParametrosEventoModal',
  component: ParametrosEventoModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const evento = (id) => EVENTOS_MOCK.find((e) => e.id === id);

/**
 * Evento habilitado con catálogos cargados. Prueba los tres criterios:
 * agregar "taller" (duplicado), eliminar "Taller" (en uso) o "Panel" (sin uso).
 */
export const EventoHabilitado = {
  args: { isOpen: true, evento: evento(3), api: crearApiParametrosMock(), onClose: () => {} },
};

export const LineasTematicas = {
  args: { isOpen: true, evento: evento(3), api: crearApiParametrosMock(), pestanaInicial: 'lineas', onClose: () => {} },
};

/** Evento nuevo, en configuración y sin parámetros todavía. */
export const SinParametros = {
  args: { isOpen: true, evento: evento(4), api: crearApiParametrosMock(), onClose: () => {} },
};

/** Evento cerrado: los catálogos se consultan pero no se pueden modificar. */
export const EventoCerradoSoloLectura = {
  args: { isOpen: true, evento: evento(2), api: crearApiParametrosMock(), onClose: () => {} },
};

export const ErrorAlCargar = {
  args: { isOpen: true, evento: evento(3), api: apiParametrosConError, onClose: () => {} },
};
