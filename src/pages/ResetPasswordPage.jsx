/**
 * @file ResetPasswordPage.jsx
 * @description Página donde aterriza el enlace de recuperación enviado por
 * correo (?token=...). HU-32 / RF58.
 *
 * @module pages/ResetPasswordPage
 */

import React from 'react';
import AuthLayout from '../features/auth/components/AuthLayout';
import ResetPasswordForm from '../features/auth/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}