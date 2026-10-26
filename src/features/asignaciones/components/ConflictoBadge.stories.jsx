import ConflictoBadge from './ConflictoBadge';

export default {
  title: 'Features/Asignaciones/ConflictoBadge',
  component: ConflictoBadge,
  tags: ['autodocs'],
};

/** El evaluador es autor de la propuesta: la asignación se impide (Criterio 2). */
export const Bloqueante = {
  args: {
    nivel: 'BLOQUEANTE',
    detalle: 'Carlos Ruiz figura como autor principal de la propuesta. Un evaluador no puede evaluar una propuesta propia.',
  },
};

/** Comparte afiliación con un autor: se puede asignar confirmando (Criterio 2). */
export const Advertencia = {
  args: {
    nivel: 'ADVERTENCIA',
    detalle: "Sofía Mora comparte la afiliación 'UFPS' con el autor Carlos Ruiz.",
  },
};

/** Sin conflicto: no se muestra ningún indicador. */
export const SinConflicto = {
  args: { nivel: 'NINGUNO' },
};
