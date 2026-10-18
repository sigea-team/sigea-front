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
};
