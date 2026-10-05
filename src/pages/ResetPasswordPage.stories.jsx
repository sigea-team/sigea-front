import React from 'react';
import ResetPasswordPage from './ResetPasswordPage';
import {
  servicioRecuperacionExitoso,
  servicioTokenExpirado,
  TOKEN_EJEMPLO,
} from '../features/auth/mocks/recuperacionMock';

export default {
  title: 'Pages/ResetPasswordPage',
  component: ResetPasswordPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () => <ResetPasswordPage token={TOKEN_EJEMPLO} servicio={servicioRecuperacionExitoso} />,
};

export const EnlaceExpirado = {
  render: () => <ResetPasswordPage token={TOKEN_EJEMPLO} servicio={servicioTokenExpirado} />,
};

export const SinToken = {
  render: () => <ResetPasswordPage token={null} servicio={servicioRecuperacionExitoso} />,
};
