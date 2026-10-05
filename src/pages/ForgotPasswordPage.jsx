/**
 * @file ForgotPasswordPage.jsx
 * @description Página de solicitud de recuperación de contraseña (HU-32, RF58 / CU-28).
 * Ruta: /#/recuperar-password (a ella lleva "¿Olvidaste tu contraseña?" del login, HU-01).
 * @module pages/ForgotPasswordPage
 */

import React from 'react';
import AuthLayout from '../features/auth/components/AuthLayout';
import ForgotPasswordForm from '../features/auth/components/ForgotPasswordForm';

/**
 * @param {Object} props
 * @param {Object} [props.servicio] - API simulada opcional (Storybook).
 */
export default function ForgotPasswordPage({ servicio }) {
  return (
    <AuthLayout>
      <ForgotPasswordForm {...(servicio ? { servicio } : {})} />
    </AuthLayout>
  );
}
