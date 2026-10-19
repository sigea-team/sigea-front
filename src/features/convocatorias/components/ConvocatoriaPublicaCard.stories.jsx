import ConvocatoriaPublicaCard from './ConvocatoriaPublicaCard';
import { CONVOCATORIAS_PUBLICAS_MOCK } from '../mocks/convocatoriasPublicasMock';

export default {
  title: 'Features/Convocatorias/ConvocatoriaPublicaCard',
  component: ConvocatoriaPublicaCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl p-6 bg-[#f7f7f8]">
        <Story />
      </div>
    ),
  ],
};

/** Recibiendo propuestas: muestra la acción para postularse. */
export const Abierta = {
  args: { convocatoria: CONVOCATORIAS_PUBLICAS_MOCK[0] },
};

/** Publicada pero el periodo de recepción aún no inicia. */
export const Proxima = {
  args: { convocatoria: CONVOCATORIAS_PUBLICAS_MOCK[1] },
};

/** Publicada con la fecha límite ya cumplida. */
export const Cerrada = {
  args: { convocatoria: CONVOCATORIAS_PUBLICAS_MOCK[2] },
};

/** Resaltada al llegar desde una notificación de la campana. */
export const Destacada = {
  args: { convocatoria: CONVOCATORIAS_PUBLICAS_MOCK[0], destacada: true, conSesion: true },
};
