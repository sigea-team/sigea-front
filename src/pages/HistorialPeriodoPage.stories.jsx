import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import HistorialPeriodoPage from './HistorialPeriodoPage';

export default {
  title: 'Pages/HistorialPeriodoPage',
  component: HistorialPeriodoPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

const admin = {
  nombreCompleto: 'Admin SIGEA',
  rol: 'ADMIN',
  roles: ['ADMIN'],
  permisos: ['EVENTOS_VER', 'REPORTES_VER'],
};

export const VistaPrincipal = {
  args: {
    usuarioProp: admin,
  },
};
