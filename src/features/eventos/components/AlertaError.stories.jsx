import AlertaError from './AlertaError';

export default {
  title: 'Features/Eventos/AlertaError',
  component: AlertaError,
  tags: ['autodocs'],
};

export const ConTitulo = {
  args: {
    titulo: 'No se pudo guardar el evento',
    children: 'Ya existe una edición de este evento para el semestre 2026-2.',
  },
};

export const SoloMensaje = {
  args: {
    children: 'No fue posible conectarse con el servidor. Verifica que el backend esté activo.',
  },
};
