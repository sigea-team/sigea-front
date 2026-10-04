import { Pencil, Trash2 } from 'lucide-react';
import BotonAccion from './BotonAccion';

export default {
  title: 'UI/BotonAccion',
  component: BotonAccion,
  tags: ['autodocs'],
};

export const Normal = {
  args: {
    icono: Pencil,
    etiqueta: 'Editar elemento',
    onClick: () => console.log('Clic'),
  },
};

export const DeshabilitadoConMotivo = {
  args: {
    icono: Pencil,
    etiqueta: 'Editar elemento',
    disabled: true,
    motivo: 'Esta acción no está disponible en el estado actual.',
    onClick: () => {},
  },
};

export const Peligro = {
  args: {
    icono: Trash2,
    etiqueta: 'Eliminar elemento',
    peligro: true,
    onClick: () => console.log('Eliminar'),
  },
};
