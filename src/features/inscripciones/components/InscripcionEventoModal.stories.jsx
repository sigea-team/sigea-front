import InscripcionEventoModal from './InscripcionEventoModal';
import { EVENTO_INSCRIPCION_MOCK, crearInscripcionApiMock } from '../mocks/inscripcionesMock';

export default {
  title: 'Features/Inscripciones/InscripcionEventoModal',
  component: InscripcionEventoModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

/**
 * Criterio 1: el participante aún no está inscrito; elige su categoría para inscribirse al evento.
 */
export const SinInscripcion = {
  args: {
    isOpen: true,
    evento: EVENTO_INSCRIPCION_MOCK,
    api: crearInscripcionApiMock(),
    onClose: () => {},
  },
};

/**
 * Criterios 2 a 5: inscrito al evento y a las actividades 101 y 104. Se ven los cupos, una actividad llena (102),
 * una con cruce de horario (105 se cruza con 104, permite cambiar cancelando la anterior) y la opción de cancelar.
 */
export const InscritoConActividades = {
  args: {
    isOpen: true,
    evento: EVENTO_INSCRIPCION_MOCK,
    api: crearInscripcionApiMock({ inscrito: true, categoria: 'docente', actividadesInscritas: [101, 104] }),
    onClose: () => {},
  },
};

/** Evento cerrado: no se permite inscribirse, solo consultar. */
export const InscripcionesCerradas = {
  args: {
    isOpen: true,
    evento: { ...EVENTO_INSCRIPCION_MOCK, estado: 'cerrado' },
    api: crearInscripcionApiMock(),
    onClose: () => {},
  },
};

/** Evento publicado sin actividades programadas todavía. */
export const SinActividades = {
  args: {
    isOpen: true,
    evento: EVENTO_INSCRIPCION_MOCK,
    api: crearInscripcionApiMock({ inscrito: true, actividades: [] }),
    onClose: () => {},
  },
};
