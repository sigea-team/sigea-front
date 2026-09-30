/**
 * @file ForgotPasswordPage.jsx
 * @description Implementación real del flujo de recuperación de contraseña
 * (HU-32 / RF58). Reemplaza el placeholder dejado por HU-01, que ya conectó
 * el punto de entrada en /recuperar-password desde LoginForm.jsx.
 *
 * @module pages/ForgotPasswordPage
 */

import React from 'react';
import AuthLayout from '../features/auth/components/AuthLayout';
import ForgotPasswordForm from '../features/auth/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}