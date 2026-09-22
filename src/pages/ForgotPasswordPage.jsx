/**
 * @file ForgotPasswordPage.jsx
 * @description Placeholder del flujo de recuperación de contraseña (CU-28 / RF58).
 *
 * HU-01 (Criterio 4) solo exige que, desde la pantalla de login, el sistema redirija
 * al flujo de recuperación de contraseña cuando el usuario elige esa opción. La
 * implementación funcional completa (solicitar enlace, validar token, definir nueva
 * contraseña) corresponde a una historia de usuario aparte (RF58), aún no desarrollada.
 * Esta página deja el punto de entrada ya conectado para que esa HU la reemplace.
 *
 * @module pages/ForgotPasswordPage
 */

import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

export default function ForgotPasswordPage() {
  return (
    <MainLayout>
      <div className="bg-white rounded-[16px] border border-[#e5e7ea] p-8 sm:p-12 shadow-sm text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#a6192e] inline-block mb-1.5">
          Recuperar acceso
        </span>
        <h2 className="font-serif-title text-3xl text-[#1f2023] tracking-tight mb-3">
          Recuperación de contraseña
        </h2>
        <p className="text-sm text-[#5b5f66] max-w-md mx-auto">
          Esta funcionalidad estará disponible próximamente. Por ahora, comunícate con el
          administrador del sistema si necesitas restablecer tu contraseña.
        </p>
        <Link
          to="/login"
          className="inline-block mt-6 text-sm font-semibold text-[#a6192e] hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </MainLayout>
  );
}
