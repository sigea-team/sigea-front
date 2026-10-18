import { expect, userEvent, waitFor, within } from 'storybook/test';
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

/** Prueba: carga las convocatorias publicadas y la búsqueda filtra por título. */
export const BuscarConvocatoria = {
  args: { api: crearConvocatoriasPublicasApiMock() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getAllByRole('article')).toHaveLength(3));
    await userEvent.type(canvas.getByLabelText(/buscar convocatoria/i), 'pósters');
    await waitFor(() => expect(canvas.getAllByRole('article')).toHaveLength(1));
    expect(canvas.getByText('Convocatoria de Pósters Científicos')).toBeInTheDocument();
  },
};

/** Llegando desde una notificación de la campana (?convocatoria=1): la tarjeta queda resaltada. */
export const DesdeNotificacion = {
  args: { api: crearConvocatoriasPublicasApiMock(), destacadaId: 1 },
  // Prueba: la convocatoria destacada se resalta y muestra sus requisitos desplegados.
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('#convocatoria-1')).not.toBeNull());
    const tarjeta = canvasElement.querySelector('#convocatoria-1');
    expect(tarjeta.className).toContain('border-[#a6192e]');
    expect(within(tarjeta).getByText('Requisitos para los autores')).toBeInTheDocument();
  },
};

/** Ninguna convocatoria publicada. */
export const SinConvocatorias = {
  args: { api: crearConvocatoriasPublicasApiMock([]) },
};

/** Error de conexión con el backend. */
export const ErrorDeConexion = {
  args: { api: convocatoriasPublicasApiConError },
};
