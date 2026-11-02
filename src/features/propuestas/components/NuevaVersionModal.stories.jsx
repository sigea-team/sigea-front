import NuevaVersionModal from './NuevaVersionModal';
import { MIS_PROPUESTAS_MOCK, crearPropuestasApiMock } from '../mocks/propuestasMock';

export default {
  title: 'Features/Propuestas/NuevaVersionModal',
  component: NuevaVersionModal,
  parameters: { layout: 'fullscreen' },
};

/** Criterio 3: el autor cambia datos o reemplaza documentos y se crea la versión 3. */
export const ModificarPropuesta = {
  args: {
    mia: MIS_PROPUESTAS_MOCK[0],
    api: crearPropuestasApiMock(),
    onClose: () => console.log('Cerrar'),
    onCreada: (r) => console.log('Versión creada', r),
  },
};

/** Criterio 5: propuesta en versión definitiva con autorización del administrador pendiente de usar. */
export const ConAutorizacion = {
  args: {
    mia: { ...MIS_PROPUESTAS_MOCK[0], edicionAutorizada: true, tieneVersionDefinitiva: true },
    api: crearPropuestasApiMock(),
    onClose: () => console.log('Cerrar'),
  },
};
