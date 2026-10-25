import ConferencistasPublicosPage from './ConferencistasPublicosPage';
import { crearConferencistasApiMock, conferencistasApiMockConError } from '../features/conferencistas/mocks/conferencistasMock';

export default {
  title: 'Pages/ConferencistasPublicosPage',
  component: ConferencistasPublicosPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

/** Criterio 4: evento habilitado con conferencistas y su trayectoria vigente. */
export const EventoPublicado = { args: { api: crearConferencistasApiMock(), eventoId: 3 } };

/** Evento en configuración: todavía no tiene vista pública. */
export const EventoNoPublicado = { args: { api: crearConferencistasApiMock(), eventoId: 4 } };

/** Evento publicado sin conferencistas confirmados. */
export const SinConferencistas = { args: { api: crearConferencistasApiMock({ participaciones: [] }), eventoId: 3 } };

export const ErrorDeConexion = { args: { api: conferencistasApiMockConError, eventoId: 3 } };
