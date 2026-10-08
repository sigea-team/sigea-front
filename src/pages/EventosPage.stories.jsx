import EventosPage from './EventosPage';
import { crearApiMock, apiMockConError } from '../features/eventos/mocks/eventosMock';
import { crearApiParametrosMock } from '../features/eventos/mocks/parametrosMock';
import { crearComiteApiMock } from '../features/comite/mocks/comiteMock';

export default {
  title: 'Pages/EventosPage',
  component: EventosPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const usuario = { nombreCompleto: 'Admin SIGEA', rol: 'ADMIN' };

export const FlujoCompleto = {
  args: { 
    api: crearApiMock(), 
    apiParametros: crearApiParametrosMock(),
    apiComite: crearComiteApiMock(),
    usuarioProp: usuario 
  },
};

export const SinEventos = {
  args: { api: crearApiMock([]), usuarioProp: usuario },
};

export const ErrorDeConexion = {
  args: { api: apiMockConError, usuarioProp: usuario },
};
