import EventosPage from './EventosPage';
import { EVENTOS_MOCK, crearApiMock, crearApisEnlazadas, apiMockConError } from '../features/eventos/mocks/eventosMock';
import { crearApiTiposEventoMock, apiTiposEventoConError } from '../features/eventos/mocks/tiposEventoMock';
import { crearApiParametrosMock } from '../features/eventos/mocks/parametrosMock';
import { crearComiteApiMock } from '../features/comite/mocks/comiteMock';
import { crearConferencistasApiMock } from '../features/conferencistas/mocks/conferencistasMock';
import { crearPresupuestoApiMock } from '../features/presupuesto/mocks/presupuestoMock';
import { crearPresupuestoAprobadoApiMock } from '../features/presupuesto/mocks/presupuestoAprobadoMock';
import { crearEjecucionApiMock } from '../features/presupuesto/mocks/ejecucionMock';
import { crearEncuestasApiMock } from '../features/encuestas/mocks/encuestasMock';
import { crearMemoria, crearMemoriaApiMock, enlazarConEventos } from '../features/memoria/mocks/memoriaMock';

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
    apiEncuestas: crearEncuestasApiMock(),
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

/**
 * HU-28: el congreso 2024 ya está en la memoria histórica (etiqueta «Memoria histórica»; su menú solo ofrece consultar
 * la memoria y las ediciones). El congreso 2025 está cerrado y se puede cerrar formalmente desde «Más» → «Cierre
 * formal»: tiene pendientes que hay que confirmar y, al cerrar, pasa a la memoria.
 */
export const MemoriaHistorica = {
  args: (() => {
    const base = EVENTOS_MOCK.find((e) => e.id === 1);
    const apiMemoria = crearMemoriaApiMock({
      memorias: [crearMemoria(base, { memoriaId: 1, fechaConsolidacion: '2024-10-20T10:00:00' })],
      eventos: EVENTOS_MOCK,
    });
    return {
      api: enlazarConEventos(crearApiMock(), apiMemoria),
      apiTiposEvento: crearApiTiposEventoMock(),
      apiMemoria,
      usuarioProp: usuario,
    };
  })(),
};

/** Con la autorización especial MEMORIA_HISTORICA_ELIMINAR, el evento de la memoria se puede eliminar (Criterio 3). */
export const MemoriaHistoricaConAutorizacionEspecial = {
  args: {
    ...MemoriaHistorica.args,
    usuarioProp: { ...usuario, permisos: ['MEMORIA_HISTORICA_ELIMINAR'] },
  },
};
