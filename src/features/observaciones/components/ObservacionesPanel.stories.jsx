import ObservacionesPanel from './ObservacionesPanel';
import ObservacionesPropuestaModal from './ObservacionesPropuestaModal';
import { crearObservacionesApiMock } from '../mocks/observacionesMock';

export default {
  title: 'Features/Observaciones/ObservacionesPanel',
  component: ObservacionesPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl p-6 bg-white">
        <Story />
      </div>
    ),
  ],
};

/**
 * Administrador con un ajuste atendido (v2) y otro pendiente: «Aprobar versión definitiva» está bloqueado
 * (Criterio 4). Prueba «Dar por resuelto» sobre el atendido y registrar observaciones nuevas.
 */
export const AdminConPendientes = {
  args: { propuestaId: 40, modo: 'admin', api: crearObservacionesApiMock() },
};

/** Todos los ajustes resueltos: el administrador puede aprobar la versión definitiva (Criterio 3). */
export const AdminListaParaAprobar = {
  args: {
    propuestaId: 40,
    modo: 'admin',
    api: crearObservacionesApiMock({
      observaciones: [
        {
          id: 60,
          descripcion: 'Ampliar la sección de metodología.',
          requiereAjuste: true,
          numeroVersion: 1,
          versionAtencionNumero: 2,
          resuelto: true,
          registradaPor: 'Elena Ruiz',
          registradaPorEvaluador: true,
          resueltaPor: 'Elena Ruiz',
          fecha: '2026-11-03T10:15:00',
          fechaResolucion: '2026-11-07T08:20:00',
        },
      ],
    }),
  },
};

/** Propuesta aceptada sin modificaciones: no lleva ajustes y su versión definitiva se aprueba directamente. */
export const AdminAceptadaSinObservaciones = {
  args: {
    propuestaId: 41,
    modo: 'admin',
    api: crearObservacionesApiMock({ estado: 'aprobada', versionActual: 1, observaciones: [] }),
  },
};

/** Evaluador: registra observaciones y resuelve; no ve la aprobación. */
export const Evaluador = {
  args: { propuestaId: 40, modo: 'evaluador', api: crearObservacionesApiMock() },
};

/** Autor: solo consulta y ve qué le falta. */
export const Autor = {
  args: { propuestaId: 40, modo: 'autor', api: crearObservacionesApiMock() },
};

/** Versión definitiva ya aprobada: todo queda en solo lectura. */
export const VersionDefinitiva = {
  args: {
    propuestaId: 40,
    modo: 'admin',
    api: crearObservacionesApiMock({ estado: 'aprobada', versionActual: 2, versionDefinitiva: 2, observaciones: [] }),
  },
};

export const ErrorAlCargar = {
  args: { propuestaId: 40, modo: 'admin', api: crearObservacionesApiMock({ falla: true }) },
};

/** El modal que abren el evaluador (Evaluaciones) y el autor (Mis propuestas). */
export const ModalAutor = {
  render: (args) => <ObservacionesPropuestaModal {...args} />,
  args: {
    propuesta: { id: 40, titulo: 'Analítica de aprendizaje en cursos de programación' },
    modo: 'autor',
    api: crearObservacionesApiMock(),
    onClose: () => {},
  },
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <Story />],
};
