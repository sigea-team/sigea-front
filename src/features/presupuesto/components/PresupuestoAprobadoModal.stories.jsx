import PresupuestoAprobadoModal from './PresupuestoAprobadoModal';
import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';
import {
  crearPresupuestoAprobadoApiMock,
  presupuestoAprobadoApiMockConError,
} from '../mocks/presupuestoAprobadoMock';

export default {
  title: 'Features/Presupuesto/PresupuestoAprobadoModal',
  component: PresupuestoAprobadoModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const evento = (id) => EVENTOS_MOCK.find((e) => e.id === id);

/**
 * Criterio 1: Registro formal por primera vez.
 * Evento habilitado con presupuesto preliminar de referencia ($ 13.500.000).
 * Permite registrar el monto oficial aprobado (que puede diferir) y adjuntar soporte.
 */
export const RegistroInicialConPreliminar = {
  args: {
    isOpen: true,
    evento: evento(3),
    api: crearPresupuestoAprobadoApiMock({ aprobados: [] }),
    onClose: () => {},
  },
};

/**
 * Versión Oficial Vigente: Evento que ya tiene un presupuesto aprobado oficial registrado.
 * Muestra el monto autorizado, comparativa vs preliminar y botón para ver el soporte o actualizar.
 */
export const VersionOficialVigente = {
  args: {
    isOpen: true,
    evento: evento(1),
    api: crearPresupuestoAprobadoApiMock(),
    onClose: () => {},
  },
};

/**
 * Criterio 2: Historial de versiones y cambios conservados.
 * Muestra las versiones anteriores archivadas junto con sus montos, fechas, justificaciones y soportes.
 */
export const HistorialDeVersiones = {
  args: {
    isOpen: true,
    evento: evento(1),
    pestanaInicial: 'historial',
    api: crearPresupuestoAprobadoApiMock(),
    onClose: () => {},
  },
};

/**
 * Criterio 1 (validación de precondición): Evento sin presupuesto preliminar registrado.
 * Advierte que se requiere primero registrar un presupuesto preliminar base.
 */
export const SinPresupuestoPreliminar = {
  args: {
    isOpen: true,
    evento: evento(4),
    api: crearPresupuestoAprobadoApiMock(),
    onClose: () => {},
    onAbrirPreliminar: () => alert('Navegar a Presupuesto Preliminar'),
  },
};

/**
 * Error al conectar con el servidor.
 */
export const ErrorAlCargar = {
  args: {
    isOpen: true,
    evento: evento(3),
    api: presupuestoAprobadoApiMockConError,
    onClose: () => {},
  },
};
