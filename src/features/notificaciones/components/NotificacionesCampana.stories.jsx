import { expect, userEvent, waitFor, within } from 'storybook/test';
import NotificacionesCampana from './NotificacionesCampana';
import { crearNotificacionesApiMock, notificacionesApiConError } from '../mocks/notificacionesMock';

export default {
  title: 'Features/Notificaciones/NotificacionesCampana',
  component: NotificacionesCampana,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex justify-end p-4 pb-[520px] bg-white">
        <Story />
      </div>
    ),
  ],
};

/** Campana con notificaciones sin leer (contador visible). */
export const ConNoLeidas = {
  args: { api: crearNotificacionesApiMock() },
};

/** Panel abierto: clic en una notificación la marca como leída. */
export const PanelAbierto = {
  args: { api: crearNotificacionesApiMock(), abiertaInicial: true },
};

/** Prueba: muestra el contador y "Marcar todas como leídas" lo deja en cero. */
export const MarcarTodasComoLeidas = {
  args: { api: crearNotificacionesApiMock(), abiertaInicial: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('2 sin leer')).toBeInTheDocument());
    await userEvent.click(canvas.getByRole('button', { name: /marcar todas como leídas/i }));
    await waitFor(() => expect(canvas.getByText('Estás al día')).toBeInTheDocument());
  },
};

/** Sin notificaciones. */
export const Vacia = {
  args: { api: crearNotificacionesApiMock([]), abiertaInicial: true },
};

/** Error de conexión con el backend. */
export const ErrorDeConexion = {
  args: { api: notificacionesApiConError, abiertaInicial: true },
};
