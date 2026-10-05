import React from 'react';
import ForgotPasswordForm from './ForgotPasswordForm';
import AuthLayout from './AuthLayout';
import { servicioRecuperacionExitoso, servicioSinConexion } from '../mocks/recuperacionMock';

export default {
  title: 'Features/Auth/ForgotPasswordForm',
  component: ForgotPasswordForm,
  tags: ['autodocs'],
};

const Contenedor = ({ children }) => <div className="max-w-[720px] mx-auto p-4">{children}</div>;

/** Criterios 1 y 4: escribe cualquier correo y envía; siempre muestra el mismo mensaje genérico. */
export const Default = {
  render: () => (
    <Contenedor>
      <ForgotPasswordForm servicio={servicioRecuperacionExitoso} />
    </Contenedor>
  ),
};

/** Servidor apagado: muestra la alerta de conexión. */
export const SinConexion = {
  render: () => (
    <Contenedor>
      <ForgotPasswordForm servicio={servicioSinConexion} />
    </Contenedor>
  ),
};

export const InsideLayout = {
  render: () => (
    <AuthLayout>
      <ForgotPasswordForm servicio={servicioRecuperacionExitoso} />
    </AuthLayout>
  ),
  parameters: { layout: 'fullscreen' },
};
