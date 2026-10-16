import GastoForm from './GastoForm';

export default {
  title: 'Features/Presupuesto/GastoForm',
  component: GastoForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const RUBROS = [
  { rubroId: 1, nombre: 'Transporte de conferencistas', presupuestado: 700000, ejecutado: 450000, disponible: 250000, porcentajeEjecucion: 64.29, excedido: false, cantidadGastos: 1 },
  { rubroId: 2, nombre: 'Refrigerios', presupuestado: 1125000, ejecutado: 400000, disponible: 725000, porcentajeEjecucion: 35.56, excedido: false, cantidadGastos: 1 },
  { rubroId: 4, nombre: 'Material impreso', presupuestado: 500000, ejecutado: 0, disponible: 500000, porcentajeEjecucion: 0, excedido: false, cantidadGastos: 0 },
];

const esperar = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

/** Criterio 1: elige el rubro, escribe el valor y registra. Prueba un valor mayor al disponible: solo se informa. */
export const Registro = {
  args: {
    rubros: RUBROS,
    onRegistrar: async () => {
      await esperar();
      return {};
    },
  },
};

/** Abierto desde la fila de un rubro: el rubro ya viene elegido. */
export const ConRubroElegido = {
  args: { ...Registro.args, rubroInicial: 1 },
};

/** Criterio 3: el backend rechaza el gasto y el error se muestra en el campo. */
export const ErrorDelServidor = {
  args: {
    rubros: RUBROS,
    onRegistrar: async () => {
      await esperar();
      const err = new Error('Conflicto');
      err.response = {
        status: 409,
        data: { message: 'No se pueden registrar gastos: el evento no tiene un presupuesto aprobado (HU-08).' },
      };
      throw err;
    },
  },
};
