/**
 * @file EvaluadorRoute.jsx
 * @description Restringe rutas a cuentas habilitadas como evaluador (HU-17): las que el administrador
 * asignó a un rol con el permiso PROPUESTAS_EVALUAR, o los administradores.
 * Debe usarse DENTRO de {@link ProtectedRoute}. Si la cuenta no está habilitada se la envía al dashboard,
 * aunque haya escrito la URL directamente. El backend también lo valida y responde 403.
 * @module routes/EvaluadorRoute
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/authStore';
import { puedeEvaluar } from '../utils/permisos';

export default function EvaluadorRoute() {
  const auth = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const usuario = auth?.usuario || storeUser;

  if (!puedeEvaluar(usuario)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
