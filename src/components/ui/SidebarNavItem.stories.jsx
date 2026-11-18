import { LayoutDashboard } from 'lucide-react';
import SidebarNavItem from './SidebarNavItem';

export default {
  title: 'UI/SidebarNavItem',
  component: SidebarNavItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isActive: { control: 'boolean' },
    isCollapsed: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
};

export const NormalActivo = {
  args: {
    item: { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    isActive: true,
    isCollapsed: false,
  },
  render: (args) => (
    <div className="w-64 p-4 bg-brand-700">
      <SidebarNavItem {...args} />
    </div>
  ),
};

export const NormalInactivo = {
  args: {
    item: { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    isActive: false,
    isCollapsed: false,
  },
  render: (args) => (
    <div className="w-64 p-4 bg-brand-700">
      <SidebarNavItem {...args} />
    </div>
  ),
};

export const ColapsadoActivo = {
  args: {
    item: { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    isActive: true,
    isCollapsed: true,
  },
  render: (args) => (
    <div className="w-20 p-4 bg-brand-700 flex justify-center">
      <SidebarNavItem {...args} />
    </div>
  ),
};
