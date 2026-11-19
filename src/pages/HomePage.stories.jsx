import HomePage from './HomePage';
import { crearConvocatoriasPublicasApiMock } from '../features/convocatorias/mocks/convocatoriasPublicasMock';
import { EVENTOS_BASE_INSTITUCIONALES } from '../features/home/homeUtils';

export default {
  title: 'Pages/HomePage',
  component: HomePage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

/** Vista pública por defecto con eventos base y convocatorias en vivo simuladas. */
export const Default = {
  args: {
    api: crearConvocatoriasPublicasApiMock(),
    eventosIniciales: EVENTOS_BASE_INSTITUCIONALES,
  },
};

/** Vista pública cuando no existen convocatorias activas en el sistema. */
export const SinConvocatorias = {
  args: {
    api: crearConvocatoriasPublicasApiMock([]),
    eventosIniciales: EVENTOS_BASE_INSTITUCIONALES,
  },
};

/** Vista pública ante error de conexión con el backend: conserva los eventos institucionales base. */
export const ErrorDeConexion = {
  args: {
    api: {
      listarConvocatoriasPublicadas: async () => {
        throw new Error('No se pudo establecer conexión con el servidor.');
      },
    },
    eventosIniciales: EVENTOS_BASE_INSTITUCIONALES,
  },
};
