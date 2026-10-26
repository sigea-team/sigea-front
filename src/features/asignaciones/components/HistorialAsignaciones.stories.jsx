import HistorialAsignaciones from './HistorialAsignaciones';

export default {
  title: 'Features/Asignaciones/HistorialAsignaciones',
  component: HistorialAsignaciones,
  tags: ['autodocs'],
};

const MOVIMIENTOS = [
  {
    historialId: 3,
    asignacionId: 12,
    propuestaId: 41,
    tipoOperacion: 'reasignacion',
    evaluadorAnteriorNombre: 'Sofía Mora',
    evaluadorNuevoNombre: 'Ana Pérez',
    conflictoAdvertido: false,
    motivo: 'La evaluadora inicial no tiene disponibilidad',
    realizadoPor: 'María Rodríguez',
    fechaHora: '2026-10-21T10:00:00',
  },
  {
    historialId: 2,
    asignacionId: 13,
    propuestaId: 41,
    tipoOperacion: 'asignacion',
    evaluadorAnteriorNombre: null,
    evaluadorNuevoNombre: 'Luis Gómez',
    conflictoAdvertido: true,
    motivo: null,
    realizadoPor: 'María Rodríguez',
    fechaHora: '2026-10-19T09:00:00',
  },
];

/** Criterio 3: asignación inicial y una reasignación con motivo. */
export const ConMovimientos = { args: { movimientos: MOVIMIENTOS } };

export const SinMovimientos = { args: { movimientos: [] } };

export const Cargando = { args: { movimientos: null } };

export const ErrorAlCargar = { args: { movimientos: null, error: true, onReintentar: () => {} } };
