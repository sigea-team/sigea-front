/**
 * ============================================================================
 * App.jsx — este archivo YA EXISTE y es compartido con el resto del equipo
 * (ahora mismo solo renderiza RegisterForm, sin rutas). Avisa en el grupo
 * antes de reemplazarlo, porque cualquiera que agregue una pantalla nueva
 * (login, dashboard, etc.) también necesita tocarlo.
 * ============================================================================
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import RegisterForm from './features/auth/components/RegisterForm';
import ForgotPasswordForm from './features/auth/components/ForgotPasswordForm';
import ResetPasswordForm from './features/auth/components/ResetPasswordForm';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
