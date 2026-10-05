/**
 * @file ResetPasswordPage.jsx
 * @description Página para definir la nueva contraseña con el token del correo (HU-32, RF58 / CU-28).
 * Ruta: /#/reset-password?token=<uuid>. La ruta coincide con `app.mail.reset-password-path`
 * del backend.
 * @module pages/ResetPasswordPage
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthLayout from '../features/auth/components/AuthLayout';
import ResetPasswordForm from '../features/auth/components/ResetPasswordForm';

/**
 * @param {Object} props
 * @param {string} [props.token] - Permite fijar el token sin URL (Storybook).
 * @param {Object} [props.servicio] - API simulada opcional (Storybook).
 */
export default function ResetPasswordPage({ token, servicio }) {
  const [searchParams] = useSearchParams();
  const tokenUrl = token ?? searchParams.get('token');

  return (
    <AuthLayout>
      <ResetPasswordForm token={tokenUrl} {...(servicio ? { servicio } : {})} />
    </AuthLayout>
  );
}
