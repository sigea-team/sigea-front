import React from 'react';
import ForgotPasswordPage from './ForgotPasswordPage';
import { servicioRecuperacionExitoso } from '../features/auth/mocks/recuperacionMock';

export default {
  title: 'Pages/ForgotPasswordPage',
  component: ForgotPasswordPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () => <ForgotPasswordPage servicio={servicioRecuperacionExitoso} />,
};
