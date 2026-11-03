import HistorialVersionesModal from './HistorialVersionesModal';
import { crearPropuestasApiMock } from '../mocks/propuestasMock';

export default {
  title: 'Features/Propuestas/HistorialVersionesModal',
  component: HistorialVersionesModal,
  parameters: { layout: 'fullscreen' },
};

const cerrar = () => console.log('Cerrar');

/** Criterio 4: el autor o el evaluador asignado consulta las versiones. */
export const Autor = {
  args: {
    propuesta: { id: 50, titulo: 'Analítica de aprendizaje con IA en la educación superior', estado: 'recibida' },
    api: crearPropuestasApiMock(),
    onClose: cerrar,
  },
};

/** Criterio 5: el administrador ve una propuesta en versión definitiva y puede autorizar su modificación. */
export const AdminVersionDefinitiva = {
  args: {
    propuesta: { id: 51, titulo: 'Gemelos digitales para laboratorios de redes', estado: 'aprobada' },
    api: crearPropuestasApiMock(),
    esAdmin: true,
    onClose: cerrar,
  },
};

/** Sin acceso o sin conexión: se muestra el motivo y la opción de reintentar. */
export const ErrorDeCarga = {
  args: {
    propuesta: { id: 50, titulo: 'Analítica de aprendizaje con IA en la educación superior' },
    api: {
      ...crearPropuestasApiMock(),
      async listarVersiones() {
        const err = new Error('Forbidden');
        err.response = { status: 403, data: { codigo: 'ACCESO_DENEGADO', message: 'No tiene acceso a las versiones de esta propuesta.' } };
        throw err;
      },
    },
    onClose: cerrar,
  },
};
