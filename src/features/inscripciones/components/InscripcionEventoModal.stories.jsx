import InscripcionEventoModal from './InscripcionEventoModal';
import { CODIGO_QR_INSCRIPCION_MOCK, EVENTO_INSCRIPCION_MOCK, crearInscripcionApiMock } from '../mocks/inscripcionesMock';
import { crearAsistenciaApiMock } from '../../asistencia/mocks/asistenciaMock';

/** HU-24: API simulada del código QR (la imagen es ilustrativa). */
const apiAsistencia = crearAsistenciaApiMock({ codigo: CODIGO_QR_INSCRIPCION_MOCK });

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
    apiAsistencia,
    onClose: () => {},
  },
};

/**
 * Criterios 2 a 5: inscrito al evento y a las actividades 101 y 104. HU-24: se ve su código QR con las opciones de
 * descargarlo, copiarlo y reenviarlo. Se ven los cupos, una actividad llena (102),
 * una con cruce de horario (105 se cruza con 104, permite cambiar cancelando la anterior) y la opción de cancelar.
 */
export const InscritoConActividades = {
  args: {
    isOpen: true,
    evento: EVENTO_INSCRIPCION_MOCK,
    api: crearInscripcionApiMock({ inscrito: true, categoria: 'docente', actividadesInscritas: [101, 104] }),
    apiAsistencia,
    onClose: () => {},
  },
};

/** Evento cerrado: no se permite inscribirse, solo consultar. */
export const InscripcionesCerradas = {
  args: {
    isOpen: true,
    evento: { ...EVENTO_INSCRIPCION_MOCK, estado: 'cerrado' },
    api: crearInscripcionApiMock(),
    apiAsistencia,
    onClose: () => {},
  },
};

/** Evento publicado sin actividades programadas todavía. */
export const SinActividades = {
  args: {
    isOpen: true,
    evento: EVENTO_INSCRIPCION_MOCK,
    api: crearInscripcionApiMock({ inscrito: true, actividades: [] }),
    apiAsistencia,
    onClose: () => {},
  },
};
