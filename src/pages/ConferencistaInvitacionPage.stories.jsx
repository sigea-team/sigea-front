import ConferencistaInvitacionPage from './ConferencistaInvitacionPage';
import { crearConferencistasApiMock } from '../features/conferencistas/mocks/conferencistasMock';

export default {
  title: 'Pages/ConferencistaInvitacionPage',
  component: ConferencistaInvitacionPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

/** Criterios 1 y 2: el invitado registra sus datos y trayectoria desde el enlace del correo. */
export const InvitacionVigente = { args: { api: crearConferencistasApiMock(), token: 'token-vigente' } };

/** Participante con cuenta en SIGEA: el formulario se precarga con sus datos. */
export const ParticipanteRegistrado = { args: { api: crearConferencistasApiMock(), token: 'token-participante' } };

export const EnlaceVencido = { args: { api: crearConferencistasApiMock(), token: 'token-vencido' } };

export const EnlaceYaUtilizado = { args: { api: crearConferencistasApiMock(), token: 'token-usado' } };

export const EnlaceNoValido = { args: { api: crearConferencistasApiMock(), token: 'no-existe' } };
