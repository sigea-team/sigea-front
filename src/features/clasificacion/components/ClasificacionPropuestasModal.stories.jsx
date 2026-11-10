import ClasificacionPropuestasModal from './ClasificacionPropuestasModal';
import {
  CONVOCATORIA_CLASIFICACION_MOCK,
  clasificacionApiMockConError,
  crearClasificacionApiMock,
} from '../mocks/clasificacionMock';

export default {
  title: 'Features/Clasificacion/ClasificacionPropuestasModal',
  component: ClasificacionPropuestasModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

/**
 * Convocatoria con seis propuestas: una aceptada, una ajustada manualmente, dos evaluadas sin clasificar y dos con
 * la evaluación incompleta. Como ya hay clasificadas, «Editar umbrales» está desactivado. Prueba «Clasificar
 * todas» y el ajuste manual desde el detalle.
 */
export const ConPropuestas = {
  args: {
    isOpen: true,
    convocatoria: CONVOCATORIA_CLASIFICACION_MOCK,
    api: crearClasificacionApiMock(),
    onClose: () => {},
  },
};

/** Ninguna propuesta clasificada todavía: los umbrales se pueden editar hasta presionar «Clasificar todas». */
export const SinClasificar = {
  args: {
    isOpen: true,
    convocatoria: CONVOCATORIA_CLASIFICACION_MOCK,
    api: crearClasificacionApiMock({ sinClasificar: true }),
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
