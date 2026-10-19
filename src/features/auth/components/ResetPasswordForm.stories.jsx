import React from 'react';
import ResetPasswordForm from './ResetPasswordForm';
import AuthLayout from './AuthLayout';
import {
  servicioRecuperacionExitoso,
  servicioTokenUsado,
  servicioTokenExpirado,
  servicioSinConexion,
  TOKEN_EJEMPLO,
} from '../mocks/recuperacionMock';

export default {
  title: 'Features/Auth/ResetPasswordForm',
  component: ResetPasswordForm,
  tags: ['autodocs'],
};

const Contenedor = ({ children }) => <div className="max-w-[720px] mx-auto p-4">{children}</div>;

/** Criterio 2: token vigente. Prueba con "NuevaSegura123*". */
export const TokenVigente = {
  render: () => (
    <Contenedor>
      <ResetPasswordForm token={TOKEN_EJEMPLO} servicio={servicioRecuperacionExitoso} />
    </Contenedor>
  ),
};

/** Criterio 3: el backend responde que el enlace ya fue usado. */
export const TokenYaUtilizado = {
  render: () => (
    <Contenedor>
      <ResetPasswordForm token={TOKEN_EJEMPLO} servicio={servicioTokenUsado} />
    </Contenedor>
  ),
};

/** Criterio 3: el backend responde que el enlace expiró. */
export const TokenExpirado = {
  render: () => (
    <Contenedor>
      <ResetPasswordForm token={TOKEN_EJEMPLO} servicio={servicioTokenExpirado} />
    </Contenedor>
  ),
};

/** Se abrió la ruta sin ?token= en la URL. */
export const SinToken = {
  render: () => (
    <Contenedor>
      <ResetPasswordForm token={null} servicio={servicioRecuperacionExitoso} />
    </Contenedor>
  ),
};

export const SinConexion = {
  render: () => (
    <Contenedor>
      <ResetPasswordForm token={TOKEN_EJEMPLO} servicio={servicioSinConexion} />
    </Contenedor>
  ),
};

export const InsideLayout = {
  render: () => (
    <AuthLayout>
      <ResetPasswordForm token={TOKEN_EJEMPLO} servicio={servicioRecuperacionExitoso} />
    </AuthLayout>
  ),
  parameters: { layout: 'fullscreen' },
};
