import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SalasPage from './SalasPage';
import { crearSalasApiMock } from '../features/salas/mocks/salasMock';
import { crearEventosApiMock } from '../features/eventos/mocks/eventosMock';

export default {
  title: 'Pages/SalasPage',
  component: SalasPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export const VistaPrincipal = () => (
  <MemoryRouter initialEntries={['/salas']}>
    <Routes>
      <Route
        path="/salas"
        element={
          <SalasPage
            api={crearSalasApiMock()}
            apiEventos={crearEventosApiMock()}
          />
        }
      />
    </Routes>
  </MemoryRouter>
);

