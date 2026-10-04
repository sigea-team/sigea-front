import { Pencil, Trash2 } from 'lucide-react';
import BotonAccion from './BotonAccion';

export default {
  title: 'Features/Convocatorias/BotonAccion',
  component: BotonAccion,
  tags: ['autodocs'],
};

export const Normal = {
  args: {
    icono: Pencil,
    etiqueta: 'Editar convocatoria',
    onClick: () => console.log('Clic'),
  },
};

export const DeshabilitadoConMotivo = {
  args: {
    icono: Pencil,
    etiqueta: 'Editar convocatoria',
    disabled: true,
    motivo: 'Solo se pueden editar convocatorias en borrador.',
    onClick: () => {},
  },
};

export const Peligro = {
  args: {
    icono: Trash2,
    etiqueta: 'Eliminar convocatoria',
    peligro: true,
    onClick: () => console.log('Eliminar'),
  },
};
