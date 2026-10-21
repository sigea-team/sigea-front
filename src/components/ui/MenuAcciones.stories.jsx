import { CopyPlus, History, ShieldCheck, Tags, Trash2, TrendingUp, Users, Wallet } from 'lucide-react';
import MenuAcciones from './MenuAcciones';

export default {
  title: 'UI/MenuAcciones',
  component: MenuAcciones,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 460, minWidth: 360, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

const log = (accion) => () => console.log(accion);

const grupos = (eliminable) => [
  {
    titulo: 'Configuración del evento',
    acciones: [
      { id: 'parametros', etiqueta: 'Tipos y líneas temáticas', icono: Tags, onClick: log('parametros') },
      { id: 'comite', etiqueta: 'Comité organizador', icono: Users, onClick: log('comite') },
    ],
  },
  {
    titulo: 'Presupuesto',
    acciones: [
      { id: 'presupuesto', etiqueta: 'Presupuesto preliminar', icono: Wallet, onClick: log('presupuesto') },
      { id: 'aprobado', etiqueta: 'Presupuesto aprobado', icono: ShieldCheck, onClick: log('aprobado') },
      { id: 'ejecucion', etiqueta: 'Gastos y ejecución', icono: TrendingUp, onClick: log('ejecucion') },
    ],
  },
  {
    titulo: 'Ediciones',
    acciones: [
      { id: 'historial', etiqueta: 'Historial de ediciones', icono: History, onClick: log('historial') },
      { id: 'edicion', etiqueta: 'Crear nueva edición', icono: CopyPlus, onClick: log('edicion') },
    ],
  },
  {
    acciones: [
      {
        id: 'eliminar',
        etiqueta: 'Eliminar evento',
        icono: Trash2,
        peligro: true,
        disabled: !eliminable,
        motivo: 'Solo se puede eliminar mientras está en configuración.',
        onClick: log('eliminar'),
      },
    ],
  },
];

/** Evento en configuración: todas las acciones disponibles. Prueba también con el teclado (↓, ↑, Escape). */
export const EventoEnConfiguracion = {
  args: { grupos: grupos(true), ariaLabel: 'Más acciones de prueba editada' },
};

/** Evento habilitado: «Eliminar evento» aparece deshabilitado con su motivo. */
export const EventoHabilitado = {
  args: { grupos: grupos(false), ariaLabel: 'Más acciones de Congreso de Ingeniería de Sistemas' },
};
