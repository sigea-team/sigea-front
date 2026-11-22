import IndicadoresMemoria from './IndicadoresMemoria';
import { indicadoresEjemplo } from '../mocks/memoriaMock';

export default {
  title: 'Features/Memoria/IndicadoresMemoria',
  component: IndicadoresMemoria,
  tags: ['autodocs'],
};

/** Los 16 indicadores calculados al cierre; los principales como tarjetas. */
export const Completos = { args: { indicadores: indicadoresEjemplo() } };

/** Sin indicadores. */
export const Vacios = { args: { indicadores: [] } };
