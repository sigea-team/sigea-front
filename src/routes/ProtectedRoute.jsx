/**
 * @file ProtectedRoute.jsx
 * @description Envuelve rutas que requieren sesión activa (token en AuthContext o authStore).
 * Uso: <Route element={<ProtectedRoute />}><Route path="/dashboard" element={<DashboardPage />} /></Route>
 * @module routes/ProtectedRoute
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute() {
  const { token: contextToken } = useAuth();
  const storeToken = useAuthStore((state) => state.token);
  const token = contextToken || storeToken;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
