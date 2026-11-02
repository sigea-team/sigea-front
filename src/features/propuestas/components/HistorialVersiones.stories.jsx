import HistorialVersiones from './HistorialVersiones';
import { VERSIONES_MOCK } from '../mocks/propuestasMock';

export default {
  title: 'Features/Propuestas/HistorialVersiones',
  component: HistorialVersiones,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl p-6 bg-[#f7f7f8]">
        <Story />
      </div>
    ),
  ],
};

const descargar = async (doc) => console.log('Descargar', doc.nombreOriginal);

/** Criterio 4: dos versiones con fecha, autor del cambio, nota y documentos. */
export const DosVersiones = {
  args: { versiones: VERSIONES_MOCK[50], onDescargar: descargar },
};

/** Criterio 5: versión marcada como definitiva. */
export const VersionDefinitiva = {
  args: { versiones: VERSIONES_MOCK[51], onDescargar: descargar },
};

export const SinVersiones = {
  args: { versiones: [], onDescargar: descargar },
};

/** La descarga falla: se muestra el aviso sin cerrar el historial. */
export const ErrorAlDescargar = {
  args: {
    versiones: VERSIONES_MOCK[50],
    onDescargar: async () => {
      throw new Error('Network Error');
    },
  },
};
