import EventosPage from './EventosPage';
import { crearApiMock, apiMockConError } from '../features/eventos/mocks/eventosMock';
import { crearApiParametrosMock } from '../features/eventos/mocks/parametrosMock';

export default {
  title: 'Pages/EventosPage',
  component: EventosPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const usuario = { nombreCompleto: 'Admin SIGEA', rol: 'ADMIN' };

/** Flujo completo con API simulada: crear, editar, nueva edición, historial, eliminar y parámetros (HU-05). */
export const FlujoCompleto = {
  args: { api: crearApiMock(), apiParametros: crearApiParametrosMock(), usuarioProp: usuario },
};

export const SinEventos = {
  args: { api: crearApiMock([]), usuarioProp: usuario },
};

export const ErrorDeConexion = {
  args: { api: apiMockConError, usuarioProp: usuario },
};
