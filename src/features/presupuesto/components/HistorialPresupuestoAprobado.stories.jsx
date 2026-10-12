import HistorialPresupuestoAprobado from './HistorialPresupuestoAprobado';
import { PRESUPUESTOS_APROBADOS_MOCK } from '../mocks/presupuestoAprobadoMock';

export default {
  title: 'Features/Presupuesto/HistorialPresupuestoAprobado',
  component: HistorialPresupuestoAprobado,
  tags: ['autodocs'],
};

/**
 * Criterio 2: Visualización de versiones conservadas con montos, fechas, justificaciones y soportes.
 */
export const ConVersiones = {
  args: {
    versiones: PRESUPUESTOS_APROBADOS_MOCK,
    editable: true,
    onNuevaActualizacion: () => alert('Registrar nueva actualización'),
  },
};

/**
 * Estado vacío cuando no hay historial.
 */
export const SinVersiones = {
  args: {
    versiones: [],
    editable: true,
  },
};
