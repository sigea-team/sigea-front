import React from 'react';
import Button from './Button';

export default {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline'],
      description: 'Variante estilística según la jerarquía de la acción',
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description: 'Tipo de botón HTML nativo',
    },
    loading: {
      control: 'boolean',
      description: 'Muestra spinner de carga y deshabilita interacción',
    },
    disabled: {
      control: 'boolean',
      description: 'Deshabilita el botón',
    },
    onClick: { action: 'clicked' },
  },
};

export const Primary = {
  args: {
    children: 'Ingresar a SIGEA',
    variant: 'primary',
  },
};

export const Secondary = {
  args: {
    children: 'Cancelar',
    variant: 'secondary',
  },
};

export const Outline = {
  args: {
    children: 'Ver Detalles',
    variant: 'outline',
  },
};

export const Loading = {
  args: {
    children: 'Guardando',
    variant: 'primary',
    loading: true,
  },
};

export const Disabled = {
  args: {
    children: 'Acción Deshabilitada',
    variant: 'primary',
    disabled: true,
  },
};

export const AllVariants = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="primary" loading>Loading</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </div>
  ),
};
