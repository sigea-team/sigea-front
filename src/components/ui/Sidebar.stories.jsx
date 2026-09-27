import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default {
  title: 'UI/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    activeItem: {
      control: { type: 'select' },
      options: ['dashboard', 'convocatorias', 'eventos', 'certificados', 'configuracion'],
    },
    onLogout: { action: 'logged out' },
    onSelectNav: { action: 'selected nav' },
  },
};

export const Default = {
  args: {
    activeItem: 'dashboard',
    usuario: {
      nombreCompleto: 'Carlos Andrés Gómez',
      rol: 'Organizador',
    },
  },
};

export const ConvocatoriasActivas = {
  args: {
    activeItem: 'convocatorias',
    usuario: {
      nombreCompleto: 'María Fernanda Ruiz',
      rol: 'Ponente',
    },
  },
};

export const Interactive = {
  render: () => {
    const [active, setActive] = useState('dashboard');
    return (
      <div className="h-screen bg-[#edeeef] flex">
        <Sidebar
          activeItem={active}
          onSelectNav={(id) => setActive(id)}
          usuario={{ nombreCompleto: 'Docente Investigador', rol: 'Docente UFPS' }}
        />
      </div>
    );
  },
};
