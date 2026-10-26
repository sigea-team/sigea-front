import PropuestasEvaluadoresModal from './PropuestasEvaluadoresModal';
import {
  CONVOCATORIA_MOCK,
  crearAsignacionesApiMock,
  asignacionesApiMockConError,
} from '../mocks/asignacionesMock';

export default {
  title: 'Features/Asignaciones/PropuestasEvaluadoresModal',
  component: PropuestasEvaluadoresModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

/**
 * Convocatoria con tres propuestas: una sin evaluadores, una en evaluación y una aprobada.
 * Elige «Asignar» para abrir el panel de asignación de la propuesta.
 */
export const ConPropuestas = {
  args: { isOpen: true, convocatoria: CONVOCATORIA_MOCK, api: crearAsignacionesApiMock(), onClose: () => {} },
};

/** Convocatoria publicada que todavía no recibe propuestas. */
export const SinPropuestas = {
  args: {
    isOpen: true,
    convocatoria: { ...CONVOCATORIA_MOCK, id: 99, titulo: 'Convocatoria de Pósters 2026' },
    api: crearAsignacionesApiMock(),
    onClose: () => {},
  },
};

export const ErrorAlCargar = {
  args: { isOpen: true, convocatoria: CONVOCATORIA_MOCK, api: asignacionesApiMockConError, onClose: () => {} },
};
