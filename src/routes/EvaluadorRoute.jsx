/**
 * @file EvaluadorRoute.jsx
 * @description Restringe rutas al perfil «Evaluador» (HU-17): la sesión debe haber entrado con ese perfil y la
 * cuenta debe tener un rol con el permiso PROPUESTAS_EVALUAR; los administradores también pasan.
 * Una cuenta con el permiso que entró como Asistente o Ponente no pasa.
 * Debe usarse DENTRO de {@link ProtectedRoute}. Si la cuenta no está habilitada se la envía al dashboard,
 * aunque haya escrito la URL directamente. El backend también lo valida y responde 403.
 * @module routes/EvaluadorRoute
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthStore } from '../store/authStore';
import { veEvaluaciones } from '../utils/permisos';

export default function EvaluadorRoute() {
  const auth = useAuth();
  const storeUser = useAuthStore((state) => state.usuario);
  const usuario = auth?.usuario || storeUser;

  if (!veEvaluaciones(usuario)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
