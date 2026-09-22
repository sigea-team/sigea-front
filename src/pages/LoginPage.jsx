import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import LoginForm from '../features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <MainLayout>
      <LoginForm />
    </MainLayout>
  );
}
