import React from 'react';
import LoginForm from './LoginForm';
import AuthLayout from './AuthLayout';

export default {
  title: 'Features/Auth/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
};

export const Default = {
  render: () => (
    <div className="max-w-[720px] mx-auto p-4">
      <LoginForm />
    </div>
  ),
};

export const InsideLayout = {
  render: () => (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
