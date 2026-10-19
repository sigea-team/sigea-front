import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import FechaCierreModal from './FechaCierreModal';

export default {
  title: 'Features/Convocatorias/FechaCierreModal',
  component: FechaCierreModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const enDias = (dias) => {
  const d = new Date(Date.now() + dias * 86400000);
  d.setSeconds(0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const convocatoria = {
  id: 1,
  titulo: 'Convocatoria de Ponencias y Artículos de Investigación 2026',
  fechaApertura: enDias(-10),
  fechaCierre: enDias(5),
  estado: 'publicada',
};

/** Guardado exitoso (simulado). */
export const Default = {
  args: {
    convocatoria,
    onClose: () => {},
    onSubmit: () => new Promise((resolve) => setTimeout(resolve, 600)),
  },
};

/** El backend rechaza el cambio (por ejemplo, la convocatoria expiró mientras se editaba). */
export const ErrorDelBackend = {
  args: {
    convocatoria,
    onClose: () => {},
    onSubmit: () =>
      Promise.reject({
        response: { data: { message: 'La convocatoria ya expiró. No es posible modificar su fecha límite.' } },
      }),
  },
  // Prueba: con una fecha válida, el mensaje del backend se muestra dentro del modal.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fireEvent.change(canvas.getByLabelText(/nueva fecha y hora límite/i), { target: { value: enDias(10) } });
    await userEvent.click(canvas.getByRole('button', { name: /guardar y notificar/i }));
    await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('La convocatoria ya expiró'));
  },
};

/** Prueba: si la nueva fecha es igual a la actual, se valida antes de llamar al backend. */
export const FechaIgualALaActual = {
  args: { convocatoria, onClose: () => {}, onSubmit: () => Promise.resolve() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /guardar y notificar/i }));
    await waitFor(() => expect(canvas.getByText('La nueva fecha límite es igual a la actual.')).toBeInTheDocument());
  },
};
