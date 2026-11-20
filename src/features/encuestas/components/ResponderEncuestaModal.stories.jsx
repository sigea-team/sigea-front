import ResponderEncuestaModal from './ResponderEncuestaModal';
import { crearEncuestasApiMock } from '../mocks/encuestasMock';

export default {
  title: 'Features/Encuestas/ResponderEncuestaModal',
  component: ResponderEncuestaModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {}, onRespondida: () => {} },
};

/** Encuesta anónima del taller con preguntas de escala, opción y texto (Criterio 2). Prueba enviar sin la obligatoria. */
export const PorResponder = {
  args: { encuestaId: 7, api: crearEncuestasApiMock() },
};

/** El participante ya respondió: se le informa y no se envía de nuevo (CU-22, flujo alterno). */
export const YaRespondida = {
  args: { encuestaId: 7, api: crearEncuestasApiMock({ respondidas: [7] }) },
};

/** No registró asistencia a la actividad: el backend responde 403 ENCUESTA_NO_HABILITADA (Criterio 3). */
export const SinAsistencia = {
  args: { encuestaId: 7, api: crearEncuestasApiMock({ asistio: [] }) },
};
