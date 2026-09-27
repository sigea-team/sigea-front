import React from 'react';
import ForgotPasswordPage from './ForgotPasswordPage';

export default {
  title: 'Pages/ForgotPasswordPage',
  component: ForgotPasswordPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () => <ForgotPasswordPage />,
};
