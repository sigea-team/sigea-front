import RubrosTabla from './RubrosTabla';

export default {
  title: 'Features/Presupuesto/RubrosTabla',
  component: RubrosTabla,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const RUBROS = [
  { id: 1, eventoId: 3, nombre: 'Transporte de conferencistas', cantidad: 2, valorUnitarioProyectado: 350000, subtotal: 700000, activo: true },
  { id: 2, eventoId: 3, nombre: 'Refrigerios', cantidad: 150, valorUnitarioProyectado: 7500, subtotal: 1125000, activo: true },
  { id: 4, eventoId: 3, nombre: 'Material impreso', cantidad: 200, valorUnitarioProyectado: 2500, subtotal: 500000, activo: true },
  { id: 5, eventoId: 3, nombre: 'Auditorio institucional', cantidad: 1, valorUnitarioProyectado: 0, subtotal: 0, activo: true },
];

const ELIMINADO = { id: 3, eventoId: 3, nombre: 'Hospedaje', cantidad: 3, valorUnitarioProyectado: 220000, subtotal: 660000, activo: false };

const esperar = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));
const ok = async () => {
  await esperar();
  return {};
};

/** Editable: usa el lápiz para editar en la fila o la papelera para eliminar con motivo. */
export const Editable = {
  args: { rubros: RUBROS, total: 2325000, editable: true, onActualizar: ok, onEliminar: ok, onVerHistorial: () => {} },
};

/** Con «Mostrar eliminados»: el rubro eliminado aparece tachado y no suma al total. */
export const ConEliminados = {
  args: { ...Editable.args, rubros: [...RUBROS, ELIMINADO] },
};

/** Solo lectura (evento en ejecución o presupuesto aprobado): solo se puede ver el historial. */
export const SoloLectura = {
  args: { ...Editable.args, editable: false },
};

export const SinRubros = {
  args: { ...Editable.args, rubros: [], total: 0 },
};
