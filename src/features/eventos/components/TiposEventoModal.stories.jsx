import TiposEventoModal from './TiposEventoModal';
import { crearApiTiposEventoMock, apiTiposEventoConError } from '../mocks/tiposEventoMock';

export default {
  title: 'Features/Eventos/TiposEventoModal',
  component: TiposEventoModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const cerrar = (lista) => alert(`Catálogo al cerrar: ${(lista || []).map((t) => t.nombre).join(', ')}`);

/** Catálogo con tipos; «Congreso» está en uso por 3 eventos y no se puede eliminar. */
export const ConTipos = {
  args: {
    isOpen: true,
    api: crearApiTiposEventoMock({ contarUso: (id) => (id === 1 ? 3 : 0) }),
    onClose: cerrar,
  },
};

export const CatalogoVacio = {
  args: { isOpen: true, api: crearApiTiposEventoMock({ tipos: [] }), onClose: cerrar },
};

export const ErrorAlCargar = {
  args: { isOpen: true, api: apiTiposEventoConError, onClose: () => {} },
};
