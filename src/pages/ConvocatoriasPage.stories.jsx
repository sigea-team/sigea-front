import { expect, userEvent, within } from 'storybook/test';
import ConvocatoriasPage from './ConvocatoriasPage';
import { crearAsignacionesApiMock } from '../features/asignaciones/mocks/asignacionesMock';

export default {
  title: 'Pages/ConvocatoriasPage',
  component: ConvocatoriasPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const usuario = { nombreCompleto: 'Admin SIGEA', rol: 'ADMIN' };

const CONVOCATORIAS = [
  {
    id: 10,
    eventoNombre: 'Congreso de Ingeniería de Sistemas',
    titulo: 'Convocatoria de Ponencias 2026',
    descripcion: 'Recepción de ponencias y artículos.',
    fechaApertura: '2026-09-01T08:00',
    fechaCierre: '2027-11-30T23:59',
    estado: 'PUBLICADA',
  },
  {
    id: 11,
    eventoNombre: 'Congreso de Ingeniería de Sistemas',
    titulo: 'Convocatoria de Talleres 2026',
    descripcion: 'Todavía en configuración.',
    fechaApertura: '2026-12-01T08:00',
    fechaCierre: '2027-01-30T23:59',
    estado: 'BORRADOR',
  },
];

const apiConvocatorias = { listarConvocatorias: () => Promise.resolve(CONVOCATORIAS) };
const apiEventos = { listarEventos: () => Promise.resolve([]) };

/** Vista del administrador con una convocatoria publicada y otra en borrador. */
export const Administrador = {
  args: {
    api: apiConvocatorias,
    apiEventos,
    apiAsignaciones: crearAsignacionesApiMock(),
    usuarioProp: usuario,
  },
};

/**
 * HU-16: desde la página real, «Propuestas y evaluadores» abre el modal de la convocatoria elegida
 * y permite llegar al panel de asignación de una propuesta.
 */
export const AbrirAsignacionDeEvaluadores = {
  args: {
    api: apiConvocatorias,
    apiEventos,
    apiAsignaciones: crearAsignacionesApiMock({ demora: 0 }),
    usuarioProp: usuario,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const boton = await canvas.findByRole('button', { name: 'Propuestas y evaluadores' });
    await expect(canvas.getByRole('button', { name: /está en borrador/i })).toBeDisabled();

    await userEvent.click(boton);
    const dialogo = await canvas.findByRole('dialog');
    await expect(within(dialogo).getByText('Convocatoria de Ponencias 2026')).toBeInTheDocument();
    await within(dialogo).findByText('Analítica de datos en la educación superior');

    await userEvent.click(within(dialogo).getAllByRole('button', { name: 'Asignar' })[0]);
    await within(dialogo).findByText('Comité evaluador de la convocatoria');
  },
};
