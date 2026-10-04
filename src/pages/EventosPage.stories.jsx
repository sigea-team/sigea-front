import EventosPage from './EventosPage';
import { crearApiMock, apiMockConError } from '../features/eventos/mocks/eventosMock';
import { crearComiteApiMock } from '../features/comite/mocks/comiteMock';

export default {
  title: 'Pages/EventosPage',
  component: EventosPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const usuario = { nombreCompleto: 'Admin SIGEA', rol: 'ADMIN' };

/** Flujo completo con API simulada: crear, editar, nueva edición, historial, comité organizador y eliminar. */
export const FlujoCompleto = {
  args: { api: crearApiMock(), apiComite: crearComiteApiMock(), usuarioProp: usuario },
};

export const SinEventos = {
  args: { api: crearApiMock([]), usuarioProp: usuario },
};

export const ErrorDeConexion = {
  args: { api: apiMockConError, usuarioProp: usuario },
};
