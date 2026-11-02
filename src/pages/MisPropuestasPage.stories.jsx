import MisPropuestasPage from './MisPropuestasPage';
import { crearPropuestasApiMock } from '../features/propuestas/mocks/propuestasMock';

export default {
  title: 'Pages/MisPropuestasPage',
  component: MisPropuestasPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const usuario = {
  nombreCompleto: 'Carlos Andrés Gómez Pérez',
  correo: 'carlos.gomez@ufps.edu.co',
  roles: ['PARTICIPANTE'],
  modoIngreso: 'PONENTE',
};

/** Una propuesta editable (versión 2) y otra bloqueada por versión definitiva (Criterios 3, 4 y 5). */
export const ConPropuestas = {
  args: { api: crearPropuestasApiMock(), usuarioProp: usuario },
};

export const SinPropuestas = {
  args: { api: crearPropuestasApiMock({ misPropuestas: [] }), usuarioProp: usuario },
};

export const ErrorDeConexion = {
  args: {
    api: {
      ...crearPropuestasApiMock(),
      async listarMisPropuestas() {
        const err = new Error('Network Error');
        err.request = {};
        throw err;
      },
    },
    usuarioProp: usuario,
  },
};
