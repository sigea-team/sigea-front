import PresupuestoPreliminarModal from './PresupuestoPreliminarModal';
import { EVENTOS_MOCK } from '../../eventos/mocks/eventosMock';
import { crearPresupuestoApiMock, presupuestoApiMockConError } from '../mocks/presupuestoMock';

export default {
  title: 'Features/Presupuesto/PresupuestoPreliminarModal',
  component: PresupuestoPreliminarModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

const evento = (id) => EVENTOS_MOCK.find((e) => e.id === id);

/**
 * Evento habilitado con rubros: se puede agregar, editar y eliminar (Criterios 1 y 2).
 * Prueba el Criterio 3 con un nombre vacío, un valor vacío o un valor negativo (-5000).
 * «Refrigerios» ya existe: sirve para ver el aviso de nombre repetido.
 */
export const EventoHabilitado = {
  args: { isOpen: true, evento: evento(3), api: crearPresupuestoApiMock(), onClose: () => {} },
};

/** Evento en configuración sin rubros: estado vacío con total en $ 0. */
export const PresupuestoVacio = {
  args: { isOpen: true, evento: evento(4), api: crearPresupuestoApiMock(), onClose: () => {} },
};

/** Abre directamente la pestaña del historial (Criterio 2). */
export const Historial = {
  args: { isOpen: true, evento: evento(3), api: crearPresupuestoApiMock(), pestanaInicial: 'historial', onClose: () => {} },
};

/** Con presupuesto aprobado (HU-08): solo lectura. */
export const PresupuestoAprobado = {
  args: { isOpen: true, evento: evento(3), api: crearPresupuestoApiMock({ aprobados: [3] }), onClose: () => {} },
};

/** Evento cerrado: solo lectura. */
export const EventoCerrado = {
  args: { isOpen: true, evento: evento(2), api: crearPresupuestoApiMock(), onClose: () => {} },
};

export const ErrorAlCargar = {
  args: { isOpen: true, evento: evento(3), api: presupuestoApiMockConError, onClose: () => {} },
};
