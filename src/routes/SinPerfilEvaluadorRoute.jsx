/**
 * @file SinPerfilEvaluadorRoute.jsx
 * @description Rutas que no corresponden al perfil «Evaluador» (por ejemplo, Eventos). Si la sesión entró como
 * evaluador, se la envía a su bandeja de evaluaciones aunque haya escrito la URL directamente.
 * Debe usarse DENTRO de {@link ProtectedRoute}.
 * @module routes/SinPerfilEvaluadorRoute
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/authStore';
import { veEventos } from '../utils/permisos';

export default function SinPerfilEvaluadorRoute() {
  const auth = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const usuario = auth?.usuario || storeUser;

  if (!veEventos(usuario)) {
    return <Navigate to="/evaluaciones" replace />;
  }

  return <Outlet />;
}
