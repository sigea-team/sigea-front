/**
 * @file ProtectedRoute.jsx
 * @description Envuelve rutas que requieren sesión activa (token en el authStore).
 * Uso: <Route element={<ProtectedRoute />}><Route path="/dashboard" element={<DashboardPage />} /></Route>
 * @module routes/ProtectedRoute
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
