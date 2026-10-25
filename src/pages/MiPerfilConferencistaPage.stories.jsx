import MiPerfilConferencistaPage from './MiPerfilConferencistaPage';
import { crearConferencistasApiMock, conferencistasApiMockConError } from '../features/conferencistas/mocks/conferencistasMock';

export default {
  title: 'Pages/MiPerfilConferencistaPage',
  component: MiPerfilConferencistaPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const usuario = { nombreCompleto: 'Ana María Pérez Gómez', correo: 'ana.perez@unal.edu.co', roles: ['PARTICIPANTE'], modoIngreso: 'CONFERENCISTA' };

/** Conferencista con trayectoria: la edita y el cambio se ve en la página pública de sus eventos. */
export const ConPerfil = {
  args: { api: crearConferencistasApiMock(), usuarioProp: usuario },
};

/** Usuario que ingresó como conferencista, pero el organizador aún no lo ha registrado. */
export const AunNoRegistrado = {
  args: {
    api: crearConferencistasApiMock({ correoSesion: 'jorge.villamizar@ufps.edu.co' }),
    usuarioProp: { ...usuario, nombreCompleto: 'Jorge Enrique Villamizar Ortega', correo: 'jorge.villamizar@ufps.edu.co' },
  },
};

export const ErrorDeConexion = {
  args: {
    api: {
      ...conferencistasApiMockConError,
      async obtenerMiPerfilConferencista() {
        const err = new Error('Network Error');
        err.request = {};
        throw err;
      },
    },
    usuarioProp: usuario,
  },
};
