import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AgendaPage from './AgendaPage';
import { actividadService } from '../api/actividadService';
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
            apiActividades={actividadService}
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
            apiActividades={actividadService}
            apiEventos={crearEventosApiMock()}
            apiSalas={crearSalasApiMock()}
          />
        }
      />
    </Routes>
  </MemoryRouter>
);
