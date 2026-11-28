import TablaInforme from './TablaInforme';
import { informeSimulado } from '../mocks/informesMock';
import { normalizarInforme } from '../informeUtils';

export default {
  title: 'Informes/TablaInforme',
  component: TablaInforme,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-7xl p-6"><Story /></div>],
};

const informe = (parametros, opciones) => normalizarInforme(informeSimulado(parametros, opciones));

/** Actividades con fecha, horas, porcentaje y totales de inscritos y asistentes. */
export const Actividades = {
  args: { informe: informe({ tipo: 'ACTIVIDADES', eventoId: 7 }) },
};

/** Presupuesto: valores en pesos con totales. */
export const Presupuesto = {
  args: { informe: informe({ tipo: 'PRESUPUESTO', eventoId: 7 }) },
};

/** Indicadores por evento (mismo cálculo del dashboard de HU-29). */
export const Indicadores = {
  args: { informe: informe({ tipo: 'INDICADORES', eventoId: 7 }) },
};

/** Más de 50 registros: la vista previa se pagina; el archivo los lleva todos. */
export const Paginado = {
  args: { informe: informe({ tipo: 'INSCRIPCIONES', eventoId: 7 }, { muchos: true }) },
};
