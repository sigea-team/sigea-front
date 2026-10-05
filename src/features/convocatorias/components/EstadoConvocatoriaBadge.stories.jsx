import EstadoConvocatoriaBadge from './EstadoConvocatoriaBadge';

export default {
  title: 'Features/Convocatorias/EstadoConvocatoriaBadge',
  component: EstadoConvocatoriaBadge,
  tags: ['autodocs'],
};

export const Borrador = {
  args: {
    estado: 'BORRADOR',
    fechaCierre: '2026-12-31T23:59',
  },
};

export const Abierta = {
  args: {
    estado: 'ABIERTA',
    fechaCierre: '2029-12-31T23:59',
  },
};

export const CerradaVencida = {
  args: {
    estado: 'ABIERTA',
    fechaCierre: '2020-01-01T00:00',
  },
};
