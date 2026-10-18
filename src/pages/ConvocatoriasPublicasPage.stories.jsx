import ConvocatoriasPublicasPage from './ConvocatoriasPublicasPage';
import {
  convocatoriasPublicasApiConError,
  crearConvocatoriasPublicasApiMock,
} from '../features/convocatorias/mocks/convocatoriasPublicasMock';

export default {
  title: 'Pages/ConvocatoriasPublicasPage',
  component: ConvocatoriasPublicasPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

/** Convocatorias publicadas: abiertas, próximas y cerradas. */
export const ConConvocatorias = {
  args: { api: crearConvocatoriasPublicasApiMock() },
};

/** Llegando desde una notificación de la campana (?convocatoria=1): la tarjeta queda resaltada. */
export const DesdeNotificacion = {
  args: { api: crearConvocatoriasPublicasApiMock(), destacadaId: 1 },
};

/** Ninguna convocatoria publicada. */
export const SinConvocatorias = {
  args: { api: crearConvocatoriasPublicasApiMock([]) },
};

/** Error de conexión con el backend. */
export const ErrorDeConexion = {
  args: { api: convocatoriasPublicasApiConError },
};
