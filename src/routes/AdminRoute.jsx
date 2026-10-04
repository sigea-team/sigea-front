/**
 * @file AdminRoute.jsx
 * @description Restringe rutas a usuarios con rol administrador (HU-02, HU-03).
 * Debe usarse DENTRO de {@link ProtectedRoute}, que ya garantiza que hay sesión.
 * Si el usuario no es administrador se le envía al dashboard, aunque haya escrito la URL
 * directamente. El backend vuelve a validar los permisos en cada petición (responde 403).
 *
 * Uso:
 * <Route element={<ProtectedRoute />}>
 *   <Route element={<AdminRoute />}>
 *     <Route path="/auditoria" element={<AuditoriaPage />} />
 *   </Route>
 * </Route>
 *
 * @module routes/AdminRoute
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/authStore';
import { esAdministrador } from '../utils/permisos';

export default function AdminRoute() {
  const auth = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const usuario = auth?.usuario || storeUser;

  if (!esAdministrador(usuario)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
