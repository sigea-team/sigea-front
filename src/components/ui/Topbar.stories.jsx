import Topbar from './Topbar';

export default {
  title: 'UI/Topbar',
  component: Topbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    title: { control: 'text' },
    onLogout: { action: 'logged out' },
  },
};

export const Default = {
  args: {
    title: 'Dashboard Principal',
    usuario: {
      nombreCompleto: 'Carlos Andrés Gómez',
      rol: 'Organizador',
      correo: 'carlos.gomez@ufps.edu.co',
    },
  },
};

export const ConAvatar = {
  args: {
    title: 'Gestión de Convocatorias',
    usuario: {
      nombreCompleto: 'Dra. Elena Rossi',
      rol: 'Comité Evaluador',
      correo: 'elena.rossi@ufps.edu.co',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    },
  },
};
