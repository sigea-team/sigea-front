import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import RegisterForm from '../features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <MainLayout>
      <RegisterForm />
    </MainLayout>
  );
}
