import EstadoAsignacionBadge from './EstadoAsignacionBadge';

export default {
  title: 'Features/Asignaciones/EstadoAsignacionBadge',
  component: EstadoAsignacionBadge,
  tags: ['autodocs'],
};

export const Pendiente = { args: { estado: 'pendiente' } };
export const EnProceso = { args: { estado: 'en_proceso' } };
export const Completada = { args: { estado: 'completada' } };
