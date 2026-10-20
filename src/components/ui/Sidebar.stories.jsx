import { useState } from 'react';
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
      options: ['dashboard', 'convocatorias', 'eventos', 'certificados', 'cuenta', 'roles', 'configuracion'],
    },
    collapsed: { control: 'boolean' },
    onLogout: { action: 'logged out' },
    onSelectNav: { action: 'selected nav' },
  },
};

export const Default = {
  args: {
    activeItem: 'dashboard',
    collapsed: false,
  },
};

export const Colapsado = {
  args: {
    activeItem: 'dashboard',
    collapsed: true,
  },
};

export const Administrador = {
  args: {
    activeItem: 'roles',
    usuario: {
      rol: 'ADMIN',
      roles: ['ADMIN'],
    },
  },
};

export const ConvocatoriasActivas = {
  args: {
    activeItem: 'convocatorias',
  },
};

export const Interactive = {
  render: () => {
    const [active, setActive] = useState('dashboard');
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
      <div className="h-screen bg-[#edeeef] flex">
        <Sidebar
          activeItem={active}
          onSelectNav={(id) => setActive(id)}
          collapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          usuario={{ rol: 'ADMIN', roles: ['ADMIN'] }}
        />
      </div>
    );
  },
};

