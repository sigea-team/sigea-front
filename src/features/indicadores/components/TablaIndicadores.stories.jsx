import TablaIndicadores from './TablaIndicadores';
import TarjetasIndicadores from './TarjetasIndicadores';
import { crearIndicadoresApiMock } from '../mocks/indicadoresMock';

const api = crearIndicadoresApiMock({ ms: 0 });

export default {
  title: 'Features/Indicadores/TablaIndicadores',
  component: TablaIndicadores,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-4xl p-6 bg-surface-page"><Story /></div>],
  render: (args, { loaded }) => (
    <div className="space-y-6">
      <TarjetasIndicadores indicadores={loaded.respuesta.indicadores} />
      <TablaIndicadores respuesta={loaded.respuesta} />
    </div>
  ),
};

/** Criterio 1: todos los grupos con datos. */
export const Completa = { loaders: [async () => ({ respuesta: await api.generarIndicadores(7) })] };

/** Criterio 2: grupos sin datos e indicadores no calculables con su motivo. */
export const Parcial = { loaders: [async () => ({ respuesta: await api.generarIndicadores(9) })] };

/** Criterio 2: evento sin información. */
export const SinDatos = { loaders: [async () => ({ respuesta: await api.generarIndicadores(8) })] };
