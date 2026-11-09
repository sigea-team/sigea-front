import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AgendaPage from './AgendaPage';
import { actividadService } from '../api/actividadService';
import { crearApiMock as crearEventosApiMock } from '../features/eventos/mocks/eventosMock';
import { crearSalasApiMock } from '../features/salas/mocks/salasMock';
import {
  EVENTO_AGENDA_MOCK,
  PONENTES_AGENDA_MOCK,
  SALAS_AGENDA_MOCK,
  TIPOS_ACTIVIDAD_MOCK,
  crearAgendaApiMock,
} from '../features/agenda/mocks/agendaGeneracionMock';

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

/**
 * HU-22: agenda con actividades por programar. Prueba «Generar agenda» (propuesta, guardado y pendientes con su
 * motivo), «Asignar a mano», «Devolver a por programar» y «Publicar agenda».
 */
export const GeneracionYPublicacion = () => {
  const api = crearAgendaApiMock();
  return (
    <MemoryRouter initialEntries={['/eventos/1/agenda']}>
      <Routes>
        <Route
          path="/eventos/:eventoId/agenda"
          element={
            <AgendaPage
              apiActividades={api}
              apiAgenda={api}
              apiEventos={{ listarEventos: async () => [EVENTO_AGENDA_MOCK] }}
              apiSalas={{ listarSalas: async () => SALAS_AGENDA_MOCK }}
              apiConferencistas={{ listarConferencistas: async () => PONENTES_AGENDA_MOCK }}
              apiParametros={{ listar: async () => TIPOS_ACTIVIDAD_MOCK }}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  );
};
