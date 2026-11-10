import ClasificacionPropuestasModal from './ClasificacionPropuestasModal';
import {
  CONVOCATORIA_CLASIFICACION_MOCK,
  clasificacionApiMockConError,
  crearClasificacionApiMock,
} from '../mocks/clasificacionMock';
import { crearObservacionesApiMock } from '../../observaciones/mocks/observacionesMock';

export default {
  title: 'Features/Clasificacion/ClasificacionPropuestasModal',
  component: ClasificacionPropuestasModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

/**
 * Convocatoria con seis propuestas: una aceptada, una ajustada manualmente, dos evaluadas sin clasificar y dos con
 * la evaluación incompleta. Prueba «Clasificar todas», «Editar umbrales» y el ajuste manual desde el detalle.
 */
export const ConPropuestas = {
  args: {
    isOpen: true,
    convocatoria: CONVOCATORIA_CLASIFICACION_MOCK,
    api: crearClasificacionApiMock(),
    // HU-19: el detalle de una propuesta aceptada muestra observaciones y la aprobación de la versión definitiva.
    apiObservaciones: crearObservacionesApiMock(),
    onClose: () => {},
  },
};

/** Umbrales más exigentes (8,5 / 6): la propuesta aceptada con 8,6 sigue aceptada; las demás bajan de grupo. */
export const UmbralesExigentes = {
  args: {
    isOpen: true,
    convocatoria: CONVOCATORIA_CLASIFICACION_MOCK,
    api: crearClasificacionApiMock({ umbrales: { umbralAceptacion: 8.5, umbralAjustes: 6 } }),
    onClose: () => {},
  },
};

export const ErrorAlCargar = {
  args: {
    isOpen: true,
    convocatoria: CONVOCATORIA_CLASIFICACION_MOCK,
    api: clasificacionApiMockConError,
    onClose: () => {},
  },
};
