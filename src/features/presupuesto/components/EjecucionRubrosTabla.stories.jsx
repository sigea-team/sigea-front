import EjecucionRubrosTabla from './EjecucionRubrosTabla';

export default {
  title: 'Features/Presupuesto/EjecucionRubrosTabla',
  component: EjecucionRubrosTabla,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const RUBROS = [
  { rubroId: 1, nombre: 'Transporte de conferencistas', presupuestado: 700000, ejecutado: 750000, disponible: -50000, porcentajeEjecucion: 107.14, excedido: true, cantidadGastos: 2 },
  { rubroId: 2, nombre: 'Refrigerios', presupuestado: 1125000, ejecutado: 400000, disponible: 725000, porcentajeEjecucion: 35.56, excedido: false, cantidadGastos: 1 },
  { rubroId: 4, nombre: 'Material impreso', presupuestado: 500000, ejecutado: 0, disponible: 500000, porcentajeEjecucion: 0, excedido: false, cantidadGastos: 0 },
  { rubroId: 5, nombre: 'Auditorio institucional', presupuestado: 0, ejecutado: 0, disponible: 0, porcentajeEjecucion: 0, excedido: false, cantidadGastos: 0 },
];

/** Criterio 1: acumulado, disponible y % por rubro. Criterio 2: «Transporte» se pasó de lo presupuestado y queda «Excedido». */
export const ConGastos = {
  args: {
    rubros: RUBROS,
    totalPresupuestado: 2325000,
    totalEjecutado: 1150000,
    onRegistrarGasto: () => {},
    onVerGastos: () => {},
  },
};

/** Criterio 4: sin gastos todos los rubros quedan en 0 %. */
export const SinGastos = {
  args: {
    ...ConGastos.args,
    rubros: RUBROS.map((r) => ({ ...r, ejecutado: 0, disponible: r.presupuestado, porcentajeEjecucion: 0, excedido: false, cantidadGastos: 0 })),
    totalEjecutado: 0,
  },
};

/** Solo lectura (evento cerrado): sin botón de registrar. */
export const SoloLectura = {
  args: { ...ConGastos.args, onRegistrarGasto: undefined },
};
