import BarraEjecucion from './BarraEjecucion';

export default {
  title: 'Features/Presupuesto/BarraEjecucion',
  component: BarraEjecucion,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

/** Criterio 4: sin gastos la ejecución es 0 %. */
export const SinEjecucion = {
  args: { porcentaje: 0, etiqueta: 'Ejecución del evento' },
};

export const EjecucionParcial = {
  args: { porcentaje: 46, etiqueta: 'Ejecución del evento' },
};

/** Lo ejecutado superó lo presupuestado: la barra se muestra llena y el texto conserva el valor real. */
export const Excedido = {
  args: { porcentaje: 107.14, excedido: true, etiqueta: 'Ejecución de Transporte' },
};

/** Versión gruesa para el resumen del evento. */
export const Grande = {
  args: { porcentaje: 62.5, etiqueta: 'Ejecución del evento', tamano: 'lg' },
};
