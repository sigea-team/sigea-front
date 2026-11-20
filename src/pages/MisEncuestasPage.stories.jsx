import MisEncuestasPage from './MisEncuestasPage';
import { crearEncuestasApiMock, encuestasEjemplo } from '../features/encuestas/mocks/encuestasMock';

export default {
  title: 'Pages/MisEncuestasPage',
  component: MisEncuestasPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const usuario = {
  nombreCompleto: 'Ana Pérez',
  correo: 'ana.perez@ufps.edu.co',
  roles: ['PARTICIPANTE'],
  modoIngreso: 'ASISTENTE',
};

const publicadas = () => encuestasEjemplo().map((e) => ({ ...e, estado: 'publicada', fechaPublicacion: '2026-11-20T12:00:00' }));

/** Dos encuestas por responder de eventos y actividades a los que asistió (Criterio 1). */
export const PorResponder = {
  args: { api: crearEncuestasApiMock({ encuestas: publicadas() }), usuarioProp: usuario },
};

/** Una ya respondida y otra pendiente. */
export const UnaRespondida = {
  args: { api: crearEncuestasApiMock({ encuestas: publicadas(), respondidas: [8] }), usuarioProp: usuario },
};

/** No asistió a nada: no tiene encuestas (Criterio 3). */
export const SinEncuestas = {
  args: { api: crearEncuestasApiMock({ asistio: [] }), usuarioProp: usuario },
};
