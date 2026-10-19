import HistorialPresupuesto from './HistorialPresupuesto';
import { HISTORIAL_MOCK } from '../mocks/presupuestoMock';

export default {
  title: 'Features/Presupuesto/HistorialPresupuesto',
  component: HistorialPresupuesto,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const REGISTROS = [...HISTORIAL_MOCK]
  .reverse()
  .map((h) => ({ ...h, usuarioId: 2, usuarioNombre: 'Cristian Rodríguez' }));

/** Criterio 2: creaciones, ediciones (antes → después) y eliminaciones con su efecto en el total. */
export const Completo = {
  args: { registros: REGISTROS },
};

/** Filtrado por un rubro desde la tabla. */
export const FiltradoPorRubro = {
  args: { registros: REGISTROS, filtroRubro: { id: 1, nombre: 'Transporte de conferencistas' }, onQuitarFiltro: () => {} },
};

export const SinCambios = {
  args: { registros: [] },
};

export const Cargando = {
  args: { registros: null },
};

export const ErrorAlCargar = {
  args: { registros: null, error: 'No fue posible conectarse con el servidor.', onReintentar: () => {} },
};
