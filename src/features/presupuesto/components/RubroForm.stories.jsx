import RubroForm from './RubroForm';

export default {
  title: 'Features/Presupuesto/RubroForm',
  component: RubroForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const RUBROS = [{ id: 1, nombre: 'Refrigerios', activo: true }];

const esperar = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Criterio 3: envía el formulario vacío, con valor -5000 o con «Refrigerios» (repetido)
 * para ver los mensajes de error. Con datos válidos, el formulario se limpia.
 */
export const Predeterminado = {
  args: {
    rubros: RUBROS,
    onAgregar: async () => {
      await esperar();
      return {};
    },
  },
};

/** El backend rechaza el rubro: el error de cada campo se muestra junto a él. */
export const ErrorDelBackend = {
  args: {
    rubros: [],
    onAgregar: async () => {
      await esperar();
      const err = new Error('Bad Request');
      err.response = {
        status: 400,
        data: {
          message: 'Los datos enviados no cumplen con los requisitos o políticas exigidas.',
          codigo: 'VALIDACION_FALLIDA',
          erroresValidacion: { valorUnitarioProyectado: 'El valor estimado del rubro no puede ser negativo.' },
        },
      };
      throw err;
    },
  },
};

/** El presupuesto ya no se puede modificar: mensaje general. */
export const PresupuestoBloqueado = {
  args: {
    rubros: [],
    onAgregar: async () => {
      await esperar();
      const err = new Error('Conflict');
      err.response = {
        status: 409,
        data: {
          message: "El evento 'Congreso' ya tiene un presupuesto aprobado; el presupuesto preliminar no puede modificarse.",
          codigo: 'OPERACION_NO_PERMITIDA',
        },
      };
      throw err;
    },
  },
};
