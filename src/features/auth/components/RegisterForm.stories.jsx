import React from 'react';
import RegisterForm from './RegisterForm';
import MainLayout from '../../../components/ui/MainLayout';

export default {
  title: 'Features/Auth/RegisterForm',
  component: RegisterForm,
  tags: ['autodocs'],
};

export const Default = {
  render: () => (
    <div className="max-w-[720px] mx-auto p-4">
      <RegisterForm />
    </div>
  ),
};

export const InsideLayout = {
  render: () => (
    <MainLayout>
      <RegisterForm />
    </MainLayout>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};
