import EventosPage from './EventosPage';
import { crearApiMock, crearApisEnlazadas, apiMockConError } from '../features/eventos/mocks/eventosMock';
import { crearApiTiposEventoMock, apiTiposEventoConError } from '../features/eventos/mocks/tiposEventoMock';
import { crearApiParametrosMock } from '../features/eventos/mocks/parametrosMock';
import { crearComiteApiMock } from '../features/comite/mocks/comiteMock';
import { crearConferencistasApiMock } from '../features/conferencistas/mocks/conferencistasMock';
import { crearPresupuestoApiMock } from '../features/presupuesto/mocks/presupuestoMock';
import { crearPresupuestoAprobadoApiMock } from '../features/presupuesto/mocks/presupuestoAprobadoMock';
import { crearEjecucionApiMock } from '../features/presupuesto/mocks/ejecucionMock';

export default {
  title: 'Pages/EventosPage',
  component: EventosPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const usuario = { nombreCompleto: 'Admin SIGEA', rol: 'ADMIN' };

// Eventos y tipos de evento enlazados: la tabla muestra el nombre actual de cada tipo,
// y un tipo que usa algún evento no se puede eliminar.
const enlazadas = crearApisEnlazadas();

export const FlujoCompleto = {
  args: { 
    api: enlazadas.api,
    apiTiposEvento: enlazadas.apiTipos,
    apiParametros: crearApiParametrosMock(),
    apiComite: crearComiteApiMock(),
    apiConferencistas: crearConferencistasApiMock(),
    apiPresupuesto: crearPresupuestoApiMock(),
    apiPresupuestoAprobado: crearPresupuestoAprobadoApiMock(),
    apiEjecucion: crearEjecucionApiMock(),
    usuarioProp: usuario 
  },
};

export const SinEventos = {
  args: { api: crearApiMock([]), apiTiposEvento: crearApiTiposEventoMock(), usuarioProp: usuario },
};

export const ErrorDeConexion = {
  args: { api: apiMockConError, apiTiposEvento: apiTiposEventoConError, usuarioProp: usuario },
};

/** Sin tipos de evento registrados: el formulario invita a crearlos desde «Tipos de evento». */
export const SinTiposDeEvento = {
  args: { api: crearApiMock([]), apiTiposEvento: crearApiTiposEventoMock({ tipos: [] }), usuarioProp: usuario },
};
