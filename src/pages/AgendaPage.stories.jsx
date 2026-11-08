import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AgendaPage from './AgendaPage';
import { crearActividadesApiMock } from '../features/agenda/mocks/agendaMock';
import { crearEventosApiMock } from '../features/eventos/mocks/eventosMock';
import { crearSalasApiMock } from '../features/salas/mocks/salasMock';

export default {
  title: 'Pages/AgendaPage',
  component: AgendaPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export const VistaPrincipal = () => (
  <MemoryRouter initialEntries={['/agenda']}>
    <Routes>
      <Route
        path="/agenda"
        element={
          <AgendaPage
            apiActividades={crearActividadesApiMock()}
            apiEventos={crearEventosApiMock()}
            apiSalas={crearSalasApiMock()}
          />
        }
      />
    </Routes>
  </MemoryRouter>
);

export const ConEventoSeleccionado = () => (
  <MemoryRouter initialEntries={['/eventos/3/agenda']}>
    <Routes>
      <Route
        path="/eventos/:eventoId/agenda"
        element={
          <AgendaPage
            apiActividades={crearActividadesApiMock()}
            apiEventos={crearEventosApiMock()}
            apiSalas={crearSalasApiMock()}
          />
        }
      />
    </Routes>
  </MemoryRouter>
);

/** El backend no responde: se muestra el error con «Reintentar», no una agenda vacía. */
export const ErrorAlCargar = () => (
  <MemoryRouter initialEntries={['/eventos/3/agenda']}>
    <Routes>
      <Route
        path="/eventos/:eventoId/agenda"
        element={
          <AgendaPage
            apiActividades={{
              listarActividades: () =>
                Promise.reject(new Error('No fue posible cargar la agenda del evento.')),
            }}
            apiEventos={crearEventosApiMock()}
            apiSalas={crearSalasApiMock()}
          />
        }
      />
    </Routes>
  </MemoryRouter>
);
