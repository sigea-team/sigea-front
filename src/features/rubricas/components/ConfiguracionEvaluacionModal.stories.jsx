import ConfiguracionEvaluacionModal from './ConfiguracionEvaluacionModal';
import { RUBRICA_MOCK, crearRubricaApiMock, rubricaApiMockConError } from '../mocks/rubricaMock';
import { crearComiteEvaluadorApiMock, comiteEvaluadorApiMockConError } from '../../comiteEvaluador/mocks/comiteEvaluadorMock';

export default {
  title: 'Features/Rubricas/ConfiguracionEvaluacionModal',
  component: ConfiguracionEvaluacionModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const convocatoria = { id: 10, titulo: 'Convocatoria de Ponencias 2026', eventoNombre: 'Congreso SIGEA 2026' };

/**
 * Criterios 1 y 2: convocatoria sin rúbrica. Prueba guardar con pesos que no suman 100%
 * o usa «Repartir pesos en partes iguales».
 */
export const SinRubrica = {
  args: {
    isOpen: true,
    convocatoria,
    apiRubricas: crearRubricaApiMock(),
    apiComite: crearComiteEvaluadorApiMock(),
    onClose: () => {},
  },
};

/** Rúbrica existente sin calificaciones: se modifica directamente. */
export const ConRubrica = {
  args: {
    isOpen: true,
    convocatoria,
    apiRubricas: crearRubricaApiMock({ rubrica: RUBRICA_MOCK }),
    apiComite: crearComiteEvaluadorApiMock(),
    onClose: () => {},
  },
};

/** Criterio 4: la rúbrica ya tiene calificaciones; al guardar se pide confirmación. */
export const RubricaEnUso = {
  args: {
    isOpen: true,
    convocatoria,
    apiRubricas: crearRubricaApiMock({
      rubrica: RUBRICA_MOCK,
      enUso: { calificaciones: 6, asignaciones: 3, propuestas: 2 },
    }),
    apiComite: crearComiteEvaluadorApiMock(),
    onClose: () => {},
  },
};

/** HU-18: la convocatoria ya tiene propuestas clasificadas; la rúbrica se muestra solo para consulta. */
export const RubricaBloqueada = {
  args: {
    isOpen: true,
    convocatoria,
    apiRubricas: crearRubricaApiMock({
      rubrica: RUBRICA_MOCK,
      enUso: { calificaciones: 6, asignaciones: 3, propuestas: 2 },
      clasificadas: 2,
    }),
    apiComite: crearComiteEvaluadorApiMock(),
    onClose: () => {},
  },
};

/**
 * Criterios 3 y 4: comité evaluador. Prueba ana.perez@ufps.edu.co (ya está → duplicado),
 * laura.mendoza@ufps.edu.co (registrada) o un correo nuevo (pide los datos de la persona).
 */
export const ComiteEvaluador = {
  args: {
    isOpen: true,
    convocatoria,
    pestanaInicial: 'comite',
    apiRubricas: crearRubricaApiMock({ rubrica: RUBRICA_MOCK }),
    apiComite: crearComiteEvaluadorApiMock(),
    onClose: () => {},
  },
};

export const ErrorAlCargar = {
  args: {
    isOpen: true,
    convocatoria,
    apiRubricas: rubricaApiMockConError,
    apiComite: comiteEvaluadorApiMockConError,
    onClose: () => {},
  },
};
