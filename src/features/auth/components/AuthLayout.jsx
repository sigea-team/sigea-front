import React from 'react';
import MainLayout from '../../../components/ui/MainLayout';

/**
 * @file AuthLayout.jsx
 * @description Layout específico de autenticación que reutiliza el MainLayout modular.
 * @module features/auth/components/AuthLayout
 */
export default function AuthLayout({ children }) {
  return <MainLayout>{children}</MainLayout>;
}
