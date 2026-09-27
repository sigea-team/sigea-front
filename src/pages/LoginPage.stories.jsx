import React from 'react';
import LoginPage from './LoginPage';

export default {
  title: 'Pages/LoginPage',
  component: LoginPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  render: () => <LoginPage />,
};
