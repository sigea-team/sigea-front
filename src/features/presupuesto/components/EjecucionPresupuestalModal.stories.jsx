import EjecucionPresupuestalModal from './EjecucionPresupuestalModal';
import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';
import { crearEjecucionApiMock, ejecucionApiMockConError } from '../mocks/ejecucionMock';

export default {
  title: 'Features/Presupuesto/EjecucionPresupuestalModal',
  component: EjecucionPresupuestalModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const evento = (id) => EVENTOS_MOCK.find((e) => e.id === id);

/**
 * Criterio 1: evento habilitado con presupuesto aprobado ($ 2.500.000) y gastos.
 * Registra un gasto y mira cómo cambian el acumulado del rubro y el % del evento.
 * «Transporte de conferencistas» ya superó lo presupuestado: se permite y se marca como excedido.
 */
export const ConGastos = {
  args: {
    isOpen: true,
    evento: evento(3),
    api: crearEjecucionApiMock(),
    onClose: () => {},
  },
};

/** Criterio 4: presupuesto aprobado pero sin gastos: 0 % sin error. */
export const SinGastos = {
  args: {
    isOpen: true,
    evento: evento(3),
    api: crearEjecucionApiMock({ gastos: [] }),
    onClose: () => {},
  },
};

/** Lista de gastos con el soporte como enlace, como texto o sin soporte. */
export const GastosRegistrados = {
  args: {
    isOpen: true,
    evento: evento(3),
    pestanaInicial: 'gastos',
    api: crearEjecucionApiMock(),
    onClose: () => {},
  },
};

/** Sin presupuesto aprobado (HU-08): no se pueden registrar gastos y se ofrece ir a registrarlo. */
export const SinPresupuestoAprobado = {
  args: {
    isOpen: true,
    evento: evento(4),
    api: crearEjecucionApiMock(),
    onClose: () => {},
    onAbrirPresupuestoAprobado: () => alert('Abrir presupuesto aprobado'),
  },
};

/** Evento cerrado: solo lectura. */
export const EventoCerrado = {
  args: {
    isOpen: true,
    evento: evento(2),
    api: crearEjecucionApiMock(),
    onClose: () => {},
  },
};

export const ErrorAlCargar = {
  args: {
    isOpen: true,
    evento: evento(3),
    api: ejecucionApiMockConError,
    onClose: () => {},
  },
};
