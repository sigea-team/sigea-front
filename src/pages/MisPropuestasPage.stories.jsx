import MisPropuestasPage from './MisPropuestasPage';
import { crearPropuestasApiMock } from '../features/propuestas/mocks/propuestasMock';
import { crearObservacionesApiMock } from '../features/observaciones/mocks/observacionesMock';

export default {
  title: 'Pages/MisPropuestasPage',
  component: MisPropuestasPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const usuario = {
  nombreCompleto: 'Carlos Andrés Gómez Pérez',
  correo: 'carlos.gomez@ufps.edu.co',
  roles: ['PARTICIPANTE'],
  modoIngreso: 'PONENTE',
};

/** Una propuesta editable (versión 2) y otra bloqueada por versión definitiva (Criterios 3, 4 y 5). */
export const ConPropuestas = {
  args: { api: crearPropuestasApiMock(), apiObservaciones: crearObservacionesApiMock({ observaciones: [] }), usuarioProp: usuario },
};

/**
 * HU-19: propuesta aprobada con ajustes y un ajuste por atender. «Modificar» sube la versión con los ajustes y
 * «Observaciones» muestra qué pidió el evaluador.
 */
export const ConAjustesPendientes = {
  args: {
    api: crearPropuestasApiMock({
      misPropuestas: [
        {
          propuesta: {
            id: 52,
            convocatoriaId: 10,
            convocatoriaTitulo: 'Convocatoria de Ponencias 2026',
            titulo: 'Analítica de aprendizaje en cursos de programación',
            resumen: 'Uso de analítica de aprendizaje para detectar estudiantes en riesgo.',
            palabrasClave: 'analítica, programación',
            estado: 'ajustes',
            fechaEnvio: '2026-10-12T08:30:00',
            autores: [],
          },
          versionActual: 2,
          totalVersiones: 2,
          tieneVersionDefinitiva: false,
          edicionAutorizada: false,
          convocatoriaEstado: 'CERRADA',
          convocatoriaFechaCierre: '2026-10-15T23:59:00',
        },
      ],
    }),
    apiObservaciones: crearObservacionesApiMock({ estado: 'ajustes' }),
    usuarioProp: usuario,
  },
};

export const SinPropuestas = {
  args: { api: crearPropuestasApiMock({ misPropuestas: [] }), usuarioProp: usuario },
};

export const ErrorDeConexion = {
  args: {
    api: {
      ...crearPropuestasApiMock(),
      async listarMisPropuestas() {
        const err = new Error('Network Error');
        err.request = {};
        throw err;
      },
    },
    usuarioProp: usuario,
  },
};
