import EncuestasEventoModal from './EncuestasEventoModal';
import { crearEncuestasApiMock } from '../mocks/encuestasMock';

export default {
  title: 'Features/Encuestas/EncuestasEventoModal',
  component: EncuestasEventoModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {} },
};

const evento = { id: 1, nombre: 'Semana de Ingeniería de Sistemas', estado: 'en_ejecucion' };

/**
 * Una encuesta publicada del taller (anónima, con 4 respuestas) y la general del evento en borrador.
 * Prueba «Resultados» (Criterio 4), «Editar» y «Publicar» sobre el borrador (Criterio 1) y «Nueva encuesta».
 */
export const ConEncuestas = {
  args: { evento, api: crearEncuestasApiMock() },
};

/** Evento sin encuestas: el organizador crea la primera. */
export const SinEncuestas = {
  args: { evento, api: crearEncuestasApiMock({ encuestas: [], respuestas: [] }) },
};

/** Evento en configuración: se preparan borradores, pero «Publicar» queda bloqueado. */
export const EventoEnConfiguracion = {
  args: {
    evento: { ...evento, estado: 'en_configuracion' },
    api: crearEncuestasApiMock({ estadoEvento: 'en_configuracion', respuestas: [] }),
  },
};

/** Encuesta identificada con respuestas: en los resultados se ve quién respondió qué (Criterio 2). */
export const IdentificadaConRespuestas = {
  args: {
    evento,
    api: (() => {
      const api = crearEncuestasApiMock();
      const [taller] = api._estado.encuestas;
      taller.anonima = false;
      api._estado.respuestas.forEach((r, i) => {
        r.nombre = ['María Pérez', 'Juan Gómez', 'Laura Ruiz', 'Diego Rojas'][i];
      });
      return api;
    })(),
  },
};

/** El backend no responde: se muestra el error con «Reintentar». */
export const ErrorDeConexion = {
  args: { evento, api: crearEncuestasApiMock({ falla: true }) },
};
