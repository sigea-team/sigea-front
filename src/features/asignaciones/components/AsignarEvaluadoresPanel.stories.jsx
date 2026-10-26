import AsignarEvaluadoresPanel from './AsignarEvaluadoresPanel';
import { crearAsignacionesApiMock, asignacionesApiMockConError } from '../mocks/asignacionesMock';

export default {
  title: 'Features/Asignaciones/AsignarEvaluadoresPanel',
  component: AsignarEvaluadoresPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-4xl p-6 bg-white">
        <Story />
      </div>
    ),
  ],
};

/**
 * Propuesta recibida sin evaluadores (Criterios 1 y 2).
 * - Ana Pérez: sin conflicto.
 * - Luis Gómez y Sofía Mora: comparten afiliación con un autor → se pide confirmar.
 * - Carlos Ruiz: es autor de la propuesta → no se puede marcar.
 */
export const PropuestaSinAsignar = {
  args: {
    propuesta: { propuestaId: 40, titulo: 'Analítica de datos en la educación superior', estado: 'recibida' },
    api: crearAsignacionesApiMock(),
    onCambio: () => {},
  },
};

/** Propuesta en evaluación con dos evaluadores: uno se puede reasignar y otro ya completó (Criterio 3). */
export const PropuestaEnEvaluacion = {
  args: {
    propuesta: { propuestaId: 41, titulo: 'Gemelos digitales para laboratorios de redes', estado: 'en_evaluacion' },
    api: crearAsignacionesApiMock(),
    onCambio: () => {},
  },
};

/** Propuesta aprobada: solo consulta, sin asignar ni reasignar. */
export const PropuestaAprobada = {
  args: {
    propuesta: { propuestaId: 42, titulo: 'Ciberseguridad en entornos universitarios', estado: 'aprobada' },
    api: crearAsignacionesApiMock(),
    onCambio: () => {},
  },
};

export const ErrorAlCargar = {
  args: {
    propuesta: { propuestaId: 40, titulo: 'Analítica de datos en la educación superior', estado: 'recibida' },
    api: asignacionesApiMockConError,
    onCambio: () => {},
  },
};
