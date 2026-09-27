import React from 'react';
import RegisterPage from './RegisterPage';

export default {
  title: 'Pages/RegisterPage',
  component: RegisterPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () => <RegisterPage />,
};
